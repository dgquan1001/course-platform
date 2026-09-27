'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { setFlash } from '@/lib/flash'
import { isPhoneTaken } from '@/lib/accounts'
import { isValidEmail, normalizePhone, phoneToAuthEmail, realEmail } from '@/lib/phone'
import { MIN_PASSWORD_LENGTH, passwordTooShort } from '@/lib/password'
import { detectImageType, type ImageType } from '@/lib/image-type'
import { clientIp, LIMITS, withinLimit } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { siteConfig } from '@/lib/site-config'
import { CONSENT_VERSION } from '@/lib/consent'

export type RegisterState = { error: string | null }

const MAX_FILE_SIZE = 5 * 1024 * 1024
const IMAGE_EXT: Record<ImageType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/heic': 'heic',
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
  const consent = formData.get('consent') === 'yes'

  const supabase = createClient()
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser()

  if (!fullName) return { error: 'Vui lòng nhập họ và tên.' }
  if (!sessionUser && email && !isValidEmail(email)) return { error: 'Địa chỉ email không hợp lệ.' }
  if (!phone) return { error: 'Số điện thoại không hợp lệ (VD: 0912345678).' }
  if (!sessionUser && password.length < MIN_PASSWORD_LENGTH) return { error: passwordTooShort() }
  if (!sessionUser && !consent) return { error: 'Vui lòng đồng ý Chính sách bảo mật để tạo tài khoản.' }
  if (!courseId) return { error: 'Vui lòng chọn khóa học.' }
  if (!(proof instanceof File) || proof.size === 0) {
    return { error: 'Vui lòng tải lên ảnh chụp chuyển khoản.' }
  }
  if (proof.size > MAX_FILE_SIZE) return { error: 'Ảnh chuyển khoản tối đa 5MB.' }
  // Xác định định dạng theo nội dung file, không tin MIME / đuôi file (file khác đổi đuôi .png bị từ chối)
  const contentType = detectImageType(new Uint8Array(await proof.slice(0, 16).arrayBuffer()))
  if (!contentType) return { error: 'Ảnh chuyển khoản phải là ảnh JPG, PNG, WEBP hoặc HEIC hợp lệ.' }
  const ext = IMAGE_EXT[contentType]

  // Chống bot (nếu đã cấu hình Turnstile) và giới hạn số lần gửi đơn theo IP
  const ip = clientIp()
  if (!(await verifyTurnstile(String(formData.get('cf-turnstile-response') ?? ''), ip))) {
    return { error: 'Vui lòng xác nhận bạn không phải robot rồi bấm Đăng ký lại.' }
  }
  if (!(await withinLimit(`register:${ip}`, LIMITS.register))) {
    return { error: `Bạn đã gửi quá nhiều đơn đăng ký. Vui lòng thử lại sau hoặc gọi ${siteConfig.hotline} để được hỗ trợ.` }
  }

  const admin = createAdminClient()

  const { data: course } = await admin
    .from('courses')
    .select('id, title, price')
    .eq('id', courseId)
    .eq('status', 'published')
    // Chỉ chương trình trả phí nhận đơn (khóa miễn phí xem ngay, khóa premium liên hệ Zalo)
    .eq('kind', 'program')
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
    // Ghi nhận đồng ý Chính sách bảo mật. Tài khoản chỉ có SĐT: profile không lưu email nội bộ
    // (trigger đã xử lý, đặt lại cho chắc chắn)
    await admin
      .from('profiles')
      .update({ consent_at: new Date().toISOString(), consent_version: CONSENT_VERSION, ...(email ? {} : { email: null }) })
      .eq('id', userId)
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
    // Lưu lại tên khóa và học phí lúc đăng ký: giữ lịch sử thanh toán kể cả khi khóa bị sửa giá hoặc bị xóa
    course_title: course.title,
    amount: course.price,
    full_name: fullName,
    email,
    phone,
    payment_proof_path: proofPath,
  })
  if (insertError) {
    await admin.storage.from('payment-proofs').remove([proofPath])
    await rollbackUser()
    // 23505: vi phạm unique index registrations_active_key (gửi 2 đơn cùng lúc cho cùng khóa)
    if (insertError.code === '23505') return { error: 'Bạn đã đăng ký khóa này và đang chờ xác nhận.' }
    return { error: `Không gửi được đơn đăng ký: ${insertError.message}` }
  }

  // Đăng nhập luôn để học viên theo dõi trạng thái đơn
  if (createdNewUser) {
    await supabase.auth.signInWithPassword({ email: authEmail, password })
  }

  revalidatePath('/admin/registrations')
  setFlash('Đã gửi đăng ký thành công!')
  redirect('/courses?registered=1')
}
