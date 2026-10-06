import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dwkgqhkjegbublkuhgbg.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_Xw_Jm0gESzUxL3R3sI9QCA_VXIxHZRN"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
