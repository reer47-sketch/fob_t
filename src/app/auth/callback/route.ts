import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const { searchParams } = requestUrl;
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dashboard';
    
    // Origin 강제 지정 로직 (헤더 우선 사용)
    let origin = requestUrl.origin;
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') ?? (origin.startsWith('https') ? 'https' : 'http');
    
    if (host) {
        origin = `${protocol}://${host}`;
    }

    console.log('[Callback] code exists:', !!code);
    console.log('[Callback] origin:', origin);

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // ignore
                        }
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        console.log('[Callback] exchangeCodeForSession error:', error);
        console.log('[Callback] user id:', data?.user?.id);

        if (!error && data?.user) {
            // 1. DB에 유저 정보(ID 기준)가 있는지 확인
            const userById = await prisma.user.findUnique({
                where: { id: data.user.id },
            });

            // 2. 이미 등록된 유저라면 바로 로그인 (대시보드 이동)
            if (userById) {
                return NextResponse.redirect(`${origin}${next}`);
            }

            // 3. ID는 없는데 이메일이 이미 존재하는지 확인 (일반 회원가입으로 이미 가입된 경우)
            if (data.user.email) {
                const userByEmail = await prisma.user.findUnique({
                    where: { email: data.user.email },
                });

                if (userByEmail) {
                    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
                    await supabase.auth.signOut();

                    const message = encodeURIComponent(
                        '이미 이메일로 가입된 계정입니다. 이메일 로그인을 이용해주세요.'
                    );
                    return NextResponse.redirect(`${origin}/login?error=email_exists&message=${message}`);
                }
            }

            // 4. 진짜 신규 유저 -> 온보딩 페이지로 이동
            console.log('[Callback] Redirecting to social-onboarding');
            return NextResponse.redirect(`${origin}/social-onboarding`);
        }
    }

    // 에러 발생 시 로그인 페이지로 이동
    console.log('[Callback] Redirecting to login with error');
    return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
