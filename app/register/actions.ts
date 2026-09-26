'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { setFlash } from '@/lib/flash'
import { isPhoneTaken } from '@/lib/accounts'
import { isValidEmail, normalizePhone, phoneToAuthEmail, realEmail } from '@/lib/phone'

export type RegisterState = { error: string | null }

const MAX_FILE_SIZE = 5 * 1024 * 1024
const IMAGE_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const fullName = String(formData.get('fullName') ?? '').trim()
  // Email không bắt buộc: khách không có email sẽ đăng nhập bằng số điện thoại
  let email: string | null = String(formData.get('email') ?? '').trim().toLowerCase() || null
  const phone = normalizePhone(String(formData.get('phone') ?? ''))
  const password = String(formData.get('password') ?? '')
  const courseId = String(formData.get('courseId') ?? '')
  const proof = formData.get('paymentProof')

  const supabase = createClient()
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser()

  if (!fullName) return { error: 'Vui lòng nhập họ và tên.' }
  if (!sessionUser && email && !isValidEmail(email)) return { error: 'Địa chỉ email không hợp lệ.' }
  if (!phone) return { error: 'Số điện thoại không hợp lệ (VD: 0912345678).' }
  if (!sessionUser && password.length < 6) return { error: 'Mật khẩu cần ít nhất 6 ký tự.' }
  if (!courseId) return { error: 'Vui lòng chọn khóa học.' }
  if (!(proof instanceof File) || proof.size === 0) {
    return { error: 'Vui lòng tải lên ảnh chụp chuyển khoản.' }
  }
  // Một số trình duyệt gửi ảnh HEIC (iPhone) không kèm MIME type: xác định theo đuôi file
  const nameExt = proof.name.split('.').pop()?.toLowerCase() ?? ''
  const contentType =
    proof.type || Object.keys(IMAGE_EXT).find((t) => IMAGE_EXT[t] === (nameExt === 'jpeg' ? 'jpg' : nameExt)) || ''
  const ext = IMAGE_EXT[contentType]
  if (!ext) return { error: 'Ảnh chuyển khoản phải là JPG, PNG, WEBP hoặc HEIC.' }
  if (proof.size > MAX_FILE_SIZE) return { error: 'Ảnh chuyển khoản tối đa 5MB.' }

  const admin = createAdminClient()

  const { data: course } = await admin
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('status', 'published')
    .maybeSingle()
  if (!course) return { error: 'Khóa học không tồn tại hoặc đã ngừng nhận đăng ký.' }

  // User đã đăng nhập: đăng ký thêm khóa bằng tài khoản hiện tại.
  // User mới: tạo tài khoản đã xác nhận email (admin duyệt đơn thay cho bước xác nhận email);
  // không có email thì dùng email nội bộ theo SĐT để đăng nhập bằng số điện thoại.
  let userId: string
  let createdNewUser = false
  const authEmail = email ?? phoneToAuthEmail(phone)

  if (sessionUser) {
    userId = sessionUser.id
    email = realEmail(sessionUser.email)

    const { data: existing } = await admin
      .from('registrations')
      .select('status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .in('status', ['pending', 'approved'])
      .limit(1)
    if (existing?.length) {
      return {
        error:
          existing[0].status === 'approved'
            ? 'Bạn đã sở hữu khóa học này. Vào "Khóa học của tôi" để học.'
            : 'Bạn đã đăng ký khóa này và đang chờ xác nhận.',
      }
    }
  } else {
    // Số điện thoại dùng để đăng nhập nên mỗi SĐT chỉ gắn với một tài khoản
    if (await isPhoneTaken(phone)) {
      return {
        error: 'Số điện thoại này đã có tài khoản. Vui lòng đăng nhập trước, sau đó đăng ký thêm khóa học.',
      }
    }
    const { data, error } = await admin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    })
    if (error || !data.user) {
      if (error?.code === 'email_exists' || error?.message.toLowerCase().includes('already')) {
        return {
          error: 'Email này đã có tài khoản. Vui lòng đăng nhập trước, sau đó đăng ký thêm khóa học.',
        }
      }
      return { error: `Không tạo được tài khoản: ${error?.message}` }
    }
    userId = data.user.id
    createdNewUser = true
    // Tài khoản chỉ có SĐT: profile không lưu email nội bộ (trigger đã xử lý, đặt lại cho chắc chắn)
    if (!email) await admin.from('profiles').update({ email: null }).eq('id', userId)
  }

  const rollbackUser = async () => {
    if (createdNewUser) await admin.auth.admin.deleteUser(userId)
  }

  const proofPath = `${userId}/${randomUUID()}.${ext}`
  const { error: uploadError } = await admin.storage
    .from('payment-proofs')
    .upload(proofPath, proof, { contentType })
  if (uploadError) {
    await rollbackUser()
    return { error: `Không tải được ảnh chuyển khoản: ${uploadError.message}` }
  }

  const { error: insertError } = await admin.from('registrations').insert({
    user_id: userId,
    course_id: courseId,
    full_name: fullName,
    email,
    phone,
    payment_proof_path: proofPath,
  })
  if (insertError) {
    await admin.storage.from('payment-proofs').remove([proofPath])
    await rollbackUser()
    return { error: `Không gửi được đơn đăng ký: ${insertError.message}` }
  }

  // Đăng nhập luôn để học viên theo dõi trạng thái đơn
  if (createdNewUser) {
    await supabase.auth.signInWithPassword({ email: authEmail, password })
  }

  revalidatePath('/admin')
  setFlash('Đã gửi đăng ký thành công!')
  redirect('/courses?registered=1')
}
