type VideoEmbed = {
  src: string
  // Video dọc (TikTok, YouTube Shorts) hiển thị khung 9:16
  vertical: boolean
}

export function getVideoEmbed(url: string): VideoEmbed {
  // YouTube: watch?v=..., youtu.be/..., /shorts/..., /embed/...
  const yt = url.match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/)([\w-]{11})/)
  if (yt) {
    return {
      src: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`,
      vertical: url.includes('/shorts/'),
    }
  }

  // TikTok: tiktok.com/@user/video/123..., /embed/v2/123..., /player/v1/123...
  const tt = url.match(/tiktok\.com\/(?:.*\/video|embed\/v2|player\/v1)\/(\d+)/)
  if (tt) {
    return { src: `https://www.tiktok.com/player/v1/${tt[1]}?rel=0`, vertical: true }
  }

  return { src: url, vertical: false }
}
