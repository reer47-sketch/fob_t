'use client'

import { Suspense } from 'react'
import { EggView } from './_components/egg-view'

export default function IncubationPage() {
  return (
    <div className="flex flex-col">
      <Suspense>
        <EggView />
      </Suspense>
    </div>
  )
}
