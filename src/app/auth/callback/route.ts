import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  let next = searchParams.get('next')

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = host ? `${proto}://${host}` : 'https://www.captainhedge.com'

  const isPasswordFlow = type === 'recovery' || type === 'invite' || next === '/update-password'
  const redirectTarget = isPasswordFlow ? `${origin}/update-password` : `${origin}${next || '/client'}`

  const response = NextResponse.redirect(redirectTarget)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return response
    }
  }

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      if (!isPasswordFlow) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        const targetPath = profile?.role === 'admin' ? '/admin' : '/client'
        const customResponse = NextResponse.redirect(`${origin}${next || targetPath}`)
        // Transfer cookies to customResponse
        response.cookies.getAll().forEach(cookie => {
          customResponse.cookies.set(cookie.name, cookie.value)
        })
        return customResponse
      }
      return response
    }
  }

  // If implicit flow or recovery link without code parameter:
  if (isPasswordFlow) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authenticating...</title>
  <script>
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    window.location.replace('${origin}/update-password' + search + hash);
  </script>
</head>
<body style="background:#030712;color:#ffffff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
  <p>Authenticating your session...</p>
</body>
</html>`,
      {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    )
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid_or_expired_link`)
}
