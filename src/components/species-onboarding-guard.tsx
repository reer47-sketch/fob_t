"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SpeciesSettingsDialog } from "@/components/dialogs/species-settings-dialog"

interface SpeciesOnboardingGuardProps {
  hasSpecies: boolean
}

export function SpeciesOnboardingGuard({ hasSpecies }: SpeciesOnboardingGuardProps) {
  const router = useRouter()
  const [open, setOpen] = useState(!hasSpecies)

  if (hasSpecies) return null

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      // 저장 성공으로 닫힐 때 서버 컴포넌트 재실행
      router.refresh()
    }
    setOpen(value)
  }

  return (
    <SpeciesSettingsDialog
      open={open}
      onOpenChange={handleOpenChange}
      required
    />
  )
}
