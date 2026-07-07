import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    // Note: In production, verify authorization (e.g., cron secret or admin session)
    // const authHeader = req.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Unauthorized', { status: 401 })

    const supabase = createAdminClient()

    // 1. Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'client')

    if (clientsError || !clients) {
      throw new Error('Failed to fetch clients')
    }

    // 2. For each client, get their latest ledger entry
    for (const client of clients) {
      if (!client.email) continue

      const { data: ledgerData } = await supabase
        .from('ledger')
        .select('current_value')
        .eq('user_id', client.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const currentValue = ledgerData && ledgerData.length > 0 ? ledgerData[0].current_value : 0

      // 3. Send email using Resend
      await resend.emails.send({
        from: 'Hedge Fund <updates@your-verified-domain.com>', // Update with a verified domain
        to: client.email,
        subject: 'Your Latest Fund Performance Statement',
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
            <h2 style="color: #111;">Performance Update</h2>
            <p style="color: #444;">Hello ${client.full_name},</p>
            <p style="color: #444;">Your latest statement is now available. Your current total share value in the fund is:</p>
            <h1 style="color: #3b82f6; font-size: 32px;">$${Number(currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h1>
            <p style="color: #444;">You can log in to your dashboard to view your complete performance history and ROI.</p>
            <br/>
            <p style="color: #888; font-size: 12px;">This is an automated message from the Hedge Fund Portal.</p>
          </div>
        `
      })
    }

    return NextResponse.json({ success: true, message: `Sent ${clients.length} statements` })
  } catch (error: any) {
    console.error('Error sending statements:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
