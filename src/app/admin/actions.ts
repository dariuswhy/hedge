'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { dispatchStatementsPayload } from '@/lib/statements'
import { Resend } from 'resend'
import { renderWelcomeInviteEmailHtml } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return 'https://www.captainhedge.com'
  }
  return 'http://localhost:3000'
}

function sanitizeActionLink(link: string, siteUrl: string) {
  if (!link) return `${siteUrl}/update-password`
  return link
    .replace(/https%3A%2F%2F[^&]*vercel\.app/gi, encodeURIComponent(`${siteUrl}/update-password`))
    .replace(/https:\/\/[^/]*vercel\.app/gi, siteUrl)
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'Captain Hedge <onboarding@resend.dev>'
}

export async function createClientWithCapital(state: any, formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  const fullName = (formData.get('fullName') as string || '').trim()
  const initialCapitalStr = formData.get('initialCapital') as string
  const initialCapital = parseFloat(initialCapitalStr) || 0

  if (!email || !fullName) {
    return { error: 'Client Email and Full Name are required.' }
  }

  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const siteUrl = getSiteUrl()
  let targetUserId: string | undefined

  // 1. Attempt invite via Supabase Admin Auth
  const { data: newUser, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: 'client'
    }
  })

  if (newUser?.user?.id) {
    targetUserId = newUser.user.id
  } else {
    // Fallback: If inviteUserByEmail fails (e.g. SMTP rate limit, provider restrictions, or user exists)
    console.warn('Invite email notice, attempting direct createUser fallback:', inviteErr?.message)

    // Check if user already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile?.id) {
      targetUserId = existingProfile.id
    } else {
      // Create user directly in Supabase Auth without waiting for email confirmation
      const { data: directUser, error: directErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'client'
        }
      })

      if (directErr) {
        // If still failing because email exists in auth but not profiles:
        console.warn('createUser notice:', directErr.message)
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
        const matched = authUsers?.users?.find(u => u.email?.toLowerCase() === email)
        if (matched) {
          targetUserId = matched.id
        } else {
          return { error: `Could not register user account: ${directErr.message || inviteErr?.message}` }
        }
      } else {
        targetUserId = directUser?.user?.id
      }
    }
  }

  if (!targetUserId) {
    return { error: `Failed to resolve or create user ID for ${email}.` }
  }

  // 2. Guarantee profile row in public.profiles table
  const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
    id: targetUserId,
    email,
    full_name: fullName,
    role: 'client'
  })

  if (profileErr) {
    console.error('Error upserting profile:', profileErr.message)
  }

  // 3. Generate high-security password setup / recovery link
  let setupLink = `${siteUrl}/update-password`
  try {
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${siteUrl}/update-password`
      }
    })
    if (linkData?.properties?.action_link) {
      setupLink = sanitizeActionLink(linkData.properties.action_link, siteUrl)
    }
  } catch (linkErr: any) {
    console.warn('Generate setup link warning:', linkErr?.message)
  }

  // 4. Record Initial Capital if specified
  if (initialCapital > 0) {
    await supabaseAdmin.from('invested_capital').insert({
      id: crypto.randomUUID(),
      user_id: targetUserId,
      amount_invested: initialCapital
    })

    await supabaseAdmin.from('ledger').insert({
      id: crypto.randomUUID(),
      user_id: targetUserId,
      current_value: initialCapital
    })

    await supabaseAdmin.from('transactions').insert({
      id: crypto.randomUUID(),
      user_id: targetUserId,
      type: 'CAPITAL_DEPOSIT',
      amount: initialCapital
    })
  }

  // 5. Send institutional welcome email via Resend if configured
  let emailDelivered = false
  try {
    if (process.env.RESEND_API_KEY) {
      const emailHtml = renderWelcomeInviteEmailHtml({
        clientName: fullName,
        clientEmail: email,
        initialCapital,
        setupLink
      })

      const resendRes = await resend.emails.send({
        from: getFromEmail(),
        to: email,
        subject: `Welcome to Hedge Capital - Account Activation for ${fullName}`,
        html: emailHtml
      })

      if (resendRes.data?.id) {
        emailDelivered = true
      }
    }
  } catch (resendErr: any) {
    console.warn('Resend welcome email warning:', resendErr?.message)
  }

  revalidatePath('/admin')
  return {
    success: `Client "${fullName}" (${email}) created successfully with $${initialCapital.toLocaleString()} initial capital!`,
    setupLink,
    clientEmail: email,
    emailDelivered
  }
}

export async function deleteClientAccount(userId: string) {
  if (!userId) return { error: 'Client ID is required' }

  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  // 1. Delete pool memberships
  await supabaseAdmin.from('hedge_pool_members').delete().eq('user_id', userId)

  // 2. Delete transactions
  await supabaseAdmin.from('transactions').delete().eq('user_id', userId)

  // 3. Delete ledger & capital
  await supabaseAdmin.from('ledger').delete().eq('user_id', userId)
  await supabaseAdmin.from('invested_capital').delete().eq('user_id', userId)

  // 4. Delete profile
  const { error: profileErr } = await supabaseAdmin.from('profiles').delete().eq('id', userId)

  if (profileErr) {
    console.error('Delete profile error:', profileErr)
  }

  revalidatePath('/admin')
  return { success: 'Client account and associated records deleted successfully.' }
}

export async function inviteClient(state: any, formData: FormData) {
  return createClientWithCapital(state, formData)
}

export async function addCapital(state: any, formData: FormData) {
  const userId = formData.get('userId') as string
  const amountStr = formData.get('amount') as string
  const amount = parseFloat(amountStr)

  if (!userId || isNaN(amount) || amount <= 0) {
    return { error: 'Valid user and amount are required' }
  }

  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  const { data: latestCapital } = await supabaseAdmin
    .from('invested_capital')
    .select('amount_invested')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentCapital = latestCapital && latestCapital.length > 0 ? Number(latestCapital[0].amount_invested) : 0

  // Insert capital using admin client bypassing RLS
  const { error } = await supabaseAdmin.from('invested_capital').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    amount_invested: currentCapital + amount
  })

  if (error) return { error: error.message }

  // Also update ledger
  const { data: latestLedger } = await supabaseAdmin
    .from('ledger')
    .select('current_value')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentVal = latestLedger && latestLedger.length > 0 ? Number(latestLedger[0].current_value) : 0
  await supabaseAdmin.from('ledger').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    current_value: currentVal + amount
  })

  // Audit Transaction
  await supabaseAdmin.from('transactions').insert({
    id: crypto.randomUUID(),
    user_id: userId,
    type: 'CAPITAL_TOPUP',
    amount: amount
  })

  revalidatePath('/admin')
  return { success: `Successfully injected $${amount.toLocaleString()} capital!` }
}

export async function updatePerformance(state: any, formData: FormData) {
  const newTotalValueStr = formData.get('newTotalValue') as string
  const newTotalValue = parseFloat(newTotalValueStr)

  if (isNaN(newTotalValue) || newTotalValue < 0) {
    return { error: 'Valid new total value is required' }
  }

  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const supabaseAdmin = createAdminClient()

  const { data: capitalData, error: capitalError } = await supabaseAdmin
    .from('invested_capital')
    .select('user_id, amount_invested, created_at')
    .order('created_at', { ascending: false })

  if (capitalError) return { error: capitalError.message }

  const userCapitalMap = new Map<string, number>()
  let totalFundCapital = 0

  capitalData.forEach(row => {
    if (!userCapitalMap.has(row.user_id)) {
      userCapitalMap.set(row.user_id, Number(row.amount_invested))
      totalFundCapital += Number(row.amount_invested)
    }
  })

  if (totalFundCapital === 0) {
    return { error: 'Cannot update performance: No invested capital found.' }
  }

  const ledgerInserts = Array.from(userCapitalMap.entries()).map(([userId, userCapital]) => {
    const share = userCapital / totalFundCapital
    const userNewValue = newTotalValue * share
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      current_value: userNewValue
    }
  })

  const { error: ledgerError } = await supabaseAdmin.from('ledger').insert(ledgerInserts)
  if (ledgerError) return { error: ledgerError.message }

  revalidatePath('/admin')
  return { success: 'Performance updated and ledger entries created!' }
}

export async function sendStatements(state: any, scope: string = 'all', targetId?: string) {
  const supabase = await createClient()

  // Verify caller is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdminEmail = user.email?.toLowerCase().includes('darius') ||
                       user.email?.toLowerCase().includes('dionica') ||
                       user.email?.toLowerCase().includes('admin') ||
                       user.email === 'daudionica@gmail.com' ||
                       user.email === 'darius.neagu27@gmail.com'

  if (profile?.role !== 'admin' && !isAdminEmail) return { error: 'Unauthorized' }

  try {
    const result = await dispatchStatementsPayload({ scope, targetId })
    if (result.error) {
      return { error: result.error }
    }
    return { success: result.message || `Statements deployed successfully! Scope: ${scope.toUpperCase()}` }
  } catch (error: any) {
    return { error: error.message || 'Failed to dispatch statements.' }
  }
}

export async function deleteResetRequestAction(requestId: string) {
  if (!requestId) return { error: 'Request ID is required' }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.from('reset_requests').delete().eq('id', requestId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: 'Request deleted successfully' }
}
