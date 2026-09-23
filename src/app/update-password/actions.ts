'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updatePassword(state: any, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const accessToken = (formData.get('accessToken') as string || '').trim()

  if (!password || !confirmPassword) {
    return { error: 'Please enter a password' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const supabase = await createClient()

  // 1. Try standard server cookie session
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    return { success: 'Password updated successfully!' }
  }

  // 2. If cookie session missing, verify accessToken passed from client URL hash
  if (accessToken) {
    const supabaseAdmin = createAdminClient()
    const { data: tokenUser } = await supabaseAdmin.auth.getUser(accessToken)

    if (tokenUser?.user) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(tokenUser.user.id, {
        password: password
      })
      if (updateError) return { error: updateError.message }
      return { success: 'Password updated successfully!' }
    }
  }

  return { error: 'Your session has expired or is invalid. Please open the activation/reset link directly from your email.' }
}
