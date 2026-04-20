import { prisma } from '@/lib/prisma';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { Prisma } from '@prisma/client';
import { createNewShopCode } from '@/services/user-service';

export type ServiceResponse<T> = { success: true; data: T } | { success: false; error: string };

/**
 * 회원가입 Service
 * 1. Supabase Auth 계정 생성
 * 2. Tenant 생성
 * 3. User 레코드 생성 (status: PENDING)
 */
export async function signUpService(data: {
    email: string;
    password: string;
    shopName: string;
    address?: string;
    name: string;
    phone: string;
    termsAgreed: boolean;
    privacyAgreed: boolean;
    dataCollectionAgreed: boolean;
    marketingAgreed?: boolean;
}): Promise<ServiceResponse<{ userId: string; tenantId: string }>> {
    let createdAuthUserId: string | null = null;

    try {
        const supabase = await createServerClient();

        // 1. Supabase Auth 계정 생성
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });

        if (authError) {
            console.error('Supabase signUp error:', authError);
            return { success: false, error: '이미 가입한 이메일입니다.' };
        }

        if (!authData.user) {
            return { success: false, error: '가입에 실패했습니다.' };
        }

        createdAuthUserId = authData.user.id;

        // 2. Tenant 생성 (shopCode 자동 생성)
        const shopCode = await createNewShopCode();

        const tenant = await prisma.tenant.create({
            data: {
                name: data.shopName,
                slug: shopCode,
                shopCode,
                address: data.address,
                status: 'ACTIVE',
            },
        });

        // 3. User 레코드 생성 (status: ACTIVE - 즉시 승인)
        await prisma.user.create({
            data: {
                id: authData.user.id,
                email: data.email,
                role: 'BREEDER',
                status: 'ACTIVE',
                tenantId: tenant.id,
                name: data.name,
                phone: data.phone,
                termsAgreed: data.termsAgreed,
                privacyAgreed: data.privacyAgreed,
                dataCollectionAgreed: data.dataCollectionAgreed,
                marketingAgreed: data.marketingAgreed ?? false,
                agreedAt: new Date(),
            },
        });

        // TODO: 관리자에게 이메일 알림 발송

        return {
            success: true,
            data: {
                userId: authData.user.id,
                tenantId: tenant.id,
            },
        };
    } catch (error) {
        console.error('signUpService error:', error);

        // [방어 로직] DB 저장 실패 시, 생성된 Auth 계정도 함께 삭제 (롤백)
        if (createdAuthUserId) {
            try {
                // 유저 삭제를 위해 관리자 권한 클라이언트 생성
                const supabaseAdmin = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );
                await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
                console.log('Rollback: Cleaned up orphaned auth user', createdAuthUserId);
            } catch (rollbackError) {
                console.error('Rollback failed:', rollbackError);
            }
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return { success: false, error: '이미 존재하는 이메일 또는 샵명입니다' };
            }
        }

        return { success: false, error: '회원가입에 실패했습니다' };
    }
}

/**
 * 소셜 로그인 추가 정보 입력 Service
 */
export async function socialSignUpService(data: {
    userId: string;
    email: string;
    shopName: string;
    address?: string;
    name: string;
    phone: string;
    termsAgreed: boolean;
    privacyAgreed: boolean;
    dataCollectionAgreed: boolean;
    marketingAgreed?: boolean;
    profileImage?: string;
}): Promise<ServiceResponse<{ tenantId: string }>> {
    try {
        // 1. 이미 존재하는지 확인 (이메일 중복 체크 포함)
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ id: data.userId }, { email: data.email }],
            },
        });

        if (existingUser) {
            return { success: false, error: '이미 이메일이 사용 중입니다.' };
        }

        // 2. Tenant 생성 (shopCode 자동 생성)
        const shopCode = await createNewShopCode();

        const tenant = await prisma.tenant.create({
            data: {
                name: data.shopName,
                slug: shopCode,
                shopCode,
                address: data.address,
                status: 'ACTIVE',
            },
        });

        // 3. User 레코드 생성 (status: ACTIVE)
        await prisma.user.create({
            data: {
                id: data.userId,
                email: data.email,
                role: 'BREEDER',
                status: 'ACTIVE',
                tenantId: tenant.id,
                name: data.name,
                phone: data.phone,
                termsAgreed: data.termsAgreed,
                privacyAgreed: data.privacyAgreed,
                dataCollectionAgreed: data.dataCollectionAgreed,
                marketingAgreed: data.marketingAgreed ?? false,
                agreedAt: new Date(),
                profileImage: data.profileImage,
            },
        });

        return {
            success: true,
            data: {
                tenantId: tenant.id,
            },
        };
    } catch (error) {
        console.error('socialSignUpService error:', error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return { success: false, error: '이미 존재하는 이메일 또는 샵명입니다' };
            }
        }

        return { success: false, error: '추가 정보 등록에 실패했습니다' };
    }
}

/**
 * 로그인 Service
 * 1. Supabase Auth 로그인
 * 2. User 상태 확인 (ACTIVE만 로그인 가능)
 */
export async function signInService(data: {
    email: string;
    password: string;
}): Promise<ServiceResponse<{ user: any; status: string }>> {
    try {
        const supabase = await createServerClient();

        // 1. Supabase Auth 로그인
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (authError) {
            console.error('Supabase signIn error:', authError);
            return { success: false, error: '이메일 또는 비밀번호가 잘못되었습니다' };
        }

        if (!authData.user) {
            return { success: false, error: '로그인에 실패했습니다' };
        }

        // 2. User 상태 확인
        const user = await prisma.user.findUnique({
            where: { id: authData.user.id },
            include: { tenant: true },
        });

        if (!user) {
            // User 레코드가 없으면 로그아웃
            await supabase.auth.signOut();
            return { success: false, error: '사용자 정보를 찾을 수 없습니다' };
        }

        // 상태별 처리
        if (user.status === 'PENDING') {
            await supabase.auth.signOut();
            return {
                success: false,
                error: 'pending',
            };
        }

        if (user.status === 'REJECTED') {
            await supabase.auth.signOut();
            return {
                success: false,
                error: 'rejected',
            };
        }

        if (user.status === 'SUSPENDED') {
            await supabase.auth.signOut();
            return {
                success: false,
                error: '계정이 정지되었습니다. 관리자에게 문의하세요',
            };
        }

        if (user.status === 'DELETED') {
            await supabase.auth.signOut();
            return {
                success: false,
                error: '삭제된 계정입니다',
            };
        }

        // ACTIVE 상태만 로그인 성공
        return {
            success: true,
            data: {
                user,
                status: user.status,
            },
        };
    } catch (error) {
        console.error('signInService error:', error);
        return { success: false, error: '로그인에 실패했습니다' };
    }
}

/**
 * 로그아웃 Service
 */
export async function signOutService(): Promise<ServiceResponse<null>> {
    try {
        const supabase = await createServerClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Supabase signOut error:', error);
            return { success: false, error: '로그아웃에 실패했습니다' };
        }

        return { success: true, data: null };
    } catch (error) {
        console.error('signOutService error:', error);
        return { success: false, error: '로그아웃에 실패했습니다' };
    }
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUserService() {
    try {
        const supabase = await createServerClient();

        const {
            data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            include: {
                tenant: {
                    include: {
                        _count: {
                            select: { tenantCodes: true },
                        },
                    },
                },
            },
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        return { success: true, data: user };
    } catch (error) {
        console.error('getCurrentUserService error:', error);
        return { success: false, error: 'Failed to get current user' };
    }
}

/**
 * 사용자 정보 업데이트 Service
 */
export async function updateProfileService(data: {
    userId: string;
    name: string;
    phone: string;
    shopName: string;
    address?: string;
    profileImage?: string;
    marketingAgreed?: boolean;
}): Promise<ServiceResponse<null>> {
    try {
        // 1. 먼저 사용자 정보를 가져와서 tenant 정보 확인
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
            include: { tenant: true },
        });

        if (!user) {
            return { success: false, error: '사용자를 찾을 수 없습니다' };
        }

        if (!user.tenantId) {
            return { success: false, error: '샵 정보를 찾을 수 없습니다' };
        }

        // 2. 트랜잭션으로 User와 Tenant 동시 업데이트
        await prisma.$transaction([
            prisma.user.update({
                where: { id: data.userId },
                data: {
                    name: data.name,
                    phone: data.phone,
                    profileImage: data.profileImage,
                    marketingAgreed: data.marketingAgreed,
                },
            }),
            prisma.tenant.update({
                where: { id: user.tenantId },
                data: {
                    name: data.shopName,
                    address: data.address,
                },
            }),
        ]);

        return { success: true, data: null };
    } catch (error) {
        console.error('updateProfileService error:', error);
        return { success: false, error: '정보 변경에 실패했습니다' };
    }
}

