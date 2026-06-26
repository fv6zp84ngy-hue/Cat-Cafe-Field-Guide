import { loadCafes } from '../../data/storage'
import CardA from '../CardVariants/CardA'
import CardB from '../CardVariants/CardB'
import CardC from '../CardVariants/CardC'
import CardD from '../CardVariants/CardD'

const VARIANTS = [
  {
    id: 'A',
    name: 'Guide Entry',
    subtitle: 'Rating callout top-left · sticker top-right · clean grid, no card chrome',
    cols: 3,
    Card: CardA,
  },
  {
    id: 'B',
    name: 'Taste Poster',
    subtitle: 'Full-width rating bars as the billboard · sticker hero · tiny text strip',
    cols: 3,
    Card: CardB,
  },
  {
    id: 'C',
    name: 'Flavor Radar',
    subtitle: 'SVG triangle chart plots the 3-axis taste profile · infographic feel',
    cols: 3,
    Card: CardC,
  },
  {
    id: 'D',
    name: 'Big Numbers',
    subtitle: 'Rating values as giant Playfair numerals · typography is the chart',
    cols: 2,
    Card: CardD,
  },
] as const

export default function Demo() {
  const cafes = loadCafes()

  return (
    <div className="bg-paper bg-texture min-h-screen">
      {/* lab header */}
      <div className="border-b border-ink/15 px-8 py-6 flex items-center gap-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-sepia">
            Cat Cafe Field Guide
          </p>
          <h1 className="font-display text-4xl font-bold text-ink leading-none">Layout Lab</h1>
        </div>
        <div className="flex-1 h-px bg-paper" />
        <p className="font-mono text-[9px] tracking-widest uppercase text-ink/30">
          cafe · cats · notes · map
        </p>
      </div>

      {VARIANTS.map(({ id, name, subtitle, cols, Card }) => {
        const gridCols = cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
        return (
          <section key={id} className="px-8 py-12">
            {/* section label */}
            <div className="flex items-baseline gap-4 mb-6">
              <span className="font-mono text-5xl font-bold text-ink/10 leading-none select-none">{id}</span>
              <div>
                <h2 className="font-display text-4xl font-bold text-ink leading-none">{name}</h2>
                <p className="font-mono text-[10px] tracking-wide text-sepia/70 mt-0.5">{subtitle}</p>
              </div>
            </div>

            {/* diamond-dashed top rule — like apple pie map */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 border-t border-dashed border-sepia/40" />
              <span className="text-sepia/40 text-xs">◆</span>
              <div className="flex-1 border-t border-dashed border-sepia/40" />
            </div>

            {/* grid with dashed cell dividers */}
            <div className={`grid grid-cols-1 ${gridCols} border-l border-t border-dashed border-ink/15`}>
              {cafes.map(cafe => (
                <div key={cafe.id} className="border-r border-b border-dashed border-ink/15">
                  <Card cafe={cafe} />
                </div>
              ))}
              {/* fill empty grid cells for visual balance */}
              {cols === 3 && cafes.length < 3 && (
                <div className="border-r border-b border-dashed border-ink/15" />
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 border-t border-dashed border-sepia/40" />
              <span className="text-sepia/40 text-xs">◆</span>
              <div className="flex-1 border-t border-dashed border-sepia/40" />
            </div>
          </section>
        )
      })}
    </div>
  )
}
