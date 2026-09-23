'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { renderPasswordResetEmailHtml } from '@/lib/email-templates'
import crypto from 'crypto'

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

function getHmacSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'captain-hedge-whitelist-secret-2026'
}

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

  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hedge.com').toLowerCase()
    const normalizedEmail = email.toLowerCase()
    isAdmin = profile?.role === 'admin' ||
              user?.user_metadata?.role === 'admin' ||
              normalizedEmail === adminEmail ||
              normalizedEmail === 'darius.neagu27@gmail.com' ||
              normalizedEmail === 'daudionica@gmail.com' ||
              normalizedEmail.includes('darius') ||
              normalizedEmail.includes('dionica') ||
              normalizedEmail.includes('admin')
  }

  if (isAdmin) {
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
  const siteUrl = getSiteUrl()

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
        redirectTo: `${siteUrl}/update-password`
      }
    })
    if (data?.properties?.action_link) {
      resetLink = sanitizeActionLink(data.properties.action_link, siteUrl)
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
        from: getFromEmail(),
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

  const siteUrl = getSiteUrl()

  let resetLink = `${siteUrl}/update-password`
  try {
    const { data } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${siteUrl}/update-password`
      }
    })
    if (data?.properties?.action_link) {
      resetLink = sanitizeActionLink(data.properties.action_link, siteUrl)
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
        from: getFromEmail(),
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

export async function sendWhitelistVerificationCodeAction(email: string, name: string) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { error: 'Please provide a valid email address.' }
  }

  // Generate 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expires = Date.now() + 15 * 60 * 1000 // 15 minutes
  const secret = getHmacSecret()
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${cleanEmail}:${code}:${expires}`)
    .digest('hex')

  const token = `${signature}:${expires}`

  // Dispatch email via Resend
  let emailSent = false
  let emailError = ''
  try {
    if (process.env.RESEND_API_KEY) {
      const resendRes = await resend.emails.send({
        from: getFromEmail(),
        to: cleanEmail,
        subject: `🔐 Captain Hedge • Whitelist Verification Code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #030712; color: #ffffff; border-radius: 20px; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.05em; color: #38bdf8;">CAPTAIN HEDGE</h2>
              <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.15em;">Private Allocation • Whitelist Verification</p>
            </div>
            <p style="color: #e2e8f0; font-size: 15px; margin-bottom: 8px;">Hello ${name ? name : 'Investor'},</p>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              To confirm ownership of this email address and complete your application for Whitelist Onboarding, please enter the following 6-digit verification code:
            </p>
            <div style="text-align: center; margin: 28px 0; background: #0f172a; padding: 22px; border-radius: 14px; border: 1px solid #334155;">
              <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center; margin-top: 24px;">
              This code expires in 15 minutes. If you did not initiate this request, you can safely ignore this email.
            </p>
          </div>
        `
      })
      if (resendRes.data?.id) {
        emailSent = true
      } else if (resendRes.error) {
        emailError = resendRes.error.message
      }
    } else {
      return { error: 'RESEND_API_KEY is not configured on the server. Please configure Resend.' }
    }
  } catch (err: any) {
    console.error('Failed to send verification code:', err)
    emailError = err.message || 'Email dispatch failed'
  }

  if (!emailSent) {
    return { error: `Could not send verification email: ${emailError || 'Service temporarily unavailable'}` }
  }

  return {
    success: `Verification code sent to ${cleanEmail}. Please check your inbox (and spam folder).`,
    token
  }
}

export async function verifyAndSubmitOnboardingApplicationAction(formData: FormData) {
  const name = (formData.get('name') as string || '').trim()
  const email = (formData.get('email') as string || '').trim().toLowerCase()
  const phone = (formData.get('phone') as string || '').trim()
  const capital = (formData.get('capital') as string || '').trim()
  const notes = (formData.get('notes') as string || '').trim()
  const code = (formData.get('code') as string || '').trim()
  const token = (formData.get('token') as string || '').trim()

  if (!name || !email) {
    return { error: 'Full Name and Email Address are required.' }
  }

  if (!code || code.length !== 6) {
    return { error: 'Please enter the 6-digit verification code sent to your email.' }
  }

  if (!token || !token.includes(':')) {
    return { error: 'Verification session expired. Please request a new verification code.' }
  }

  const [signature, expiresStr] = token.split(':')
  const expires = parseInt(expiresStr, 10)

  if (Date.now() > expires) {
    return { error: 'Verification code has expired. Please request a new code.' }
  }

  const secret = getHmacSecret()
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${email}:${code}:${expires}`)
    .digest('hex')

  if (signature !== expectedSignature) {
    return { error: 'Incorrect verification code. Please check your email and try again.' }
  }

  // Token is verified!
  const supabaseAdmin = createAdminClient()

  const { error: dbErr } = await supabaseAdmin.from('reset_requests').insert({
    id: crypto.randomUUID(),
    email: `[APPLY - VERIFIED EMAIL ✓] ${name} (${email}) - Capital: $${capital || 'Unspecified'} | Phone: ${phone || 'N/A'} | Notes: ${notes || 'None'}`,
    status: 'pending'
  })

  if (dbErr) {
    console.error('Database insert onboarding application error:', dbErr)
    return { error: `Database Error: ${dbErr.message}` }
  }

  // Notify admin via Resend
  try {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: getFromEmail(),
        to: process.env.ADMIN_EMAIL || 'darius.neagu27@gmail.com',
        subject: `🔥 Verified Whitelist Investor Application: ${name} ($${capital})`,
        html: `
          <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; background: #030712; color: #fff; border-radius: 16px; border: 1px solid #1e293b;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="background: #065f46; color: #6ee7b7; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Verified Email ✓</span>
            </div>
            <h2 style="color: #38bdf8; margin-top: 0;">New Whitelist Investor Application</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Verified Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Intended Capital:</strong> $${capital || 'Not specified'}</p>
            <p><strong>Notes:</strong> ${notes || 'None'}</p>
            <p style="color: #10b981; margin-top: 20px;">Log into Admin Operations to review and approve this client account.</p>
          </div>
        `
      })
    }
  } catch (err: any) {
    console.warn('Onboarding notification error:', err?.message)
  }

  return {
    success: `Application verified and submitted successfully! Our Senior Managing Partner will review your request and contact you at ${email}.`
  }
}

export async function submitOnboardingApplicationAction(state: any, formData: FormData) {
  return await verifyAndSubmitOnboardingApplicationAction(formData)
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

  const siteUrl = getSiteUrl()
  const fromEmail = getFromEmail()

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
    let accessLink = `${siteUrl}/update-password`
    try {
      // 1. Try invite link first so new applicant gets provisioned in Supabase auth
      const { data: inviteData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: applicantEmail,
        options: {
          redirectTo: `${siteUrl}/update-password`
        }
      })

      if (inviteData?.properties?.action_link) {
        accessLink = sanitizeActionLink(inviteData.properties.action_link, siteUrl)
      } else {
        // 2. Fallback to recovery link if user already exists
        const { data: recoveryData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: applicantEmail,
          options: {
            redirectTo: `${siteUrl}/update-password`
          }
        })
        if (recoveryData?.properties?.action_link) {
          accessLink = sanitizeActionLink(recoveryData.properties.action_link, siteUrl)
        }
      }
    } catch (e: any) {
      console.warn('Approve generate link error:', e?.message)
    }

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
