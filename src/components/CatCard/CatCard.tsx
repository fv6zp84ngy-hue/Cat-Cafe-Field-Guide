import type { CatProfile } from '../../data/types'

interface Props {
  cat: CatProfile
  compact?: boolean
}

function AxisDot({ label, value }: { label: string; value: number }) {
  const pct = ((value - 1) / 4) * 100
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] tracking-widest uppercase text-ink/60 w-16 shrink-0">{label}</span>
      <div className="relative h-2 flex-1">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-ink/15" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-terracotta" style={{ left: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function CatCard({ cat, compact = false }: Props) {
  const photo = cat.photos[0]

  return (
    <div className={`border border-dashed border-ink/15 bg-paper/50 ${compact ? 'p-2' : 'p-4'}`}>
      <div className="flex gap-3">
        <div className={`${compact ? 'w-14 h-14' : 'w-20 h-20'} shrink-0 flex items-center justify-center border border-ink/10 bg-paper`}>
          {photo ? (
            <img src={photo} alt={cat.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-3xl text-sepia/50">cat</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] tracking-widest uppercase text-sepia mb-0.5">Resident Cat</p>
          <h4 className="font-display text-xl font-bold text-ink leading-none truncate">{cat.name}</h4>
          <div className="mt-1 flex flex-wrap gap-1">
            {cat.tags.slice(0, compact ? 2 : 4).map(tag => (
              <span key={tag} className="font-mono text-[10px] tracking-widest uppercase text-sepia border border-ink/10 px-1 py-0.5">
                {tag}
              </span>
            ))}
          </div>
          <p className={`font-serif italic text-[14px] text-ink/65 leading-relaxed mt-1 ${compact ? 'line-clamp-2' : ''}`}>
            {cat.review}
          </p>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 space-y-1">
          <AxisDot label="Friendly" value={cat.ratings.friendly} />
          <AxisDot label="Active" value={cat.ratings.active} />
          <AxisDot label="Photo" value={cat.ratings.photogenic} />
        </div>
      )}
    </div>
  )
}
