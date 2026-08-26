import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderStatementEmailHtml } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      // Empty body fallback
    }

    const scope = body?.scope || 'all'
    const targetId = body?.targetId

    const supabase = createAdminClient()

    // 1. Get clients according to target scope
    let clientQuery = supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'client')

    if (scope === 'client' && targetId) {
      clientQuery = clientQuery.eq('id', targetId)
    }

    const { data: clients, error: clientsError } = await clientQuery

    if (clientsError || !clients) {
      throw new Error('Failed to fetch clients')
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // 2. For each client, get their latest ledger & invested capital
    for (const client of clients) {
      if (!client.email) continue

      const { data: ledgerData } = await supabase
        .from('ledger')
        .select('current_value')
        .eq('user_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const { data: capitalData } = await supabase
        .from('invested_capital')
        .select('amount_invested')
        .eq('user_id', client.id)

      const currentValue = ledgerData && ledgerData.length > 0 ? Number(ledgerData[0].current_value) : 0
      const investedAmount = capitalData
        ? capitalData.reduce((acc, row) => acc + Number(row.amount_invested || 0), 0)
        : 0

      // Render institutional HTML template
      const emailHtml = renderStatementEmailHtml({
        clientName: client.full_name || 'Investor',
        clientEmail: client.email,
        currentValue,
        investedAmount,
        portalUrl: `${siteUrl}/client`
      })

      // 3. Send email using Resend
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Hedge Capital <updates@cpthedge.com>',
        to: client.email,
        subject: `Monthly Portfolio Performance Statement - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        html: emailHtml
      })
    }

    return NextResponse.json({ success: true, message: `Dispatched ${clients.length} statements successfully` })
  } catch (error: any) {
    console.error('Error sending statements:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
