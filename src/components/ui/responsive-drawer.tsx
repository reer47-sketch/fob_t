'use client'

import * as React from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { Drawer as DrawerPrimitive } from 'vaul'

import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

type Direction = 'bottom' | 'right'

const ResponsiveDrawerContext = React.createContext<Direction>('right')

function useResponsiveDrawerDirection() {
  return React.useContext(ResponsiveDrawerContext)
}

/**
 * 모바일은 바텀 시트, 데스크톱은 우측 사이드 드로어로 자동 전환되는 wrapper.
 *
 * 사용 패턴:
 * <ResponsiveDrawer open onOpenChange>
 *   <ResponsiveDrawerContent>
 *     <ResponsiveDrawerHeader title="제목" onBack={...} onClose={...} />
 *     <div className="flex-1 overflow-y-auto px-5">...</div>
 *   </ResponsiveDrawerContent>
 * </ResponsiveDrawer>
 */
function ResponsiveDrawer(
  props: React.ComponentProps<typeof DrawerPrimitive.Root>,
) {
  const isMobile = useIsMobile()
  const direction: Direction = isMobile ? 'bottom' : 'right'
  return (
    <ResponsiveDrawerContext.Provider value={direction}>
      <Drawer direction={direction} {...props} />
    </ResponsiveDrawerContext.Provider>
  )
}

type ResponsiveDrawerContentProps = React.ComponentProps<typeof DrawerContent> & {
  /**
   * 모바일에서의 높이.
   * - 'default': max-h-[85vh] (콘텐츠 양에 따라 가변)
   * - 'tall':    h-[90vh] (산란 기록처럼 스크롤이 긴 화면)
   */
  size?: 'default' | 'tall'
}

function ResponsiveDrawerContent({
  size = 'default',
  className,
  children,
  ...props
}: ResponsiveDrawerContentProps) {
  const direction = useResponsiveDrawerDirection()
  const isBottom = direction === 'bottom'
  return (
    <DrawerContent
      className={cn(
        'flex flex-col gap-0',
        isBottom
          ? cn('rounded-t-3xl', size === 'tall' ? 'h-[90dvh]' : 'max-h-[85dvh]')
          : 'h-full',
        className,
      )}
      {...props}
    >
      {children}
    </DrawerContent>
  )
}

type ResponsiveDrawerHeaderProps = {
  title: React.ReactNode
  /** 있으면 화살표 뒤로가기 노출 (단계가 있는 모드용) */
  onBack?: () => void
  /** 데스크톱(side)에서만 ✕로 노출. 모바일은 스와이프/오버레이로 닫음 */
  onClose?: () => void
  /** 헤더 우측 액션 (모바일·데스크톱 공통) */
  rightAction?: React.ReactNode
  /**
   * 모바일에서 시각적 헤더를 감추되, a11y용 DrawerTitle은 sr-only로 유지.
   * onBack/rightAction이 없는 단순 표시 모드에서 공간 절약 용도.
   */
  hideOnMobile?: boolean
  className?: string
}

function ResponsiveDrawerHeader({
  title,
  onBack,
  onClose,
  rightAction,
  hideOnMobile,
  className,
}: ResponsiveDrawerHeaderProps) {
  const direction = useResponsiveDrawerDirection()
  const isBottom = direction === 'bottom'

  if (isBottom && hideOnMobile) {
    return (
      <DrawerTitle className="sr-only">{title}</DrawerTitle>
    )
  }

  if (isBottom) {
    // 모바일 바텀 시트: ← 뒤로 (좌) · 제목 (중앙) · 액션 (우)
    return (
      <div
        data-slot="responsive-drawer-header"
        className={cn(
          'shrink-0 grid grid-cols-[44px_1fr_44px] items-center h-12 px-2 pt-2',
          className,
        )}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="뒤로"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <div />
        )}
        <DrawerTitle className="text-center text-base font-semibold truncate px-1">
          {title}
        </DrawerTitle>
        <div className="flex items-center justify-end">{rightAction}</div>
      </div>
    )
  }

  // 데스크톱 사이드 드로어: 제목 (좌, ← inline) · 액션 + ✕ (우)
  return (
    <div
      data-slot="responsive-drawer-header"
      className={cn(
        'shrink-0 flex items-center justify-between gap-2 h-14 pl-3 pr-2 border-b border-neutral-100',
        className,
      )}
    >
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="뒤로"
            className="shrink-0 w-9 h-9 -ml-2 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <DrawerTitle className="text-base font-semibold truncate">
          {title}
        </DrawerTitle>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {rightAction}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

export {
  ResponsiveDrawer,
  ResponsiveDrawerContent,
  ResponsiveDrawerHeader,
  useResponsiveDrawerDirection,
}
