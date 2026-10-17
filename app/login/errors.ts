// Mã lỗi trên URL trang đăng nhập → câu hiển thị (SEC-14: không hiển thị chữ lấy thẳng từ URL)
export const LOGIN_ERRORS = {
  invalid: 'Email/số điện thoại hoặc mật khẩu không đúng.',
  locked: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút hoặc dùng "Quên mật khẩu".',
  failed: 'Không đăng nhập được, vui lòng thử lại hoặc gọi hotline để được hỗ trợ.',
  timeout: 'Phiên đăng nhập đã hết hạn do lâu không thao tác. Vui lòng đăng nhập lại.',
  expired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
} as const

export type LoginError = keyof typeof LOGIN_ERRORS

export const loginErrorMessage = (code: string | undefined) =>
  code && Object.hasOwn(LOGIN_ERRORS, code) ? LOGIN_ERRORS[code as LoginError] : null
