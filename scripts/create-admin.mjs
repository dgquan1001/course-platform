// Tạo (hoặc nâng quyền) tài khoản admin.
// Cách dùng: npm run create-admin -- <gmail> <mật khẩu> ["Họ tên"]
import { adminClient, loadEnv } from './env.mjs'

const [email, password, fullName = 'Quản trị viên'] = process.argv.slice(2)
if (!email || !password || password.length < 6) {
  console.error('Cách dùng: npm run create-admin -- <gmail> <mật khẩu (>= 6 ký tự)> ["Họ tên"]')
  process.exit(1)
}

const supabase = adminClient(loadEnv())
const normalizedEmail = email.trim().toLowerCase()

const { data, error } = await supabase.auth.admin.createUser({
  email: normalizedEmail,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
})

let userId = data?.user?.id
if (error) {
  if (error.code !== 'email_exists') throw error
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', normalizedEmail).single()
  if (!profile) throw new Error('Tài khoản đã tồn tại nhưng không tìm thấy profile')
  userId = profile.id
  await supabase.auth.admin.updateUserById(userId, { password })
  console.log('Tài khoản đã tồn tại: đã cập nhật mật khẩu.')
}

const { error: roleError } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId)
if (roleError) throw roleError

console.log(`✔ Admin: ${normalizedEmail} — đăng nhập tại /login rồi vào /admin`)
