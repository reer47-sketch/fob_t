'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export function SocialLogin() {
    const [isPending, setIsPending] = useState(false);
    const supabase = createClient();

    const handleSocialLogin = async (provider: 'google' | 'kakao') => {
        setIsPending(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Social login error:', error);
            setIsPending(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 mt-6 w-full">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">또는 소셜 계정으로 계속하기</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-2">
                {/* Google Login Button */}
                <Button
                    variant="outline"
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSocialLogin('google')}
                    className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span className="text-sm font-medium">Google로 계속하기</span>
                </Button>

                {/* Kakao Login Button */}
                <Button
                    variant="outline"
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSocialLogin('kakao')}
                    className="w-full flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FEE500]/90 text-black border-[#FEE500]"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 4C7.58172 4 4 6.71033 4 10.0533C4 12.2104 5.48543 14.0954 7.69741 15.1764L6.75845 18.6186C6.70275 18.8229 6.94054 18.9958 7.11976 18.877L11.2183 16.1627C11.4746 16.1743 11.7346 16.1802 12 16.1802C16.4183 16.1802 20 13.4699 20 10.1269C20 6.78385 16.4183 4.07352 12 4.07352V4Z"
                            fill="#000000"
                        />
                    </svg>
                    <span className="text-sm font-medium">카카오 로그인</span>
                </Button>
            </div>
        </div>
    );
}
