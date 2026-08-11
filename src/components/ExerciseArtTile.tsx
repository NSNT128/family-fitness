import { useEffect, useState } from 'react'
import { X, ZoomIn } from 'lucide-react'
import ExerciseArt from '../lib/exerciseArt'
import { exerciseInfoFor } from '../lib/exerciseInfo'

interface ExerciseArtTileProps {
  name: string
  muscleGroup?: string | null
  /** Tailwind size classes for the tile itself, e.g. "h-11 w-11". */
  size?: string
  /** Tailwind size classes for the diagram inside the tile. */
  artSize?: string
  /** Tint for the diagram's body strokes. */
  tone?: string
  /** Tile background. A prop, not a className override — two competing bg-*
   *  utilities resolve by stylesheet order, not attribute order. */
  tileBg?: string
  className?: string
}

/**
 * The diagram as a tappable tile — tapping opens it large with the how-to, since
 * at list size the drawing is a recogniser, not something you can study.
 */
export default function ExerciseArtTile({
  name,
  muscleGroup,
  size = 'h-11 w-11',
  artSize = 'h-8 w-8',
  tone = 'text-gray-500',
  tileBg = 'bg-gray-100',
  className = '',
}: ExerciseArtTileProps) {
  const [zoomed, setZoomed] = useState(false)
  const info = exerciseInfoFor(name)

  useEffect(() => {
    if (!zoomed) return
    // Capture phase + stopPropagation: the zoom sits on top of the log sheet,
    // which has its own document-level Escape handler. Without consuming the key
    // here, one Escape closed both — the sheet vanished behind the zoom.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setZoomed(false)
    }
    document.addEventListener('keydown', onKey, true)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = previous
    }
  }, [zoomed])

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label={`Show ${name} diagram`}
        className={`group relative flex ${size} shrink-0 items-center justify-center rounded-xl ${tileBg} active:scale-95 ${className}`}
      >
        <ExerciseArt name={name} muscleGroup={muscleGroup} className={`${artSize} ${tone}`} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-gray-500">
          <ZoomIn className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      </button>

      {zoomed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/60" onClick={() => setZoomed(false)} />
          <div className="relative flex max-h-[85svh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-3 px-5 pt-5">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900">{name}</h2>
                {info && (
                  <p className="mt-0.5 text-sm font-medium text-brand-600">{info.muscles}</p>
                )}
              </div>
              <button
                onClick={() => setZoomed(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-5 pb-5">
              <div className="mt-4 flex items-center justify-center rounded-2xl bg-gray-100 py-6">
                <ExerciseArt
                  name={name}
                  muscleGroup={muscleGroup}
                  className="h-44 w-44 text-gray-600"
                />
              </div>
              {info ? (
                <p className="mt-4 text-sm leading-relaxed text-gray-600">{info.howTo}</p>
              ) : (
                <p className="mt-4 text-sm text-gray-400">
                  Your own exercise — log it the way you do it.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
