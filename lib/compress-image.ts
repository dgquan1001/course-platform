// Nén ảnh ngay trên trình duyệt (chỉ dùng ở client component): thu nhỏ cạnh dài tối đa `maxSide` px,
// chuyển sang JPEG. Ảnh chụp màn hình vài MB thường còn 150–400KB, vẫn đọc rõ chữ, upload nhanh hơn nhiều.
export async function compressImage(file: File, { maxSide = 1600, quality = 0.82 } = {}): Promise<File> {
  if (file.type === 'image/jpeg' && file.size <= 400 * 1024) return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file // Trình duyệt không đọc được định dạng (VD: HEIC trên Chrome) → gửi ảnh gốc
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.fillStyle = '#fff' // nền trắng cho ảnh PNG trong suốt
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob || blob.size >= file.size) return file
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' })
}

export function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`
}
