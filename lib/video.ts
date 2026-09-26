type VideoEmbed = {
  src: string
  // Video dọc (TikTok, YouTube Shorts) hiển thị khung 9:16
  vertical: boolean
}

const YOUTUBE_ID = /(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([\w-]{11})/
const TIKTOK_ID = /tiktok\.com\/(?:.*\/video|embed\/v2|player\/v1)\/(\d+)/

// Chỉ nhận link https của YouTube / TikTok mà trang bài học nhúng được
export function isSupportedVideoUrl(url: string) {
  let host: string
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    host = u.hostname.replace(/^(www|m)\./, '')
  } catch {
    return false
  }
  if (['youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) return YOUTUBE_ID.test(url)
  if (host === 'tiktok.com') return TIKTOK_ID.test(url)
  return false
}

export function getVideoEmbed(url: string): VideoEmbed {
  // YouTube: watch?v=..., youtu.be/..., /shorts/..., /embed/...
  const yt = url.match(YOUTUBE_ID)
  if (yt) {
    return {
      src: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`,
      vertical: url.includes('/shorts/'),
    }
  }

  // TikTok: tiktok.com/@user/video/123..., /embed/v2/123..., /player/v1/123...
  const tt = url.match(TIKTOK_ID)
  if (tt) {
    return { src: `https://www.tiktok.com/player/v1/${tt[1]}?rel=0`, vertical: true }
  }

  return { src: url, vertical: false }
}
