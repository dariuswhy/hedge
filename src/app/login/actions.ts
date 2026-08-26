'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { renderPasswordResetEmailHtml } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hedge.com'
  if (email.toLowerCase() === adminEmail.toLowerCase()) {
    redirect('/admin')
  } else {
    redirect('/client')
  }
}

export async function requestPasswordResetApprovalAction(state: any, formData: FormData) {
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  if (!email) return { error: 'Please enter your registered email address.' }

  const supabase = await createClient()
  const supabaseAdmin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  // 1. Insert reset request row
  await supabase.from('reset_requests').insert({
    email,
    status: 'pending'
  })

  // 2. Generate Supabase Recovery Link
  let resetLink = `${siteUrl}/update-password`
  try {
    const { data } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback?type=recovery&next=/update-password`
      }
    })
    if (data?.properties?.action_link) {
      resetLink = data.properties.action_link
    }
  } catch (e) {
    console.warn('Generate link fallback:', e)
  }

  // 3. Render institutional HTML email
  const emailHtml = renderPasswordResetEmailHtml({
    clientEmail: email,
    resetLink
  })

  // 4. Send email directly via Resend to client's email inbox
  let emailSent = false
  try {
    if (process.env.RESEND_API_KEY) {
      const emailRes = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Hedge Capital <updates@cpthedge.com>',
        to: email,
        subject: 'Authorization: Reset Your Hedge Capital Password',
        html: emailHtml
      })
      if (emailRes.data?.id) {
        emailSent = true
      }
    }
  } catch (resendErr: any) {
    console.warn('Resend email error:', resendErr?.message)
  }

  return {
    success: emailSent
      ? `Password reset link sent to ${email}! Check your inbox.`
      : `Password reset request submitted for ${email}. Admin approval log created.`
  }
}

export async function approveResetRequestAction(requestId: string, email: string) {
  if (!email) return { error: 'Email is required' }

  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  let resetLink = `${siteUrl}/update-password`
  try {
    const { data } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback?type=recovery&next=/update-password`
      }
    })
    if (data?.properties?.action_link) {
      resetLink = data.properties.action_link
    }
  } catch (err: any) {
    console.warn('Admin recovery link fallback:', err?.message)
  }

  const emailHtml = renderPasswordResetEmailHtml({
    clientEmail: email,
    resetLink
  })

  // Send via Resend
  let emailSuccess = false
  try {
    if (process.env.RESEND_API_KEY) {
      const resendRes = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Hedge Capital <updates@cpthedge.com>',
        to: email,
        subject: 'Approved: Reset Your Hedge Capital Password',
        html: emailHtml
      })
      if (resendRes.data?.id) {
        emailSuccess = true
      }
    }
  } catch (e: any) {
    console.warn('Resend send err:', e?.message)
  }

  if (requestId) {
    await supabase.from('reset_requests').update({ status: 'approved' }).eq('id', requestId)
  }

  return {
    success: `Approved for ${email}! ${emailSuccess ? 'Email sent to inbox.' : ''} Recovery Link: ${resetLink}`
  }
}

export async function submitOnboardingApplicationAction(state: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  const phone = formData.get('phone') as string
  const capital = formData.get('capital') as string
  const notes = formData.get('notes') as string

  if (!email || !name) {
    return { error: 'Full Name and Email Address are required.' }
  }

  const supabaseAdmin = createAdminClient()

  // Insert application row in reset_requests table with explicit UUID
  const { error: dbErr } = await supabaseAdmin.from('reset_requests').insert({
    id: crypto.randomUUID(),
    email: `[APPLY] ${name} (${email}) - Capital: $${capital || 'Unspecified'} | Phone: ${phone || 'N/A'} | Notes: ${notes || 'None'}`,
    status: 'pending'
  })

  if (dbErr) {
    console.error('Database insert onboarding application error:', dbErr)
    return { error: `Database Error: ${dbErr.message}. Please ensure reset_requests table is created in Supabase.` }
  }

  // Notify admin via Resend if API key is present
  try {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Hedge Capital <updates@cpthedge.com>',
        to: process.env.ADMIN_EMAIL || 'admin@hedge.com',
        subject: `🔥 New Whitelist Access Application: ${name} ($${capital})`,
        html: `
          <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; background: #030712; color: #fff; border-radius: 16px; border: 1px solid #1e293b;">
            <h2 style="color: #3b82f6;">New Whitelist Investor Application</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Intended Capital:</strong> $${capital || 'Not specified'}</p>
            <p><strong>Notes:</strong> ${notes || 'None'}</p>
            <p style="color: #10b981;">Log into Admin Operations to review and approve this client account.</p>
          </div>
        `
      })
    }
  } catch (err: any) {
    console.warn('Onboarding notification error:', err?.message)
  }

  return {
    success: `Application submitted successfully! Our Senior Managing Partner will review your whitelist request and contact you at ${email}.`
  }
}

export async function respondToApplicationAction(
  requestId: string,
  applicantEmail: string,
  actionType: 'schedule_meeting' | 'approve' | 'decline',
  details?: { meetingDate?: string; meetingLink?: string; meetingType?: string; customMessage?: string }
) {
  if (!applicantEmail) return { error: 'Applicant email is required.' }

  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hedge Capital <updates@cpthedge.com>'

  let emailSubject = ''
  let emailHtml = ''

  if (actionType === 'schedule_meeting') {
    emailSubject = 'Invitation: Hedge Capital Private Consultation & Onboarding'
    emailHtml = `
      <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background: #030712; color: #ffffff; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #3b82f6; font-weight: 300; margin: 0;">HEDGE CAPITAL MANAGEMENT</h2>
          <p style="color: #94a3b8; font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px;">Private Investor Consultation Invitation</p>
        </div>
        
        <p style="color: #e2e8f0; font-size: 14px;">Hello,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Thank you for applying for allocation whitelist access with Hedge Capital. We are pleased to invite you to a private consultation interview with our Managing Partners.
        </p>

        <div style="background-color: #090d16; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Scheduled Consultation Details</div>
          <div style="font-size: 15px; color: #ffffff; font-weight: bold; font-family: monospace; margin-bottom: 6px;">📅 Date & Time: ${details?.meetingDate || 'To be confirmed'}</div>
          <div style="font-size: 14px; color: #60a5fa; font-family: monospace;">📍 Meeting Location / Format: ${details?.meetingType || 'Google Meet Online Video Call'}</div>
          ${details?.meetingLink ? `<div style="margin-top: 12px;"><a href="${details.meetingLink}" style="background-color: #2563eb; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; display: inline-block;">Join Google Meet Consultation →</a></div>` : ''}
        </div>

        ${details?.customMessage ? `<p style="color: #cbd5e1; font-size: 13px; font-style: italic; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;">"${details.customMessage}"</p>` : ''}

        <p style="color: #64748b; font-size: 11px; margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 15px; text-align: center;">
          © 2026 Hedge Capital Management LLC. Confidential communication intended solely for ${applicantEmail}.
        </p>
      </div>
    `
  } else if (actionType === 'decline') {
    emailSubject = 'Update Regarding Your Hedge Capital Allocation Application'
    emailHtml = `
      <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background: #030712; color: #ffffff; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #64748b; font-weight: 300; margin: 0;">HEDGE CAPITAL MANAGEMENT</h2>
        </div>
        <p style="color: #e2e8f0; font-size: 14px;">Hello,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Thank you for your interest in Hedge Capital and taking the time to submit your whitelist application.
        </p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          At this time, our private allocation quota for this investment cycle is fully subscribed. We have placed your profile on our priority waiting list for future capital expansion windows.
        </p>
        <p style="color: #64748b; font-size: 11px; margin-top: 30px; border-top: 1px solid #1e293b; padding-top: 15px; text-align: center;">
          © 2026 Hedge Capital Management LLC.
        </p>
      </div>
    `
  } else {
    // Approve action
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: applicantEmail,
      options: {
        redirectTo: `${siteUrl}/auth/callback?type=recovery&next=/update-password`
      }
    })
    const accessLink = linkData?.properties?.action_link || `${siteUrl}/update-password`

    emailSubject = 'Approved: Welcome to Hedge Capital Private Allocation'
    emailHtml = `
      <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 30px; background: #030712; color: #ffffff; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #10b981; font-weight: 300; margin: 0;">APPLICATION APPROVED</h2>
          <p style="color: #94a3b8; font-size: 12px; font-family: monospace;">Welcome to Hedge Capital</p>
        </div>
        <p style="color: #e2e8f0; font-size: 14px;">Hello,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          We are pleased to inform you that your whitelist access application for <strong>${applicantEmail}</strong> has been approved by our Managing Partners.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${accessLink}" style="background-color: #10b981; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;">Activate Client Portal & Password →</a>
        </div>
      </div>
    `
  }

  // Update status in reset_requests
  if (requestId) {
    await supabaseAdmin
      .from('reset_requests')
      .update({ status: actionType === 'decline' ? 'rejected' : 'approved' })
      .eq('id', requestId)
  }

  // Dispatch email via Resend
  let emailSent = false
  try {
    if (process.env.RESEND_API_KEY) {
      const resendRes = await resend.emails.send({
        from: fromEmail,
        to: applicantEmail,
        subject: emailSubject,
        html: emailHtml
      })
      if (resendRes.data?.id) emailSent = true
    }
  } catch (e: any) {
    console.warn('Resend response error:', e?.message)
  }

  return {
    success: `Application updated (${actionType.toUpperCase()}) for ${applicantEmail}! ${emailSent ? 'Email response sent.' : ''}`
  }
}
