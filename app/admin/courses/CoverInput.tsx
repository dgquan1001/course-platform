'use client'

import { useEffect, useRef, useState } from 'react'
import { compressImage, formatSize } from '@/lib/compress-image'
import { SpinnerIcon, UploadIcon } from '@/components/icons'

const MAX_COVER = 2 * 1024 * 1024

// Ô chọn ảnh bìa (16:9): nén trên trình duyệt (cạnh dài ≤ 1600px), xem trước; server kiểm tra lại định dạng và dung lượng
export default function CoverInput({ current }: { current?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [remove, setRemove] = useState(false)

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  // Form được reset sau khi thêm khóa thành công: xóa ảnh xem trước
  useEffect(() => {
    const form = inputRef.current?.form
    const onReset = () => {
      setPreview(null)
      setInfo(null)
      setError(null)
    }
    form?.addEventListener('reset', onReset)
    return () => form?.removeEventListener('reset', onReset)
  }, [])

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const file = input.files?.[0]
    setError(null)
    if (!file) return setPreview(null)
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      input.value = ''
      setPreview(null)
      return setError('Ảnh bìa phải là JPG, PNG hoặc WEBP.')
    }
    setBusy(true)
    const small = await compressImage(file, { maxSide: 1600, quality: 0.85 })
    setBusy(false)
    if (small.size > MAX_COVER) {
      input.value = ''
      setPreview(null)
      return setError(`Ảnh quá lớn (${formatSize(small.size)}), tối đa 2MB.`)
    }
    if (small !== file) {
      const dt = new DataTransfer()
      dt.items.add(small)
      input.files = dt.files
    }
    setRemove(false)
    setPreview(URL.createObjectURL(small))
    setInfo(small.size < file.size ? `Đã tối ưu: ${formatSize(file.size)} → ${formatSize(small.size)}` : formatSize(small.size))
  }

  const shown = preview ?? (remove ? null : current)
  return (
    <div className="sm:col-span-2">
      <span className="label">Ảnh bìa (tỉ lệ 16:9)</span>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-ocean-200 bg-white p-3 transition hover:border-ocean-400">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Ảnh bìa" className="aspect-video w-32 rounded-lg object-cover" />
        ) : (
          <span className="grid aspect-video w-32 place-items-center rounded-lg bg-ocean-50 text-ocean-500">
            {busy ? <SpinnerIcon className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
          </span>
        )}
        <span className="text-sm text-slate-600">
          {busy ? 'Đang tối ưu ảnh…' : shown ? 'Bấm để chọn ảnh khác' : 'Bấm để chọn ảnh (JPG, PNG, WEBP · tối đa 2MB)'}
          {info && <span className="block text-xs text-slate-400" data-testid="cover-size">{info}</span>}
        </span>
        <input ref={inputRef} name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onChange} />
      </label>
      {error && <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>}
      {current && !preview && (
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="remove_cover" value="yes" checked={remove} onChange={(e) => setRemove(e.target.checked)} />
          Xóa ảnh bìa hiện tại
        </label>
      )}
    </div>
  )
}
