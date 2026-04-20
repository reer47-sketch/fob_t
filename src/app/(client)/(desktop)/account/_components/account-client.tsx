'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BulkFeatureGateModal } from '@/components/bulk-feature-gate-modal'

interface AccountClientProps {
  user: {
    id: string
    email: string
    name: string | null
    phone: string | null
    plan: string
    tenantName: string | null
  }
}

const planLabels: Record<string, { label: string; className: string }> = {
  FREE: { label: 'Free', className: 'bg-gray-100 text-gray-600 border-gray-300' },
  PRO: { label: 'Pro', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  PREMIUM: { label: 'Premium', className: 'bg-purple-100 text-purple-700 border-purple-300' },
}

export function AccountClient({ user }: AccountClientProps) {
  const [gateModalOpen, setGateModalOpen] = useState(false)
  const isFree = user.plan === 'FREE'
  const planInfo = planLabels[user.plan] || planLabels.FREE

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* 프로필 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">프로필</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="이메일" value={user.email} />
          <InfoRow label="이름" value={user.name || '-'} />
          <InfoRow label="연락처" value={user.phone || '-'} />
          {user.tenantName && <InfoRow label="샵" value={user.tenantName} />}
        </CardContent>
      </Card>

      {/* 플랜 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">플랜</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={planInfo.className}>
              {planInfo.label}
            </Badge>
            {isFree && (
              <p className="text-sm text-muted-foreground">
                일괄 관리 기능은 유료 플랜에서 사용할 수 있습니다.
              </p>
            )}
          </div>
          {isFree && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setGateModalOpen(true)}
            >
              일괄기능 문의하기
            </Button>
          )}
        </CardContent>
      </Card>

      <BulkFeatureGateModal open={gateModalOpen} onOpenChange={setGateModalOpen} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-16 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
