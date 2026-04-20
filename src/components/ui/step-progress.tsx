'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  title: string
  description?: string
}

interface StepProgressProps {
  steps: Step[]
  currentStep: number
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <div key={index} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                {/* Step circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors',
                    {
                      'bg-primary text-primary-foreground': isCurrent || isCompleted,
                      'bg-gray-200 text-gray-500': isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>

                {/* Step title */}
                <div className="mt-2 text-center">
                  <p
                    className={cn('text-xs font-medium', {
                      'text-primary': isCurrent || isCompleted,
                      'text-gray-500': isUpcoming,
                    })}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
