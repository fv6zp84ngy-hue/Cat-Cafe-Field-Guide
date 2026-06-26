import { useRef } from 'react'
import type { CatCafe } from '../../data/types'

interface Props {
  stores: CatCafe[]
  backgroundSrc?: string
  isAdmin?: boolean
  placingStore?: CatCafe | null
  onPlace?: (id: string, coords: { x: number; y: number }) => void
  onCancelPlace?: () => void
  onStartPlace?: (store: CatCafe) => void
}

export default function IllustratedMap({
  stores,
  backgroundSrc,
  isAdmin = false,
  placingStore = null,
  onPlace,
  onCancelPlace,
  onStartPlace,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null)

  const placed = stores.filter(s => s.mapCoords)
  const unplaced = stores.filter(s => !s.mapCoords)

  function handleMapClick(e: React.MouseEvent) {
    if (!placingStore || !mapRef.current || !onPlace) return
    const rect = mapRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    onPlace(placingStore.id, { x, y })
  }

  return (
    <div className="h-full flex flex-col">
      {isAdmin && placingStore && (
        <div className="flex items-center justify-between gap-4 mb-3 px-3 py-2 bg-terracotta/10 border border-terracotta/30 rounded-sm">
          <span className="font-mono text-[11px] tracking-wider uppercase text-terracotta">
            Placing № {placingStore.mapNumber} · {placingStore.name || '(unnamed)'} — click map to set pin
          </span>
          <button
            onClick={onCancelPlace}
            className="font-mono text-[10px] tracking-widest uppercase text-terracotta/70 hover:text-terracotta"
          >
            Cancel
          </button>
        </div>
      )}

      <div
        ref={mapRef}
        onClick={handleMapClick}
        className={`relative w-full h-full bg-paper/40 border border-dashed border-sepia/40 overflow-hidden ${placingStore ? 'cursor-crosshair' : ''}`}
      >
        {backgroundSrc ? (
          <img src={backgroundSrc} alt="Cat cafe map" className="absolute inset-0 w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <span className="font-mono text-[10px] tracking-widest uppercase text-sepia/60 mb-2">
              Illustrated Map Placeholder
            </span>
            <span className="font-serif text-sm text-ink/50 max-w-sm">
              Drop your hand-drawn cat cafe map here — the numbered pins below will overlay on top.
            </span>
          </div>
        )}

        {placed.map(store => (
          <Pin key={store.id} store={store} isAdmin={isAdmin} onClick={onStartPlace} />
        ))}
      </div>

      {isAdmin && unplaced.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[10px] tracking-widest uppercase text-sepia mb-2">
            Unplaced · {unplaced.length}
          </p>
          <div className="flex flex-wrap gap-2">
            {unplaced.map(s => (
              <button
                key={s.id}
                onClick={() => onStartPlace?.(s)}
                className="font-mono text-[10px] tracking-wider uppercase border border-sepia/40 text-ink px-2.5 py-1 hover:bg-paper/60 hover:border-sepia transition-colors"
              >
                № {s.mapNumber} · {s.name || '(unnamed)'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Pin({ store, isAdmin, onClick }: { store: CatCafe; isAdmin: boolean; onClick?: (store: CatCafe) => void }) {
  const { x = 0, y = 0 } = store.mapCoords!
  return (
    <button
      type="button"
      onClick={e => {
        if (!isAdmin) return
        e.stopPropagation()
        onClick?.(store)
      }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${isAdmin ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      title={`${store.mapNumber} · ${store.name}`}
    >
      <div className="relative w-8 h-8">
        <div className="relative w-8 h-8 rounded-full bg-terracotta border-2 border-ink shadow-card flex items-center justify-center transition-transform">
          <span className="font-mono text-[11px] font-bold text-paper leading-none">{store.mapNumber}</span>
        </div>
      </div>
    </button>
  )
}
