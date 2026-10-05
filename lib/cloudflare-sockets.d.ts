// Khai báo tối thiểu cho module có sẵn của Cloudflare Workers (lib/smtp-workers.ts). Chỉ tồn tại khi chạy trên workerd.
declare module 'cloudflare:sockets' {
  export function connect(
    address: { hostname: string; port: number },
    options?: { secureTransport?: 'off' | 'on' | 'starttls'; allowHalfOpen?: boolean }
  ): {
    readable: ReadableStream<Uint8Array>
    writable: WritableStream<Uint8Array>
    opened: Promise<unknown>
    close(): Promise<void>
    startTls(): ReturnType<typeof connect>
  }
}
