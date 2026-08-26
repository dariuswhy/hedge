import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  let next = searchParams.get('next')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // Ignore server component cookie write warning
            }
          },
        },
      }
    )
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // If it's a recovery, password reset, or invite link -> ALWAYS force /update-password
      if (type === 'recovery' || type === 'invite' || next === '/update-password') {
        return NextResponse.redirect(`${origin}/update-password`)
      }

      // Check role for smart redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const targetPath = profile?.role === 'admin' ? '/admin' : '/client'
      return NextResponse.redirect(`${origin}${next || targetPath}`)
    }
  }

  // If type is recovery or next is update-password, send directly to /update-password
  if (type === 'recovery' || next === '/update-password') {
    return NextResponse.redirect(`${origin}/update-password`)
  }

  return NextResponse.redirect(`${origin}/login?error=Invalid_or_expired_link`)
}
