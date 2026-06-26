import type { CatCafe } from '../../data/types'
import CatCard from '../CatCard/CatCard'

interface Props {
  cafe?: CatCafe
  store?: CatCafe
}

function StickerPlaceholder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-14 h-14 text-sepia/30">
      <path d="M4 18V8l4-4 4 4 4-4 4 4v10a4 4 0 01-4 4H8a4 4 0 01-4-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h.01M15 12h.01M10 16c1.2.8 2.8.8 4 0" strokeLinecap="round" />
    </svg>
  )
}

function AxisRow({ label, value }: { label: string; value: number }) {
  const pct = ((value - 1) / 4) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[12px] tracking-widest uppercase text-ink/70 w-20 shrink-0">{label}</span>
      <div className="relative h-3 flex-1">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-ink/20" />
        {[0, 25, 50, 75, 100].map(p => (
          <div key={p} className="absolute top-1/2 -translate-y-1/2 w-px h-2 bg-ink/20" style={{ left: `${p}%` }} />
        ))}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-terracotta" style={{ left: `${pct}%` }} />
      </div>
    </div>
  )
}

function NoteBlock({ label, children }: { label: string; children?: string }) {
  if (!children) return null
  return (
    <div className="border-t border-dashed border-ink/15 pt-2">
      <p className="font-mono text-[11px] tracking-widest uppercase text-sepia mb-0.5">{label}</p>
      <p className="font-serif italic text-[14px] text-ink/70 leading-relaxed line-clamp-3">{children}</p>
    </div>
  )
}

export default function CardA({ cafe, store }: Props) {
  const entry = cafe ?? store
  if (!entry) return null
  const photo = entry.photos[0]
  const geoStatus = entry.geoReview?.status ?? entry.poi?.status ?? 'manual'
  const needsReview = Boolean(entry.poi?.needs_review || entry.geoReview?.status === 'needs_review')

  return (
    <div className="px-5 py-5">
      <div className="flex items-start gap-4 mb-4">
        <div className="border border-ink/40 px-3 py-2.5 flex-1 min-w-0">
          <div className="space-y-1.5">
            <AxisRow label="Comfort" value={entry.ratings.comfort} />
            <AxisRow label="Cats" value={entry.ratings.catFriendliness} />
            <AxisRow label="Photo" value={entry.ratings.photoFriendly} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-14 shrink-0" />
            <div className="flex justify-between flex-1">
              <span className="font-mono text-[11px] text-ink/40 tracking-wider">Low</span>
              <span className="font-mono text-[11px] text-ink/40 tracking-wider">Strong</span>
            </div>
          </div>
        </div>

        <div className="w-28 h-28 shrink-0 flex items-center justify-center">
          {photo ? (
            <img src={photo} alt={entry.name} className="max-w-full max-h-full object-contain" />
          ) : (
            <StickerPlaceholder />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-0.5">
        <div className="relative shrink-0 w-6 h-6">
          <div className="relative w-6 h-6 rounded-full bg-terracotta flex items-center justify-center">
            <span className="font-mono text-[12px] font-bold text-paper">{entry.mapNumber}</span>
          </div>
        </div>
        <h3 className="font-display text-2xl font-bold text-ink leading-tight truncate">{entry.name}</h3>
      </div>

      <p className="font-mono text-[12px] tracking-widest uppercase text-sepia mb-3">{entry.neighborhood} · {entry.address}</p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`font-mono text-[11px] tracking-widest uppercase border px-1.5 py-0.5 ${needsReview ? 'border-terracotta/50 text-terracotta' : 'border-ink/15 text-sepia'}`}>
          Geo · {needsReview ? 'Needs Review' : geoStatus}
        </span>
        <span className="font-mono text-[11px] tracking-widest uppercase border border-ink/15 px-1.5 py-0.5 text-sepia">
          Pin · {entry.pinSource ?? 'manual'}
        </span>
      </div>

      <div className="space-y-2.5">
        <NoteBlock label="Cafe Notes">{entry.review}</NoteBlock>
        <NoteBlock label="Environment">{entry.environmentNote}</NoteBlock>
        <div className="grid grid-cols-2 gap-2 border-t border-dashed border-ink/15 pt-2">
          <div>
            <p className="font-mono text-[11px] tracking-widest uppercase text-sepia mb-0.5">Reservation</p>
            <p className="font-serif italic text-[13px] text-ink/65 leading-relaxed line-clamp-2">{entry.reservationNote || 'Not noted yet.'}</p>
          </div>
          <div>
            <p className="font-mono text-[11px] tracking-widest uppercase text-sepia mb-0.5">Price</p>
            <p className="font-serif italic text-[13px] text-ink/65 leading-relaxed line-clamp-2">{entry.priceNote || 'Not noted yet.'}</p>
          </div>
        </div>
        <NoteBlock label="Photo / Check-in">{entry.photoNote}</NoteBlock>
        <NoteBlock label="Visit Tip">{entry.visitTips}</NoteBlock>
      </div>

      <p className="font-mono text-[12px] tracking-widest uppercase text-sepia mt-3 mb-2 border-t border-dashed border-ink/15 pt-2">
        Resident Cats · {entry.cats.length}
      </p>
      <div className="grid grid-cols-1 gap-2">
        {entry.cats.slice(0, 2).map(cat => (
          <CatCard key={cat.id} cat={cat} compact />
        ))}
      </div>
    </div>
  )
}
