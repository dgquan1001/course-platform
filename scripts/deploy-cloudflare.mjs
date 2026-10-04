// Deploy lên Cloudflare Workers từ máy Windows (Đợt 17). `opennextjs-cloudflare deploy` gọi wrangler qua `npm exec` + shell nên trên
// Windows treo ở bước tạo bảng D1 (câu SQL bị chèn ký tự escape sai). Script làm từng bước:
//   1. build OpenNext (dùng .env.local; NEXT_PUBLIC_SITE_URL lấy từ biến môi trường nếu có)
//   2. nạp trang dựng sẵn vào R2 (`populateCache remote`) – dừng ngay khi xong phần R2, bỏ qua bước D1 bị treo
//   3. tạo bảng D1 `revalidations` nếu chưa có (gọi wrangler trực tiếp, không qua shell)
//   4. `wrangler deploy` với OPEN_NEXT_DEPLOY=true để wrangler không chuyển lại sang lệnh deploy của OpenNext
// Linux / Workers Builds: dùng `npm run deploy` bình thường.
// Chạy: npm run deploy:win   (cần `npx wrangler login` trước)
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const node = (args, extraEnv = {}) =>
  spawnSync(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, ...extraEnv } })
const OPENNEXT = 'node_modules/@opennextjs/cloudflare/dist/cli/index.js'
const WRANGLER = 'node_modules/wrangler/bin/wrangler.js'

function step(title) {
  console.log(`\n=== ${title}`)
}

step('1/4 Build OpenNext')
if (node([OPENNEXT, 'build']).status !== 0) process.exit(1)

step('2/4 Nạp trang dựng sẵn vào R2')
await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [OPENNEXT, 'populateCache', 'remote'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
  let done = false
  const onData = (chunk) => {
    const text = chunk.toString()
    if (!/it\/s/.test(text)) process.stdout.write(text)
    if (/Successfully populated cache/.test(text) && !done) {
      done = true
      // Phần R2 xong; bước D1 tiếp theo bị treo trên Windows → dừng cả cây tiến trình
      if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      else child.kill()
      resolve()
    }
  }
  child.stdout.on('data', onData)
  child.stderr.on('data', onData)
  child.on('exit', () => (done ? resolve() : reject(new Error('Nạp R2 thất bại'))))
})

step('3/4 Bảng D1 cho revalidatePath')
const d1 = node([WRANGLER, 'd1', 'execute', 'NEXT_TAG_CACHE_D1', '--remote', '--command',
  'CREATE TABLE IF NOT EXISTS revalidations (tag TEXT NOT NULL, revalidatedAt INTEGER NOT NULL, stale INTEGER, expire INTEGER default NULL, UNIQUE(tag) ON CONFLICT REPLACE);'])
if (d1.status !== 0) process.exit(1)

step('4/4 Deploy Worker')
process.exit(node([WRANGLER, 'deploy'], { OPEN_NEXT_DEPLOY: 'true' }).status ?? 1)
