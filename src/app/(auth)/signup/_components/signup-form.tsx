'use client';

import { useActionState, useState } from 'react';
import { signUp } from '@/actions/auth/sign-up';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * 휴대폰 번호 포맷팅 (010-1234-5678)
 */
function formatPhoneNumber(value: string): string {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');

    // 길이에 따라 포맷팅
    if (numbers.length <= 3) {
        return numbers;
    } else if (numbers.length <= 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
}

/**
 * 회원가입 폼
 */
export function SignUpForm() {
    const router = useRouter();
    const [shopName, setShopName] = useState('');
    const [address, setAddress] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [allAgreed, setAllAgreed] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);
    const [privacyAgreed, setPrivacyAgreed] = useState(false);
    const [dataCollectionAgreed, setDataCollectionAgreed] = useState(false);
    const [marketingAgreed, setMarketingAgreed] = useState(false);

    const [state, formAction, isPending] = useActionState(async (_prevState: any, formData: FormData) => {
        const result = await signUp({
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            shopName: formData.get('shopName') as string,
            address: formData.get('address') as string,
            name: formData.get('name') as string,
            phone: formData.get('phone') as string,
            termsAgreed: formData.get('termsAgreed') === 'on',
            privacyAgreed: formData.get('privacyAgreed') === 'on',
            dataCollectionAgreed: formData.get('dataCollectionAgreed') === 'on',
            marketingAgreed: formData.get('marketingAgreed') === 'on',
        });

        if (result.success) {
            toast.success('회원가입이 완료되었습니다! 환영합니다.');
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        }

        return result;
    }, null);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhone(formatted);
    };

    // 전체 동의 처리
    const handleAllAgreedChange = (checked: boolean) => {
        setAllAgreed(checked);
        setTermsAgreed(checked);
        setPrivacyAgreed(checked);
        setDataCollectionAgreed(checked);
        setMarketingAgreed(checked);
    };

    // 개별 동의 변경 시 전체 동의 상태 업데이트
    const handleIndividualChange = (setter: (value: boolean) => void, value: boolean) => {
        setter(value);
        // 개별 항목 하나라도 false면 전체 동의도 false
        if (!value) {
            setAllAgreed(false);
        }
    };

    // 필수 약관 동의 확인
    const isRequiredAgreed = termsAgreed && dataCollectionAgreed;

    return (
        <Card>
            <CardHeader>
                <CardTitle>회원가입</CardTitle>
                <CardDescription>샵 정보와 담당자 정보를 입력하세요</CardDescription>
            </CardHeader>
            <form action={formAction}>
                <CardContent className="space-y-4">
                    {/* 샵 정보 */}
                    <div className="space-y-4 border-b pb-4">
                        <h3 className="text-sm font-medium text-gray-700">샵 정보</h3>

                        <div className="space-y-2">
                            <Label htmlFor="shopName">샵명 *</Label>
                            <Input
                                id="shopName"
                                name="shopName"
                                type="text"
                                placeholder="이름, 브리더명, 상호명"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">주소</Label>
                            <Input
                                id="address"
                                name="address"
                                type="text"
                                placeholder="서울특별시 강남구..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    {/* 담당자 정보 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700">담당자 정보</h3>

                        <div className="space-y-2">
                            <Label htmlFor="name">이름 *</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="홍길동"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">연락처 *</Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                placeholder="010-1234-5678"
                                value={phone}
                                onChange={handlePhoneChange}
                                maxLength={13}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">이메일 *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">비밀번호 *</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="영문+숫자 8자 이상"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isPending}
                            />
                            <p className="text-xs text-gray-500">영문과 숫자를 포함하여 8자 이상 입력하세요</p>
                        </div>
                    </div>

                    {/* 약관 동의 */}
                    <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-medium text-gray-700">약관 동의</h3>

                        <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
                            <Checkbox
                                id="allAgreed"
                                checked={allAgreed}
                                onCheckedChange={handleAllAgreedChange}
                                disabled={isPending}
                            />
                            <label
                                htmlFor="allAgreed"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                전체 동의
                            </label>
                        </div>

                        <div className="space-y-3 pl-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="termsAgreed"
                                    name="termsAgreed"
                                    checked={termsAgreed}
                                    onCheckedChange={(checked) =>
                                        handleIndividualChange(setTermsAgreed, checked as boolean)
                                    }
                                    disabled={isPending}
                                />
                                <label
                                    htmlFor="termsAgreed"
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    <Link
                                        href="/privacy/terms"
                                        target="_blank"
                                        className="text-gray-600 underline hover:text-gray-800"
                                    >
                                        이용약관
                                    </Link>
                                    ,{' '}
                                    <Link
                                        href="/privacy/policy"
                                        target="_blank"
                                        className="text-gray-600 underline hover:text-gray-800"
                                    >
                                        개인정보처리방침
                                    </Link>{' '}
                                    동의 (필수)
                                </label>
                            </div>

                            <input type="hidden" name="privacyAgreed" value={termsAgreed ? 'on' : 'off'} />

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="dataCollectionAgreed"
                                    name="dataCollectionAgreed"
                                    checked={dataCollectionAgreed}
                                    onCheckedChange={(checked) =>
                                        handleIndividualChange(setDataCollectionAgreed, checked as boolean)
                                    }
                                    disabled={isPending}
                                />
                                <label
                                    htmlFor="dataCollectionAgreed"
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    <Link
                                        href="/privacy/data-collection"
                                        target="_blank"
                                        className="text-gray-600 underline hover:text-gray-800"
                                    >
                                        개인정보수집 및 이용
                                    </Link>{' '}
                                    동의 (필수)
                                </label>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="marketingAgreed"
                                        name="marketingAgreed"
                                        checked={marketingAgreed}
                                        onCheckedChange={(checked) =>
                                            handleIndividualChange(setMarketingAgreed, checked as boolean)
                                        }
                                        disabled={isPending}
                                    />
                                    <label
                                        htmlFor="marketingAgreed"
                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        <Link
                                            href="/privacy/marketing"
                                            target="_blank"
                                            className="text-gray-600 underline hover:text-gray-800"
                                        >
                                            마케팅 정보 수신
                                        </Link>{' '}
                                        동의 (선택)
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {state && !state.success && (
                        <Alert variant="destructive">
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 pt-4">
                    <Button type="submit" className="w-full" disabled={isPending || !isRequiredAgreed}>
                        {isPending ? '가입 중...' : '가입하기'}
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                        이미 계정이 있으신가요?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            로그인
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
