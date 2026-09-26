import { createClient } from '@supabase/supabase-js'

// Client ẩn danh không đọc cookie: dùng cho trang công khai để Next.js
// có thể cache (ISR) thay vì render lại mỗi request.
function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export type PublicCourse = {
  id: string
  title: string
  description: string | null
  price: number
}

export async function getPublishedCourses(): Promise<PublicCourse[]> {
  const { data } = await createPublicClient()
    .from('courses')
    .select('id, title, description, price')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
  return data ?? []
}
