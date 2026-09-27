import Image from 'next/image'
import { SpineIcon } from './icons'

// Ảnh bìa khóa học tỉ lệ 16:9; chưa có ảnh thì dùng nền gradient + biểu tượng cột sống
export default function CourseCover({
  src,
  alt,
  sizes = '(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw',
  priority = false,
  className = '',
}: {
  src: string | null
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
}) {
  return (
    <div className={`relative aspect-video overflow-hidden bg-gradient-to-br from-ocean-500 to-ocean-700 ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-gold-200/90" aria-hidden="true">
          <SpineIcon className="h-12 w-12" />
        </span>
      )}
    </div>
  )
}
