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
    summary: 'Hơn 10 năm kinh nghiệm điều trị bệnh lý cột sống – cơ xương khớp',
    // Hồ sơ chuyên môn (nguồn: bsdomanhcuong.com/bac-si.html), hiện ở mục "Bác sĩ" trên trang chủ
    education: [
      'Bác sĩ Y học cổ truyền – Học viện Y Dược học Cổ truyền Việt Nam',
      'Chứng chỉ định hướng Phục hồi chức năng cơ bản – Đại học Y Dược Thái Nguyên',
      'Chứng nhận thực hành phương pháp Schroth (SSOL) – giảng viên Andrea Lebel, MSc PT',
      'Có tên trong danh bạ chuyên gia Scoliosis Schroth Online (SSOL Schroth MD Observer)',
    ],
    expertise: [
      { title: 'Cong vẹo cột sống', text: 'Đánh giá sớm và lộ trình tập theo phương pháp Schroth cho trẻ em và người lớn.' },
      { title: 'Đau cột sống – cơ xương khớp', text: 'Đau cổ vai gáy, đau lưng, thoát vị đĩa đệm, sai tư thế do ngồi làm việc lâu.' },
      { title: 'Phục hồi chấn thương thể thao', text: 'Trị liệu, băng dán Kinesio Tape và bài tập đưa bạn trở lại vận động an toàn.' },
      { title: 'Đào tạo chuyên môn', text: 'Giảng dạy giải phẫu và trị liệu cho bác sĩ, huấn luyện viên Yoga, Pilates, PT Gym.' },
    ],
    career: [
      { time: '01/2024 – nay', text: 'Sáng lập Xương Khớp HV, bác sĩ điều trị tại HV Healthcare Center (Hà Đông, Hà Nội)' },
      { time: '08/2022 – nay', text: 'Bác sĩ trị liệu cột sống tại Phòng khám BS Cường' },
      { time: '04/2022 – 08/2022', text: 'Bác sĩ chuyên môn tại Phòng khám Cột sống, Cơ xương khớp Việt Mỹ' },
    ],
  },
  // Các cơ sở trị liệu trực tiếp (hiện ở chân trang)
  branches: [
    'Tòa CT7 Booyoung Vina, Mộ Lao, Hà Đông, Hà Nội',
    'Tòa D2 Giảng Võ, Ba Đình, Hà Nội',
    'Tòa Skycenter, Phổ Quang, Tân Bình, TP. Hồ Chí Minh',
  ],
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
