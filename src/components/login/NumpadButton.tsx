'use client'

import { type ReactNode } from 'react'

interface NumpadButtonProps {
  children: ReactNode
  letters?: string
  variant?: 'default' | 'action' | 'icon'
  onClick: () => void
  ariaLabel?: string
}

export default function NumpadButton({
  children,
  letters,
  variant = 'default',
  onClick,
  ariaLabel,
}: NumpadButtonProps) {
  const baseStyles =
    'aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 active:scale-95 cursor-pointer select-none'

  const variantStyles = {
    default:
      'bg-surface-container hover:bg-surface-container-highest hover:shadow-sm',
    action:
      'bg-primary text-on-primary hover:bg-primary-hover shadow-lg shadow-primary/20 hover:shadow-primary/30',
    icon: 'bg-surface-container hover:bg-surface-container-highest hover:shadow-sm',
  }

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles[variant]}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span
        className={`font-mono text-2xl font-bold ${
          variant === 'action' ? 'text-on-primary' : 'text-tertiary'
        }`}
      >
        {children}
      </span>
      {letters && (
        <span className="text-[8px] font-label uppercase tracking-wider text-tertiary/40 group-hover:text-tertiary/70 mt-0.5">
          {letters}
        </span>
      )}
    </button>
  )
}
