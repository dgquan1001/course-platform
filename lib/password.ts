// Độ dài mật khẩu tối thiểu: dùng chung cho form (minLength) và server action.
// Tài khoản cũ đặt mật khẩu 6–7 ký tự vẫn đăng nhập được; chỉ áp dụng khi tạo / đổi mật khẩu.
export const MIN_PASSWORD_LENGTH = 8

export const passwordHint = `Ít nhất ${MIN_PASSWORD_LENGTH} ký tự`

export const passwordTooShort = (label = 'Mật khẩu') => `${label} cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`
