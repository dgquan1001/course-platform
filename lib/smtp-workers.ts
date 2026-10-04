// Client SMTP tối giản cho Cloudflare Workers (Đợt 17, RK-46): `nodemailer` không chạy trên workerd, thư viện có sẵn import
// `cloudflare:sockets` tĩnh nên webpack / OpenNext không đóng gói được. Ở đây nạp socket lúc chạy.
// Hỗ trợ: SSL ngay từ đầu (cổng 465) hoặc STARTTLS (587), AUTH PLAIN, thư text + HTML (UTF-8, base64). Chỉ gọi khi chạy trên Workers.

type SmtpOptions = { host: string; port: number; user: string; pass: string }
type Message = { from: string; to: string; subject: string; text: string; html: string }
type CfSocket = ReturnType<typeof import('cloudflare:sockets').connect>

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const base64 = (value: string) => {
  let binary = ''
  for (const byte of encoder.encode(value)) binary += String.fromCharCode(byte)
  return btoa(binary)
}
// Tiêu đề / tên người gửi có dấu tiếng Việt: mã hóa RFC 2047
const encodeWord = (value: string) => (/^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${base64(value)}?=`)
// Thân thư base64, xuống dòng mỗi 76 ký tự
const wrap = (value: string) => base64(value).replace(/.{1,76}/g, '$&\r\n')

function formatAddress(value: string) {
  const match = value.match(/^\s*"?(.*?)"?\s*<([^>]+)>\s*$/)
  return match ? { header: `${encodeWord(match[1])} <${match[2]}>`, email: match[2] } : { header: value.trim(), email: value.trim() }
}

class Connection {
  private reader: ReadableStreamDefaultReader<Uint8Array>
  private writer: WritableStreamDefaultWriter<Uint8Array>
  private buffer = ''

  constructor(public socket: CfSocket) {
    this.reader = socket.readable.getReader()
    this.writer = socket.writable.getWriter()
  }

  // Đọc một phản hồi (có thể nhiều dòng "250-...") và kiểm tra mã
  async expect(code: number) {
    for (;;) {
      const lines = this.buffer.split('\r\n')
      const last = lines.findIndex((line) => /^\d{3} /.test(line))
      if (last >= 0) {
        const reply = lines.slice(0, last + 1).join('\n')
        this.buffer = lines.slice(last + 1).join('\r\n')
        if (!reply.startsWith(String(code))) throw new Error(`SMTP: ${reply}`)
        return reply
      }
      const { value, done } = await this.reader.read()
      if (done) throw new Error('SMTP: máy chủ đóng kết nối')
      this.buffer += decoder.decode(value, { stream: true })
    }
  }

  async send(line: string, code: number) {
    await this.writer.write(encoder.encode(`${line}\r\n`))
    return this.expect(code)
  }

  release() {
    this.reader.releaseLock()
    this.writer.releaseLock()
  }
}

export async function sendSmtpOnWorkers({ host, port, user, pass }: SmtpOptions, message: Message) {
  // Chỉ workerd có module này: webpackIgnore để webpack của Next bỏ qua; `.catch()` để esbuild của OpenNext để nguyên
  // lệnh import (không phân giải lúc build) – wrangler / workerd nạp lúc chạy.
  const { connect } = await import(/* webpackIgnore: true */ 'cloudflare:sockets').catch((e: unknown) => {
    throw e
  })

  const implicitTls = port === 465
  let socket = connect({ hostname: host, port }, { secureTransport: implicitTls ? 'on' : 'starttls', allowHalfOpen: false })
  let conn = new Connection(socket)
  try {
    await conn.expect(220)
    await conn.send(`EHLO ${host}`, 250)
    if (!implicitTls) {
      await conn.send('STARTTLS', 220)
      conn.release()
      socket = socket.startTls()
      conn = new Connection(socket)
      await conn.send(`EHLO ${host}`, 250)
    }
    await conn.send(`AUTH PLAIN ${base64(`\0${user}\0${pass}`)}`, 235)

    const from = formatAddress(message.from)
    await conn.send(`MAIL FROM:<${from.email}>`, 250)
    await conn.send(`RCPT TO:<${message.to}>`, 250)
    await conn.send('DATA', 354)

    const boundary = `hv-${crypto.randomUUID()}`
    const body = [
      `From: ${from.header}`,
      `To: ${message.to}`,
      `Subject: ${encodeWord(message.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${crypto.randomUUID()}@${from.email.split('@')[1] ?? host}>`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      wrap(message.text),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      wrap(message.html),
      `--${boundary}--`,
      '.',
    ].join('\r\n')
    await conn.send(body, 250)
    await conn.send('QUIT', 221).catch(() => {})
  } finally {
    await socket.close().catch(() => {})
  }
}
