'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/phone'
import { clientIp, LIMITS, withinLimit } from '@/lib/rate-limit'
import { siteConfig } from '@/lib/site-config'
import type { ActionResult } from '@/lib/action-result'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_NAME = 100

// Khách bấm liên hệ Zalo ở khóa premium. Có họ tên + SĐT: nhân viên gọi lại; để trống cả hai: chỉ ghi lượt bấm ẩn danh.
// Zalo được mở ngay ở trình duyệt (không chờ action) để không bị chặn cửa sổ bật lên.
export async function createLeadAction(courseId: string, formData: FormData): Promise<ActionResult> {
  const fullName = String(formData.get('fullName') ?? '').trim()
  const rawPhone = String(formData.get('phone') ?? '').trim()
  const anonymous = !fullName && !rawPhone
  const phone = rawPhone ? normalizePhone(rawPhone) : null

  if (!UUID.test(courseId)) return { ok: false, error: 'Khóa học không hợp lệ, vui lòng tải lại trang.' }
  if (!anonymous) {
    if (!fullName) return { ok: false, error: 'Vui lòng nhập họ và tên.' }
    if (fullName.length > MAX_NAME) return { ok: false, error: `Họ tên tối đa ${MAX_NAME} ký tự.` }
    if (!phone) return { ok: false, error: 'Số điện thoại không hợp lệ (VD: 0912345678).' }
  }
  if (!(await withinLimit(`lead:${await clientIp()}`, LIMITS.lead))) {
    return { ok: false, error: `Bạn đã gửi quá nhiều lần. Vui lòng nhắn Zalo hoặc gọi ${siteConfig.hotline}.` }
  }

  const admin = createAdminClient()
  const { data: course } = await admin
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .eq('kind', 'premium')
    .eq('status', 'published')
    .maybeSingle()
  if (!course) return { ok: false, error: 'Khóa học không tồn tại hoặc đã ngừng nhận đăng ký.' }

  const {
    data: { user },
  } = await (await createClient()).auth.getUser()

  const { error } = await admin.from('leads').insert({
    course_id: course.id,
    course_title: course.title,
    user_id: user?.id ?? null,
    full_name: anonymous ? null : fullName,
    phone: anonymous ? null : phone,
  })
  if (error) {
    console.error('[lead]', error.message)
    return { ok: false, error: 'Không gửi được thông tin, vui lòng thử lại hoặc bấm "Mở Zalo ngay".' }
  }

  revalidatePath('/admin/leads')
  return {
    ok: true,
    message: anonymous ? 'Đang mở Zalo…' : 'Đã gửi thông tin. Nhân viên sẽ liên hệ bạn qua Zalo hoặc điện thoại.',
  }
}
