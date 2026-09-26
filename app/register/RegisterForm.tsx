'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, hotlineHref, siteConfig, vietQrUrl } from '@/lib/site-config'
import type { PublicCourse } from '@/lib/supabase/public'
import { realEmail } from '@/lib/phone'
import { MIN_PASSWORD_LENGTH, passwordHint } from '@/lib/password'
import { CheckIcon, CopyIcon, SpinnerIcon, UploadIcon } from '@/components/icons'
import { registerAction, type RegisterState } from './actions'

// Cloudflare Turnstile chống bot: chỉ hiện khi đã cấu hình khóa (xem lib/turnstile.ts)
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
type TurnstileApi = { render: (el: HTMLElement, opts: { sitekey: string; language?: string }) => void; reset: () => void }
const turnstile = () => (window as Window & { turnstile?: TurnstileApi }).turnstile

const MAX_UPLOAD = 5 * 1024 * 1024
const ACCEPTED = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'
const ACCEPTED_EXT = /\.(jpe?g|png|webp|heic|heif)$/i

// Nén ảnh ngay trên trình duyệt: thu nhỏ cạnh dài tối đa 1600px, chuyển sang JPEG 82%.
// Ảnh chụp màn hình vài MB thường còn 150–400KB, vẫn đọc rõ chữ, upload nhanh hơn nhiều.
async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/jpeg' && file.size <= 400 * 1024) return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file // Trình duyệt không đọc được định dạng (VD: HEIC trên Chrome) → gửi ảnh gốc
  }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.fillStyle = '#fff' // nền trắng cho ảnh PNG trong suốt
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82))
  if (!blob || blob.size >= file.size) return file
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`
}

function StepHeading({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-300 text-sm font-bold text-ocean-900">
        {n}
      </span>
      <div>
        <h3 className="font-bold">
          <span className="text-ocean-600">Bước {n}:</span> {title}
        </h3>
        {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}

function CopyRow({ label, value, display }: { label: string; value: string; display?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="break-all font-semibold text-ocean-900">{display ?? value}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className="btn-ghost btn-sm shrink-0"
        aria-label={`Sao chép ${label}`}
      >
        {copied ? <CheckIcon className="h-4 w-4 text-emerald-600" /> : <CopyIcon className="h-4 w-4" />}
        {copied ? 'Đã chép' : 'Chép'}
      </button>
    </div>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending || disabled} className="btn-gold w-full py-3.5 text-base">
      {pending ? (
        <>
          <SpinnerIcon /> Đang gửi đăng ký...
        </>
      ) : (
        'Đăng ký'
      )}
    </button>
  )
}

type Proof = { url: string; original: number; final: number }

export default function RegisterForm({ courses }: { courses: PublicCourse[] }) {
  const searchParams = useSearchParams()
  const requestedCourse = searchParams.get('course')
  const [state, formAction] = useFormState<RegisterState, FormData>(registerAction, { error: null })
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  // Tên hiển thị của tài khoản đang đăng nhập (email thật hoặc SĐT)
  const [account, setAccount] = useState<string | null>(null)
  const [proof, setProof] = useState<Proof | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const captchaRef = useRef<HTMLDivElement>(null)

  // Vẽ widget Turnstile (script có thể đã tải sẵn khi chuyển trang trong website)
  function renderCaptcha() {
    if (TURNSTILE_SITE_KEY && captchaRef.current && !captchaRef.current.hasChildNodes()) {
      turnstile()?.render(captchaRef.current, { sitekey: TURNSTILE_SITE_KEY, language: 'vi' })
    }
  }
  useEffect(renderCaptcha, [])

  // Nút "Đăng ký" của từng khóa học (?course=...) chọn sẵn khóa đó
  useEffect(() => {
    if (requestedCourse && courses.some((c) => c.id === requestedCourse)) setCourseId(requestedCourse)
  }, [requestedCourse, courses])

  // Đã đăng nhập: điền sẵn thông tin, không cần tạo mật khẩu
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', session.user.id)
        .single()
      setAccount(realEmail(session.user.email) ?? profile?.phone ?? '')
      setFullName((v) => v || profile?.full_name || '')
      setPhone((v) => v || profile?.phone || '')
    })
  }, [])

  useEffect(() => {
    return () => {
      if (proof) URL.revokeObjectURL(proof.url)
    }
  }, [proof])

  useEffect(() => {
    if (!state.error) return
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Form có thể bị reset sau khi gửi: đồng bộ lại ảnh xem trước
    if (!fileRef.current?.files?.length) setProof(null)
    // Mã Turnstile chỉ dùng được 1 lần: lấy mã mới cho lần gửi lại
    if (TURNSTILE_SITE_KEY) turnstile()?.reset()
  }, [state])

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const file = input.files?.[0]
    setFileError(null)
    if (!file) {
      setProof(null)
      return
    }
    if (!file.type.startsWith('image/') && !ACCEPTED_EXT.test(file.name)) {
      input.value = ''
      setProof(null)
      setFileError('Chỉ nhận ảnh định dạng JPG, PNG, WEBP hoặc HEIC.')
      return
    }
    setCompressing(true)
    const small = await compressImage(file)
    setCompressing(false)
    if (small.size > MAX_UPLOAD) {
      input.value = ''
      setProof(null)
      setFileError(`Ảnh quá lớn (${formatSize(small.size)}). Vui lòng chọn ảnh dưới 5MB.`)
      return
    }
    if (small !== file) {
      const dt = new DataTransfer()
      dt.items.add(small)
      input.files = dt.files
    }
    setProof({ url: URL.createObjectURL(small), original: file.size, final: small.size })
  }

  const course = courses.find((c) => c.id === courseId)
  const amount = course?.price ?? 0
  const transferContent = phone.replace(/\D/g, '') || 'SDT cua ban'
  const noCourses = courses.length === 0

  return (
    <div ref={topRef} className="card scroll-mt-20 overflow-hidden shadow-lg shadow-ocean-900/5">
      <div className="bg-gradient-to-r from-ocean-600 to-ocean-500 px-5 py-5 text-center sm:px-8">
        <h2 className="text-xl font-bold text-white sm:text-2xl">Đăng ký khóa học</h2>
        <p className="mt-1 text-sm text-ocean-50">
          Chuyển khoản → Chụp ảnh chuyển khoản → Điền thông tin & gửi ảnh
        </p>
      </div>

      <form action={formAction} className="grid lg:grid-cols-2">
        {/* BƯỚC 1 + 2: thanh toán */}
        <div className="space-y-8 border-b border-slate-100 bg-ocean-50/50 p-5 sm:p-8 lg:border-b-0 lg:border-r">
          <section>
            <StepHeading
              n={1}
              title="Chuyển khoản theo thông tin"
              hint="Quét mã QR bằng app ngân hàng: số tiền và nội dung được điền sẵn."
            />
            <div className="grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-ocean-100 sm:grid-cols-[160px_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vietQrUrl(amount, transferContent)}
                alt="Mã QR chuyển khoản"
                width={160}
                height={200}
                loading="lazy"
                className="mx-auto h-auto w-40 rounded-xl sm:w-full"
              />
              <div className="divide-y divide-ocean-100">
                <CopyRow label="Ngân hàng" value={siteConfig.bank.bankName} />
                <CopyRow label="Số tài khoản" value={siteConfig.bank.accountNo} />
                <CopyRow label="Chủ tài khoản" value={siteConfig.bank.accountName} />
                {amount > 0 && <CopyRow label="Số tiền" value={String(amount)} display={formatPrice(amount)} />}
                <CopyRow label="Nội dung: số điện thoại của bạn" value={transferContent} />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Số tiền và mã QR tự cập nhật theo khóa học bạn chọn ở Bước 3.
            </p>
          </section>

          <section>
            <StepHeading n={2} title="Chụp lại ảnh chuyển khoản" />
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                'Chụp màn hình giao dịch thành công trên app ngân hàng.',
                'Ảnh cần thấy rõ số tiền, thời gian và nội dung chuyển khoản.',
                'Tải ảnh lên ở Bước 3 để trung tâm xác nhận nhanh nhất.',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ocean-500" /> {t}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* BƯỚC 3: thông tin */}
        <div className="p-5 sm:p-8">
          <StepHeading n={3} title="Đăng ký thông tin & gửi ảnh" />

          {state.error && (
            <p role="alert" className="alert-error mb-4">
              {state.error}
            </p>
          )}
          {account !== null && (
            <p className="alert-success mb-4">
              Bạn đang đăng nhập với <strong>{account}</strong>. Khóa học mới sẽ được thêm vào tài khoản này.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="label">Họ và tên *</label>
              <input
                id="fullName"
                name="fullName"
                required
                placeholder="Nguyễn Văn A"
                className="input"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className="label">Số điện thoại *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  placeholder="0912 345 678"
                  className="input"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              {account === null && (
                <div>
                  <label htmlFor="email" className="label">
                    Email <span className="font-normal text-slate-400">(không bắt buộc)</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ban@gmail.com"
                    className="input"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}
            </div>
            {account === null && (
              <div>
                <label htmlFor="password" className="label">Tạo mật khẩu đăng nhập *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  placeholder={passwordHint}
                  className="input"
                  autoComplete="new-password"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Đăng nhập bằng số điện thoại (hoặc email) và mật khẩu này. Nên nhập email để có thể
                  lấy lại mật khẩu khi quên. Đã có tài khoản?{' '}
                  <Link href="/login?next=/register" className="font-semibold text-ocean-700 hover:underline">
                    Đăng nhập
                  </Link>
                </p>
              </div>
            )}

            <div>
              <label htmlFor="courseId" className="label">Chọn khóa học *</label>
              <select
                id="courseId"
                name="courseId"
                required
                disabled={noCourses}
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="input disabled:bg-slate-50"
              >
                {noCourses ? (
                  <option value="">Hiện chưa có khóa học mở đăng ký</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} – {formatPrice(c.price)}
                    </option>
                  ))
                )}
              </select>
              {noCourses && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Vui lòng gọi <a href={hotlineHref} className="font-semibold text-ocean-700">{siteConfig.hotline}</a> để được tư vấn.
                </p>
              )}
            </div>

            <div>
              <span className="label">Ảnh chụp chuyển khoản *</span>
              <label
                htmlFor="paymentProof"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ocean-200 bg-white p-5 text-center transition hover:border-ocean-400 hover:bg-ocean-50/50"
              >
                {compressing ? (
                  <span className="flex items-center gap-2 py-6 text-sm font-medium text-ocean-700">
                    <SpinnerIcon className="h-5 w-5" /> Đang tối ưu ảnh để tải lên nhanh hơn...
                  </span>
                ) : proof ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proof.url} alt="Ảnh chuyển khoản đã chọn" className="max-h-56 rounded-lg" />
                    <span className="text-xs text-slate-500" data-testid="proof-size">
                      {proof.final < proof.original
                        ? `Đã tối ưu: ${formatSize(proof.original)} → ${formatSize(proof.final)}`
                        : `Dung lượng: ${formatSize(proof.final)}`}
                    </span>
                    <span className="text-sm font-medium text-ocean-700">Bấm để chọn ảnh khác</span>
                  </>
                ) : (
                  <>
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-ocean-50 text-ocean-600">
                      <UploadIcon className="h-5 w-5" />
                    </span>
                    <span className="font-semibold text-ocean-900">Bấm để tải lên ảnh chuyển khoản</span>
                    <span className="text-xs text-slate-500">JPG, PNG, WEBP, HEIC · ảnh được tự động nén</span>
                  </>
                )}
                <input
                  ref={fileRef}
                  id="paymentProof"
                  name="paymentProof"
                  type="file"
                  accept={ACCEPTED}
                  required
                  className="sr-only"
                  onChange={onFileChange}
                />
              </label>
              {fileError && <p role="alert" className="mt-2 text-sm text-red-600">{fileError}</p>}
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-gold-50 px-4 py-3 ring-1 ring-gold-200">
              <span className="min-w-0 text-sm text-slate-700">
                {course ? (
                  <>
                    Khóa học: <span className="font-semibold text-ocean-900">{course.title}</span>
                  </>
                ) : (
                  'Chưa chọn khóa học'
                )}
              </span>
              <span className="shrink-0 text-lg font-bold text-ocean-700">{formatPrice(amount)}</span>
            </div>

            {TURNSTILE_SITE_KEY && (
              <>
                <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onLoad={renderCaptcha} />
                <div ref={captchaRef} className="flex justify-center" />
              </>
            )}

            <SubmitButton disabled={noCourses || compressing} />
          </div>
        </div>
      </form>
    </div>
  )
}
