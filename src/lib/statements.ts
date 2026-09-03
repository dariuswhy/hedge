import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderStatementEmailHtml } from '@/lib/email-templates'

export interface DispatchStatementsOptions {
  scope?: 'all' | 'pool' | 'client' | string
  targetId?: string
}

export interface DispatchStatementsResult {
  success?: boolean
  error?: string
  dispatchedCount?: number
  recipients?: string[]
  message?: string
}

export async function dispatchStatementsPayload({
  scope = 'all',
  targetId
}: DispatchStatementsOptions): Promise<DispatchStatementsResult> {
  const supabase = createAdminClient()
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    return { error: 'RESEND_API_KEY environment variable is not configured.' }
  }

  const resend = new Resend(apiKey)
  let targetProfiles: { id: string; full_name?: string | null; email?: string | null }[] = []

  // 1. Resolve Target Profiles based on scope
  if (scope === 'client') {
    if (!targetId) {
      return { error: 'Please choose a specific client to deploy statements.' }
    }
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', targetId)
      .single()

    if (error || !profile) {
      return { error: `Client not found in database: ${error?.message || 'Invalid target ID'}` }
    }
    targetProfiles = [profile]
  } else if (scope === 'pool') {
    if (!targetId) {
      return { error: 'Please choose a specific hedge pool.' }
    }
    const { data: memberRows, error: memberErr } = await supabase
      .from('hedge_pool_members')
      .select('user_id')
      .eq('pool_id', targetId)

    if (memberErr) {
      return { error: `Failed to fetch pool members: ${memberErr.message}` }
    }

    if (!memberRows || memberRows.length === 0) {
      return { error: 'Selected hedge pool currently has no enrolled investor members.' }
    }

    const userIds = memberRows.map(m => m.user_id)
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profErr || !profiles) {
      return { error: `Failed to fetch profiles for pool members: ${profErr?.message}` }
    }
    targetProfiles = profiles
  } else {
    // Default 'all' - fetch all profiles with an email
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')

    if (error || !profiles) {
      return { error: `Failed to fetch client directory: ${error?.message}` }
    }
    targetProfiles = profiles
  }

  const validRecipients = targetProfiles.filter(p => !!p.email && p.email.includes('@'))

  if (validRecipients.length === 0) {
    return { error: 'No clients with valid email addresses found for the selected scope.' }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const configuredFrom = process.env.RESEND_FROM_EMAIL || 'Hedge Capital <onboarding@resend.dev>'
  const fallbackFrom = 'Hedge Capital <onboarding@resend.dev>'

  let successfulCount = 0
  const dispatchedEmails: string[] = []
  const failureReasons: string[] = []

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  // 2. Process each client and deliver statement payload
  for (const client of validRecipients) {
    const clientEmail = client.email!.trim()

    // Fetch latest ledger entry
    const { data: ledgerData } = await supabase
      .from('ledger')
      .select('current_value')
      .eq('user_id', client.id)
      .order('created_at', { ascending: false })
      .limit(1)

    // Fetch total invested capital
    const { data: capitalData } = await supabase
      .from('invested_capital')
      .select('amount_invested')
      .eq('user_id', client.id)

    const currentValue = ledgerData && ledgerData.length > 0 ? Number(ledgerData[0].current_value) : 0
    const investedAmount = capitalData
      ? capitalData.reduce((acc, row) => acc + Number(row.amount_invested || 0), 0)
      : 0

    const emailHtml = renderStatementEmailHtml({
      clientName: client.full_name || 'Valued Investor',
      clientEmail: clientEmail,
      currentValue,
      investedAmount,
      portalUrl: `${siteUrl}/client`
    })

    const subject = `Monthly Portfolio Performance Statement - ${currentMonthName}`

    // Attempt delivery with configured sender first
    let sendResult = await resend.emails.send({
      from: configuredFrom,
      to: clientEmail,
      subject,
      html: emailHtml
    })

    // If configured sender failed (e.g. unverified domain 403), retry with verified onboarding@resend.dev
    if (sendResult.error && configuredFrom !== fallbackFrom) {
      console.warn(`Initial send failed with ${configuredFrom} (${sendResult.error.message}). Retrying with ${fallbackFrom}...`)
      sendResult = await resend.emails.send({
        from: fallbackFrom,
        to: clientEmail,
        subject,
        html: emailHtml
      })
    }

    if (sendResult.data?.id) {
      successfulCount++
      dispatchedEmails.push(clientEmail)
    } else if (sendResult.error) {
      console.error(`Failed to send statement to ${clientEmail}:`, sendResult.error)
      failureReasons.push(`${clientEmail}: ${sendResult.error.message}`)
    }
  }

  if (successfulCount === 0 && failureReasons.length > 0) {
    return {
      error: `Failed to deliver statements: ${failureReasons.join(' | ')}`
    }
  }

  return {
    success: true,
    dispatchedCount: successfulCount,
    recipients: dispatchedEmails,
    message: `Statements successfully dispatched to ${successfulCount} client(s) (${dispatchedEmails.join(', ')})!`
  }
}
