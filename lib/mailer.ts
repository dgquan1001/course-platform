import 'server-only'
import { siteConfig } from '@/lib/site-config'
import { sendSmtpOnWorkers } from '@/lib/smtp-workers'

type Mail = { to: string; subject: string; text: string; html: string }

// Đang chạy trên Cloudflare Workers (workerd) hay Node (next dev / next start)
const onWorkers = () => globalThis.navigator?.userAgent === 'Cloudflare-Workers'

// Gửi email qua SMTP (VD: Gmail + mật khẩu ứng dụng).
// - Trên Cloudflare Workers: lib/smtp-workers.ts (SMTP qua socket TCP của Cloudflare) – `nodemailer` không chạy trên Workers (Đợt 17 P0).
// - Trên Node: `nodemailer`.
// Khi kiểm thử: đặt MAIL_OUTBOX_URL để gửi thư (JSON) tới hộp thư giả do scripts/e2e.mjs mở, thay vì gửi thật.
export async function sendMail(mail: Mail) {
  const outbox = process.env.MAIL_OUTBOX_URL
  if (outbox) {
    const res = await fetch(outbox, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(mail) })
    if (!res.ok) throw new Error(`Hộp thư kiểm thử trả lỗi ${res.status}`)
    return
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Hệ thống chưa cấu hình gửi email. Vui lòng liên hệ hotline để được hỗ trợ.')
  }
  const port = Number(SMTP_PORT || 465)
  const from = MAIL_FROM || `${siteConfig.name} <${SMTP_USER}>`

  if (onWorkers()) {
    await sendSmtpOnWorkers({ host: SMTP_HOST, port, user: SMTP_USER, pass: SMTP_PASS }, { from, ...mail })
    return
  }

  const nodemailer = (await import('nodemailer')).default
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  await transporter.sendMail({ from, ...mail })
}

export function resetCodeEmail(code: string, minutes: number): Omit<Mail, 'to'> {
  const subject = `${code} là mã đặt lại mật khẩu ${siteConfig.name}`
  const text = `Mã đặt lại mật khẩu của bạn là: ${code}\nMã có hiệu lực trong ${minutes} phút.\nNếu bạn không yêu cầu, hãy bỏ qua email này.\n\n${siteConfig.name} – ${siteConfig.tagline}\nHotline: ${siteConfig.hotline}`
  const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#24425D">
  <h2 style="color:#3777AA;margin-bottom:4px">${siteConfig.name}</h2>
  <p style="margin-top:0;color:#64748b">${siteConfig.tagline}</p>
  <p>Mã đặt lại mật khẩu của bạn là:</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#FEF8E6;padding:16px;text-align:center;border-radius:12px">${code}</p>
  <p>Mã có hiệu lực trong <strong>${minutes} phút</strong>. Không chia sẻ mã này cho bất kỳ ai.</p>
  <p style="color:#64748b;font-size:13px">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.<br>Hotline hỗ trợ: ${siteConfig.hotline}</p>
</div>`
  return { subject, text, html }
}
