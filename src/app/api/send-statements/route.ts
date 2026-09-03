import { NextResponse } from 'next/server'
import { dispatchStatementsPayload } from '@/lib/statements'

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

    const result = await dispatchStatementsPayload({ scope, targetId })

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      dispatchedCount: result.dispatchedCount,
      recipients: result.recipients
    })
  } catch (error: any) {
    console.error('Error sending statements:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

