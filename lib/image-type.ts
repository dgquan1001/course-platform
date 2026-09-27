// Nhận diện định dạng ảnh theo nội dung file (magic bytes), không tin MIME / đuôi file do trình duyệt gửi.
const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'heif']

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic'

export function detectImageType(bytes: Uint8Array): ImageType | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end))
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  // HEIC/HEIF (iPhone): hộp "ftyp" ở byte 4, kèm brand
  if (ascii(4, 8) === 'ftyp' && HEIF_BRANDS.includes(ascii(8, 12))) return 'image/heic'
  return null
}

// Đuôi file lưu trong Storage theo định dạng thật của ảnh
export const IMAGE_EXT: Record<ImageType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/heic': 'heic',
}
