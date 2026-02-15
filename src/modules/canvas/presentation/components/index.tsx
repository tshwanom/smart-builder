'use client'

import dynamic from 'next/dynamic'

export const CanvasStage = dynamic(
  () => import('./CanvasStage').then((mod) => mod.CanvasStage),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Canvas...</div>
  }
)


