'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepProgressBarProps {
  steps: { title: string }[]
  currentStep: number // 1-based
}

export function StepProgressBar({ steps, currentStep }: StepProgressBarProps) {
  return (
    <div className="flex items-center w-full px-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isCurrent = stepNumber === currentStep

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* 스텝 원형 + 라벨 */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                  isCompleted && 'bg-primary text-primary-foreground',
                  isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-1',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNumber}
              </div>
              <span
                className={cn(
                  'text-[10px] leading-tight text-center whitespace-nowrap',
                  isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>

            {/* 연결선 */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 mt-[-16px]',
                  stepNumber < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
