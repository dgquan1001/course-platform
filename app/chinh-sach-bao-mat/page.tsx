import type { Metadata } from 'next'
import Link from 'next/link'
import { hotlineHref, siteConfig } from '@/lib/site-config'
import { CONSENT_UPDATED_AT, CONSENT_VERSION } from '@/lib/consent'

export const metadata: Metadata = {
  title: 'Chính sách bảo mật',
  description: `Cách ${siteConfig.name} thu thập, sử dụng và bảo vệ thông tin cá nhân, thông tin sức khỏe của bạn.`,
}

// Nội dung soạn theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
// Bản do đội phát triển soạn (27/09/2026) – trung tâm cần rà soát pháp lý trước khi quảng bá rộng (roadmap A-7).
// 04/10/2026 (Đợt 17): máy chủ website đổi Vercel → Cloudflare. Chưa đổi CONSENT_VERSION vì bản chính sách chưa được duyệt và chưa có
// bệnh nhân thật; khi chủ trung tâm duyệt (A-7) thì đặt ngày hiệu lực mới.
const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Ai chịu trách nhiệm về dữ liệu của bạn',
    body: (
      <p>
        {siteConfig.name} ({siteConfig.fullName}) là bên kiểm soát và xử lý dữ liệu cá nhân bạn cung cấp khi sử dụng
        website. Mọi câu hỏi hoặc yêu cầu về dữ liệu, vui lòng liên hệ theo mục 11.
      </p>
    ),
  },
  {
    title: '2. Chúng tôi thu thập những dữ liệu nào',
    body: (
      <ul>
        <li>
          <strong>Dữ liệu cơ bản:</strong> họ tên, số điện thoại, email (không bắt buộc), mật khẩu đăng nhập (được mã hóa
          một chiều, nhân viên không xem được).
        </li>
        <li>
          <strong>Dữ liệu thanh toán:</strong> ảnh chụp chuyển khoản, số tiền, hình thức thanh toán, khóa học / gói đã đăng ký.
        </li>
        <li>
          <strong>Dữ liệu học tập:</strong> các bài tập, buổi tập bạn đã đánh dấu hoàn thành, tiến độ khóa học.
        </li>
        <li>
          <strong>Dữ liệu sức khỏe (dữ liệu cá nhân nhạy cảm):</strong> thông tin bạn tự điền trong phiếu tham vấn như mức
          độ đau, triệu chứng, tình trạng cột sống, ghi chú gửi bác sĩ.
        </li>
        <li>
          <strong>Dữ liệu kỹ thuật:</strong> cookie duy trì đăng nhập, địa chỉ IP (dùng để chống gửi đơn / dò mật khẩu hàng loạt).
        </li>
        <li>
          <strong>Khi bạn liên hệ khóa premium:</strong> họ tên, số điện thoại bạn để lại để nhân viên gọi tư vấn.
        </li>
      </ul>
    ),
  },
  {
    title: '3. Chúng tôi dùng dữ liệu để làm gì',
    body: (
      <ul>
        <li>Tạo và quản lý tài khoản, cho phép bạn đăng nhập bằng số điện thoại hoặc email.</li>
        <li>Xác nhận thanh toán và mở khóa học, gói tập bạn đã đăng ký; tính thời hạn học.</li>
        <li>Hướng dẫn tập luyện, theo dõi tiến độ, nhắc lịch tập và gia hạn.</li>
        <li>Chuyển phiếu tham vấn tới bác sĩ, chuyên gia để tư vấn phù hợp với tình trạng của bạn.</li>
        <li>Liên hệ hỗ trợ qua điện thoại, Zalo, email; gửi mã đặt lại mật khẩu.</li>
        <li>Bảo đảm an toàn hệ thống: chống spam, chống truy cập trái phép.</li>
      </ul>
    ),
  },
  {
    title: '4. Cơ sở xử lý và dữ liệu nhạy cảm',
    body: (
      <>
        <p>
          Chúng tôi xử lý dữ liệu dựa trên <strong>sự đồng ý của bạn</strong> khi bạn tick ô đồng ý lúc tạo tài khoản
          (hoặc xác nhận với nhân viên khi được tạo tài khoản qua Zalo).
        </p>
        <p>
          <strong>Thông tin sức khỏe là dữ liệu cá nhân nhạy cảm.</strong> Bạn chỉ cung cấp khi tự nguyện điền phiếu tham
          vấn; dữ liệu này chỉ dùng để hướng dẫn tập luyện và tư vấn, không dùng cho quảng cáo.
        </p>
      </>
    ),
  },
  {
    title: '5. Ai được xem dữ liệu của bạn',
    body: (
      <ul>
        <li>Chính bạn: xem, sửa thông tin tài khoản trong mục &quot;Tài khoản của tôi&quot;.</li>
        <li>Nhân viên, bác sĩ, quản trị viên của trung tâm: theo phạm vi công việc (duyệt đơn, hỗ trợ, tư vấn).</li>
        <li>
          Các nhà cung cấp dịch vụ kỹ thuật giúp website hoạt động: lưu trữ dữ liệu và đăng nhập (Supabase), máy chủ website
          và chống tấn công (Cloudflare), gửi email (Google Gmail), phát video (YouTube, TikTok), tạo mã QR chuyển khoản (VietQR), liên lạc (Zalo).
        </li>
        <li>Cơ quan nhà nước có thẩm quyền khi pháp luật yêu cầu.</li>
      </ul>
    ),
  },
  {
    title: '6. Chuyển dữ liệu ra nước ngoài',
    body: (
      <p>
        Máy chủ của một số nhà cung cấp dịch vụ ở mục 5 có thể đặt ngoài Việt Nam. Khi đồng ý với chính sách này, bạn đồng ý
        cho phép dữ liệu được lưu trữ và xử lý tại các máy chủ đó. Chúng tôi chỉ dùng nhà cung cấp có cam kết bảo mật và
        không cho phép họ dùng dữ liệu của bạn vào mục đích khác. Chúng tôi <strong>không bán</strong> dữ liệu của bạn.
      </p>
    ),
  },
  {
    title: '7. Lưu trữ trong bao lâu',
    body: (
      <ul>
        <li>Thông tin tài khoản, tiến độ học, phiếu tham vấn: trong thời gian bạn sử dụng dịch vụ và tối đa 24 tháng kể từ lần hoạt động cuối, hoặc tới khi bạn yêu cầu xóa.</li>
        <li>Chứng từ thanh toán (đơn đăng ký, ảnh chuyển khoản): theo thời hạn pháp luật về kế toán, thuế yêu cầu.</li>
        <li>Thông tin khách để lại ở khóa premium: tối đa 12 tháng nếu không phát sinh đăng ký.</li>
      </ul>
    ),
  },
  {
    title: '8. Chúng tôi bảo vệ dữ liệu như thế nào',
    body: (
      <ul>
        <li>Kết nối được mã hóa (HTTPS); mật khẩu và mã đặt lại mật khẩu chỉ lưu dạng mã hóa một chiều.</li>
        <li>Phân quyền trong cơ sở dữ liệu: mỗi người chỉ xem được dữ liệu của mình; nhân viên chỉ xem trong phạm vi công việc.</li>
        <li>Ảnh chuyển khoản lưu ở kho riêng tư, chỉ nhân viên và quản trị viên xem qua đường dẫn có thời hạn.</li>
        <li>Ghi nhật ký các thao tác quan trọng (duyệt đơn, phân quyền) để truy vết.</li>
      </ul>
    ),
  },
  {
    title: '9. Quyền của bạn',
    body: (
      <>
        <p>Theo Nghị định 13/2023/NĐ-CP, bạn có quyền:</p>
        <ul>
          <li>Được biết về việc xử lý dữ liệu; đồng ý hoặc không đồng ý;</li>
          <li>Truy cập, xem, chỉnh sửa dữ liệu của mình;</li>
          <li>Rút lại sự đồng ý; yêu cầu xóa dữ liệu; hạn chế hoặc phản đối việc xử lý;</li>
          <li>Yêu cầu cung cấp bản sao dữ liệu; khiếu nại, tố cáo, yêu cầu bồi thường theo quy định pháp luật.</li>
        </ul>
        <p>
          Liên hệ theo mục 11 để thực hiện các quyền trên. Chúng tôi phản hồi trong vòng 72 giờ làm việc. Việc rút lại đồng ý
          hoặc xóa dữ liệu có thể khiến bạn không tiếp tục học được các khóa đã đăng ký; dữ liệu đã xử lý trước đó vẫn hợp pháp.
        </p>
      </>
    ),
  },
  {
    title: '10. Người dưới 16 tuổi',
    body: (
      <p>
        Nếu người tập dưới 16 tuổi, cha mẹ hoặc người giám hộ cần đăng ký tài khoản, đồng ý với chính sách này thay cho con
        và theo dõi việc tập luyện.
      </p>
    ),
  },
  {
    title: '11. Liên hệ',
    body: (
      <ul>
        <li>
          Hotline:{' '}
          <a href={hotlineHref} className="font-semibold text-ocean-700 hover:underline">
            {siteConfig.hotline}
          </a>
        </li>
        <li>
          Email:{' '}
          <a href={`mailto:${siteConfig.email}`} className="font-semibold text-ocean-700 hover:underline">
            {siteConfig.email}
          </a>
        </li>
        <li>
          Zalo:{' '}
          <a href={siteConfig.zaloUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-ocean-700 hover:underline">
            nhắn tin cho trung tâm
          </a>
        </li>
      </ul>
    ),
  },
  {
    title: '12. Thay đổi chính sách',
    body: (
      <p>
        Khi thay đổi nội dung quan trọng, chúng tôi cập nhật ngày hiệu lực trên trang này và hỏi lại sự đồng ý của bạn khi
        cần thiết.
      </p>
    ),
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="container-page max-w-3xl py-10 sm:py-14">
      <span className="eyebrow">Bảo vệ dữ liệu cá nhân</span>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Chính sách bảo mật</h1>
      <p className="mt-2 text-sm text-slate-500">
        Hiệu lực từ {CONSENT_UPDATED_AT} · Phiên bản {CONSENT_VERSION}
      </p>
      <p className="mt-6 text-slate-700">
        Chính sách này giải thích cách {siteConfig.name} thu thập, sử dụng và bảo vệ thông tin cá nhân, bao gồm thông tin sức
        khỏe, khi bạn đăng ký và tập luyện trên website.
      </p>
      <div className="mt-8 space-y-8 text-slate-700 [&_li]:mt-1.5 [&_p]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-bold text-ocean-900">{s.title}</h2>
            <div className="mt-2">{s.body}</div>
          </section>
        ))}
      </div>
      <p className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-500">
        <Link href="/" className="font-semibold text-ocean-700 hover:underline">
          ← Về trang chủ
        </Link>
      </p>
    </main>
  )
}
