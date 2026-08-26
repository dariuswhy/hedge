/**
 * Institutional Email Template Engine for Hedge Capital
 * Produces ultra-professional, brand-pure HTML email templates with legal disclosures, contact info, and metrics.
 */

interface StatementTemplateParams {
  clientName: string
  clientEmail: string
  currentValue: number
  investedAmount?: number
  netProfit?: number
  roiPct?: number
  portalUrl?: string
}

interface PasswordResetTemplateParams {
  clientEmail: string
  resetLink: string
}

const COMMON_HEADER = `
  <!-- HEADER BANNER -->
  <div style="background: linear-gradient(135deg, #090d16 0%, #030712 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #1e293b; border-radius: 16px 16px 0 0;">
    <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: linear-gradient(135deg, #2563eb, #7c3aed); border-radius: 12px; margin-bottom: 12px; box-shadow: 0 0 20px rgba(37, 99, 235, 0.4);">
      <span style="color: #ffffff; font-size: 22px; font-weight: bold; font-family: sans-serif; line-height: 44px;">▲</span>
    </div>
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; tracking: 1px; color: #ffffff; letter-spacing: 1px;">
      HEDGE<span style="color: #3b82f6;">CAPITAL</span>
    </div>
    <div style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-top: 4px;">
      INSTITUTIONAL QUANTITATIVE ASSET MANAGEMENT
    </div>
  </div>
`

const COMMON_FOOTER = `
  <!-- FOOTER & LEGAL DISCLOSURES -->
  <div style="background-color: #030712; padding: 28px 24px; border-top: 1px solid #1e293b; border-radius: 0 0 16px 16px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #475569;">
    
    <div style="margin-bottom: 16px; text-align: center;">
      <a href="https://cpthedge.com" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin: 0 10px;">Portal Login</a> •
      <a href="mailto:support@cpthedge.com" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin: 0 10px;">Support: support@cpthedge.com</a> •
      <a href="mailto:admin@cpthedge.com" style="color: #3b82f6; text-decoration: none; font-weight: 600; margin: 0 10px;">Compliance: admin@cpthedge.com</a>
    </div>

    <div style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; margin-bottom: 16px; text-align: justify;">
      <strong style="color: #64748b; display: block; text-transform: uppercase; font-size: 10px; margin-bottom: 4px; text-align: center;">Risk & Performance Disclosure</strong>
      Trading foreign exchange, equities, and digital assets on margin carries high risk and may not be suitable for all investors. Past performance is not necessarily indicative of future results. Portfolio valuations are updated in real-time based on active quantitative pool allocations and net asset values (NAV).
    </div>

    <div style="text-align: center; color: #334155; font-size: 10px;">
      © 2026 Hedge Capital Management LLC. All rights reserved.<br/>
      Confidential investor communication intended solely for <strong>{{CLIENT_EMAIL}}</strong>.
    </div>
  </div>
`

export function renderStatementEmailHtml({
  clientName,
  clientEmail,
  currentValue,
  investedAmount = 0,
  portalUrl = 'http://localhost:3000/client'
}: StatementTemplateParams): string {
  const currentValFormatted = Number(currentValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const investedFormatted = Number(investedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const netProfit = Number(currentValue || 0) - Number(investedAmount || 0)
  const roi = investedAmount > 0 ? (netProfit / investedAmount) * 100 : 0
  const isProfit = netProfit >= 0

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hedge Capital Performance Statement</title>
  </head>
  <body style="background-color: #0f172a; margin: 0; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden;">
      
      ${COMMON_HEADER}

      <!-- BODY CONTENT -->
      <div style="padding: 32px 24px; color: #f8fafc;">
        
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 20px; font-weight: 400; color: #ffffff; margin: 0 0 8px 0;">Portfolio Performance Statement</h1>
          <p style="font-size: 14px; color: #94a3b8; margin: 0;">Dear <strong>${clientName || 'Valued Investor'}</strong>,</p>
        </div>

        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px;">
          Your monthly portfolio valuation audit is complete. Below is your current net asset value and performance summary across your active allocations:
        </p>

        <!-- MAIN VALUATION CARD -->
        <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%); border: 1px solid #334155; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; display: block; margin-bottom: 6px;">
            Total Fund Portfolio Valuation
          </span>
          <div style="font-size: 36px; font-weight: 800; color: #3b82f6; font-family: monospace; tracking: -1px; margin-bottom: 12px;">
            $${currentValFormatted}
          </div>

          <div style="display: flex; justify-content: center; gap: 15px; border-top: 1px solid #1e293b; pt-16px; margin-top: 16px; padding-top: 16px;">
            <div style="flex: 1; text-align: center;">
              <span style="font-size: 10px; text-transform: uppercase; color: #64748b; display: block;">Principal Capital</span>
              <strong style="font-size: 14px; color: #e2e8f0; font-family: monospace;">$${investedFormatted}</strong>
            </div>
            <div style="flex: 1; text-align: center; border-left: 1px solid #1e293b;">
              <span style="font-size: 10px; text-transform: uppercase; color: #64748b; display: block;">Net Return (ROI)</span>
              <strong style="font-size: 14px; color: ${isProfit ? '#10b981' : '#ef4444'}; font-family: monospace;">
                ${isProfit ? '+' : ''}$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${roi.toFixed(1)}%)
              </strong>
            </div>
          </div>
        </div>

        <!-- CTA BUTTON -->
        <div style="text-align: center; margin: 32px 0 20px 0;">
          <a href="${portalUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);">
            Access Client Portal & Reports →
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
          If you have any questions regarding your statement, please contact your portfolio administrator.
        </p>
      </div>

      ${COMMON_FOOTER.replace('{{CLIENT_EMAIL}}', clientEmail)}

    </div>
  </body>
  </html>
  `
}

export function renderPasswordResetEmailHtml({
  clientEmail,
  resetLink
}: PasswordResetTemplateParams): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hedge Capital Security Alert</title>
  </head>
  <body style="background-color: #0f172a; margin: 0; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); overflow: hidden;">
      
      ${COMMON_HEADER}

      <!-- BODY CONTENT -->
      <div style="padding: 32px 24px; color: #f8fafc;">
        
        <div style="margin-bottom: 24px; text-align: center;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 16px; margin-bottom: 12px;">
            <span style="font-size: 24px;">🔒</span>
          </div>
          <h1 style="font-size: 22px; font-weight: 500; color: #ffffff; margin: 0 0 6px 0;">Password Reset Authorization</h1>
          <p style="font-size: 13px; color: #94a3b8; margin: 0;">Security action required for <strong>${clientEmail}</strong></p>
        </div>

        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6; margin-bottom: 24px; text-align: center;">
          We received an authorized request to update the password for your Hedge Capital account. Click the button below to complete password reconfiguration:
        </p>

        <!-- CTA BUTTON -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);">
            Set New Account Password →
          </a>
        </div>

        <div style="background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px; padding: 12px 16px; text-align: center; margin-top: 24px;">
          <p style="font-size: 11px; color: #f87171; margin: 0;">
            If you did not initiate this request, please contact compliance immediately at <a href="mailto:admin@cpthedge.com" style="color: #f87171; text-decoration: underline;">admin@cpthedge.com</a>.
          </p>
        </div>
      </div>

      ${COMMON_FOOTER.replace('{{CLIENT_EMAIL}}', clientEmail)}

    </div>
  </body>
  </html>
  `
}
