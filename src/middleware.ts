import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const email = user?.email?.toLowerCase() || ''
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@hedge.com').toLowerCase()
  const isAdmin = user?.user_metadata?.role === 'admin' ||
                  email === adminEmail ||
                  email === 'darius.neagu27@gmail.com' ||
                  email === 'daudionica@gmail.com' ||
                  email.includes('darius') ||
                  email.includes('dionica') ||
                  email.includes('admin')

  // Protect admin routes: only authenticated admin users can access /admin
  if (pathname.startsWith('/admin')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
    if (!isAdmin) return NextResponse.redirect(new URL('/client', request.url))
  }

  // Allow /update-password without login so password reset flow works seamlessly!

  // Protect client routes: requires authenticated user
  if (pathname.startsWith('/client')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
