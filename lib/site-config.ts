// Thông tin thương hiệu, liên hệ & tài khoản nhận chuyển khoản
export const siteConfig = {
  name: 'Trung tâm HV',
  fullName: 'Holistic Therapy Center for Vietnamese',
  tagline: 'Trị liệu toàn diện cho người Việt',
  description:
    'Khóa học online nắn chỉnh, trị liệu cột sống - cơ xương khớp do Bác sĩ Đỗ Mạnh Cường trực tiếp hướng dẫn.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  hotline: '0973 027 017',
  email: 'dgquan1001@gmail.com',
  zaloUrl: 'https://zalo.me/0973027017',
  doctor: {
    name: 'Bác sĩ Đỗ Mạnh Cường',
    title: 'CEO & Bác sĩ chuyên môn tại Trung tâm HV',
    credentials: [
      'CEO & Bác sĩ chuyên môn tại Trung tâm HV – trị liệu toàn diện cho người Việt',
      'Tốt nghiệp Bác sĩ tại Học viện Y Dược học Cổ truyền Việt Nam',
      'Hơn 10 năm kinh nghiệm điều trị bệnh lý cột sống – cơ xương khớp',
      'Chuyên gia đào tạo giải phẫu và trị liệu bệnh lý cơ xương khớp cho bác sĩ, huấn luyện viên Yoga, Pilates, PT Gym...',
    ],
  },
  bank: {
    // Mã BIN ngân hàng theo chuẩn VietQR (Vietcombank = 970436)
    bin: '970436',
    bankName: 'Vietcombank',
    accountNo: '0991000029158',
    accountName: 'ĐỖ MẠNH CƯỜNG',
    // Tên không dấu dùng cho mã QR
    qrAccountName: 'DO MANH CUONG',
  },
}

export const hotlineHref = `tel:${siteConfig.hotline.replace(/\s/g, '')}`

function formatVND(amount: number) {
  return `${amount.toLocaleString('vi-VN')}đ`
}

export function formatPrice(amount: number) {
  return amount > 0 ? formatVND(amount) : 'Liên hệ'
}

// Ảnh QR chuyển khoản tự điền sẵn số tiền + nội dung (dịch vụ miễn phí của VietQR)
export function vietQrUrl(amount: number, content: string) {
  const { bin, accountNo, qrAccountName } = siteConfig.bank
  const params = new URLSearchParams({ accountName: qrAccountName })
  if (amount > 0) params.set('amount', String(amount))
  if (content) params.set('addInfo', content)
  return `https://img.vietqr.io/image/${bin}-${accountNo}-compact2.png?${params}`
}
