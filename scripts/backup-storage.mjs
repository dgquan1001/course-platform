// Tải toàn bộ file trong Supabase Storage (ảnh chuyển khoản, ảnh bìa) về máy – backup DB không gồm Storage.
// Cách dùng: npm run backup:storage -- [thư mục đích]   (mặc định backups/storage-<ngày>)
// Lưu ý: mỗi lần chạy tính vào băng thông (egress) của Supabase – gói Free 5 GB/tháng.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { adminClient, loadEnv } from './env.mjs'

const outDir = process.argv[2] || join('backups', `storage-${new Date().toISOString().slice(0, 10)}`)
const supabase = adminClient(loadEnv())
const PAGE = 1000

// Liệt kê đệ quy: Storage chỉ trả từng cấp thư mục, mục có id null là thư mục con
async function listAll(bucket, prefix = '') {
  const files = []
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: PAGE, offset })
    if (error) throw error
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id) files.push(path)
      else files.push(...(await listAll(bucket, path)))
    }
    if (data.length < PAGE) return files
  }
}

const { data: buckets, error } = await supabase.storage.listBuckets()
if (error) throw error

let total = 0
let bytes = 0
for (const bucket of buckets) {
  const files = await listAll(bucket.id)
  for (const path of files) {
    const { data: blob, error: downloadError } = await supabase.storage.from(bucket.id).download(path)
    if (downloadError) throw new Error(`${bucket.id}/${path}: ${downloadError.message}`)
    const target = join(outDir, bucket.id, path)
    mkdirSync(dirname(target), { recursive: true })
    const buffer = Buffer.from(await blob.arrayBuffer())
    writeFileSync(target, buffer)
    bytes += buffer.length
  }
  total += files.length
  console.log(`✔ ${bucket.id}: ${files.length} file`)
}

console.log(`✔ Đã tải ${total} file (${(bytes / 1024 / 1024).toFixed(1)} MB) vào ${outDir}`)
