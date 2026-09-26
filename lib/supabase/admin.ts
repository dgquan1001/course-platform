import { createClient } from '@supabase/supabase-js'

// Client dùng service role key: BỎ QUA RLS. Chỉ dùng trong server action / route handler,
// tuyệt đối không import vào component phía client.
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
