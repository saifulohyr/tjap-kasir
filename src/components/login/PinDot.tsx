'use client'

interface PinDotProps {
  filled: boolean
  active: boolean
}

export default function PinDot({ filled, active }: PinDotProps) {
  return (
    <div className="flex items-center justify-center w-14 h-[72px] border-b-2 border-outline-variant">
      {filled ? (
        <div
          className="w-4 h-4 rounded-full bg-tertiary animate-dot-in"
          aria-hidden="true"
        />
      ) : (
        <div
          className={`w-4 h-4 rounded-full border-2 border-tertiary transition-opacity duration-300 ${
            active ? 'opacity-60 animate-pulse-soft' : 'opacity-30'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
