import { useRef, useState } from 'react'
import { loadCafes, saveCafes } from './data/storage'
import type { CatCafe } from './data/types'
import CoverPage from './components/CoverPage/CoverPage'
import CardA from './components/CardVariants/CardA'
import CatCard from './components/CatCard/CatCard'
import AdminPanel from './components/AdminPanel/AdminPanel'
import Demo from './components/Demo/Demo'
import Book, { type BookHandle, type BookPage, type BookBackdrop } from './components/Book/Book'

const params = new URLSearchParams(window.location.search)
const backdropParam = params.get('backdrop')
const BACKDROP: BookBackdrop = backdropParam === 'desk' || backdropParam === 'cream' ? backdropParam : 'dark'

export default function App() {
  if (params.get('demo') === 'true') return <Demo />

  const isAdmin = import.meta.env.DEV && params.get('admin') === 'true'
  const [cafes, setCafes] = useState<CatCafe[]>(() => loadCafes(isAdmin))
  const [editingCafe, setEditingCafe] = useState<CatCafe | null>(null)
  const [placingCafe, setPlacingCafe] = useState<CatCafe | null>(null)
  const bookRef = useRef<BookHandle>(null)

  const sortedCafes = [...cafes].sort((a, b) => a.mapNumber - b.mapNumber)

  function handleSave(updated: CatCafe) {
    const exists = cafes.some(c => c.id === updated.id)
    const next = exists
      ? cafes.map(c => c.id === updated.id ? updated : c)
      : [...cafes, updated]
    setCafes(next)
    saveCafes(next)
    setEditingCafe(null)
  }

  function handleDelete(id: string) {
    const next = cafes.filter(c => c.id !== id)
    setCafes(next)
    saveCafes(next)
    setEditingCafe(null)
  }

  function handleStartPlace(cafe: CatCafe) {
    setPlacingCafe(cafe)
    setEditingCafe(null)
    if (bookRef.current) bookRef.current.goToPage('map')
    document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handlePlace(id: string, coords: { x: number; y: number }) {
    const next = cafes.map(c => {
      if (c.id !== id) return c
      const issues = (c.geoReview?.issues ?? []).filter(issue => issue.code !== 'missing_image_pin')
      const hasIssues = issues.length > 0
      const pinSource: CatCafe['pinSource'] = hasIssues ? 'needs_review' : c.poi ? 'imported' : 'manual'
      return {
        ...c,
        mapCoords: coords,
        pinSource,
        geoReview: {
          input_name: c.geoReview?.input_name ?? c.poi?.input_name ?? c.name,
          status: hasIssues ? 'needs_review' : 'ok',
          in_frame: true,
          city_bounds_ok: c.geoReview?.city_bounds_ok ?? Boolean(c.poi?.lng_wgs84 != null && c.poi?.lat_wgs84 != null && !c.poi?.needs_review),
          issues,
        },
      }
    })
    setCafes(next)
    saveCafes(next)
    setPlacingCafe(null)
  }

  function handleClearPin(id: string) {
    const next = cafes.map(c => {
      if (c.id !== id) return c
      const { mapCoords: _, ...rest } = c
      const issues = [
        ...(c.geoReview?.issues ?? []).filter(issue => issue.code !== 'missing_image_pin'),
        {
          code: 'missing_image_pin',
          message: 'Missing image map pin; place this cafe on the front-end map.',
        },
      ]
      return {
        ...rest,
        pinSource: 'needs_review' as const,
        geoReview: {
          input_name: c.geoReview?.input_name ?? c.poi?.input_name ?? c.name,
          status: 'needs_review',
          in_frame: false,
          city_bounds_ok: c.geoReview?.city_bounds_ok ?? Boolean(c.poi?.lng_wgs84 != null && c.poi?.lat_wgs84 != null && !c.poi?.needs_review),
          issues,
        },
      }
    })
    setCafes(next)
    saveCafes(next)
    setPlacingCafe(null)
  }

  function handleNew() {
    const nextMapNumber = cafes.length > 0 ? Math.max(...cafes.map(c => c.mapNumber)) + 1 : 1
    setEditingCafe({
      id: crypto.randomUUID(),
      name: '',
      address: '',
      neighborhood: '',
      mapNumber: nextMapNumber,
      photos: [],
      review: '',
      ratings: { comfort: 3, catFriendliness: 3, photoFriendly: 3 },
      reservationNote: '',
      priceNote: '',
      environmentNote: '',
      photoNote: '',
      visitTips: '',
      coordinatePolicy: 'Manual record; map pin and map-creator POI coordinates not resolved yet.',
      pinSource: 'needs_review',
      poi: {
        input_name: '',
        resolved_name: null,
        source: 'manual_frontend',
        poi_id: null,
        address: null,
        province: null,
        city: null,
        district: null,
        type: 'cat cafe',
        typecode: null,
        lng_gcj02: null,
        lat_gcj02: null,
        lng_wgs84: null,
        lat_wgs84: null,
        confidence: 0,
        status: 'manual_pin_only',
        needs_review: true,
        candidates: [],
      },
      geoReview: {
        input_name: '',
        status: 'needs_review',
        in_frame: false,
        city_bounds_ok: false,
        issues: [
          {
            code: 'missing_coordinate',
            message: 'Missing WGS84 coordinate from map-creator POI resolution.',
          },
          {
            code: 'missing_image_pin',
            message: 'Missing image map pin; place this cafe on the front-end map.',
          },
        ],
      },
      cats: [],
    })
  }

  const bookPages: BookPage[] = [
    { id: 'cover', content: <CoverPage /> },
    {
      id: 'map',
      content: (
        <MapPage
          cafes={sortedCafes}
          isAdmin={isAdmin}
          placingCafe={placingCafe}
          onPlace={handlePlace}
          onOpenCafe={cafe => bookRef.current?.goToPage(`cafe-${cafe.id}`)}
          onEditCafe={cafe => setEditingCafe(cafe)}
          onCancelPlace={() => setPlacingCafe(null)}
        />
      ),
    },
    ...sortedCafes.map(cafe => ({
      id: `cafe-${cafe.id}`,
      content: (
        <CafeDetailPage
          cafe={cafe}
          isAdmin={isAdmin}
          onEdit={() => setEditingCafe(cafe)}
          onPlace={() => handleStartPlace(cafe)}
        />
      ),
    })),
    { id: 'colophon', content: <ColophonPage /> },
  ]

  const adminToolbar = isAdmin ? (
    <button
      onClick={handleNew}
      className="font-mono text-[13px] tracking-widest uppercase bg-ink text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors shadow-md"
    >
      + New Entry
    </button>
  ) : null

  return (
    <>
      <div className="hidden md:block">
        <Book ref={bookRef} pages={bookPages} adminToolbar={adminToolbar} backdrop={BACKDROP} />
      </div>

      <div className="md:hidden bg-paper bg-texture min-h-screen font-serif text-ink">
        <CoverPage />
        <section id="map-section" className="page-section px-6 py-12">
          <h2 className="font-display text-6xl font-bold text-ink mb-1 leading-none">The Map</h2>
          <p className="font-mono text-[15px] text-sepia tracking-widest uppercase mb-6">— Tap a cafe to open its field notes</p>
          <div className="space-y-4">
            {sortedCafes.map(cafe => (
              <button
                key={cafe.id}
                type="button"
                className="w-full text-left border border-dashed border-ink/20 p-4 hover:bg-ink/5"
                onClick={() => document.getElementById(`mobile-${cafe.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                <span className="font-display text-3xl font-bold text-ink">{cafe.name}</span>
                <span className="block font-mono text-[13px] uppercase text-sepia">{cafe.neighborhood} · {cafe.cats.length} cats</span>
              </button>
            ))}
          </div>
        </section>
        <section className="px-6 pb-16">
          <div className="grid grid-cols-1 border-l border-t border-dashed border-ink/15">
            {sortedCafes.map(cafe => (
              <div id={`mobile-${cafe.id}`} key={cafe.id} className="border-r border-b border-dashed border-ink/15">
                <CardA cafe={cafe} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {isAdmin && editingCafe && (
        <AdminPanel
          cafe={editingCafe}
          isNew={!cafes.some(c => c.id === editingCafe.id)}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditingCafe(null)}
          onPlaceOnMap={handleStartPlace}
          onClearPin={handleClearPin}
          allCafes={cafes}
          onCafesChange={next => { setCafes(next); saveCafes(next) }}
        />
      )}
    </>
  )
}

function MapPage({
  cafes,
  isAdmin,
  placingCafe,
  onPlace,
  onOpenCafe,
  onEditCafe,
  onCancelPlace,
}: {
  cafes: CatCafe[]
  isAdmin: boolean
  placingCafe: CatCafe | null
  onPlace: (id: string, coords: { x: number; y: number }) => void
  onOpenCafe: (cafe: CatCafe) => void
  onEditCafe: (cafe: CatCafe) => void
  onCancelPlace: () => void
}) {
  const mapRef = useRef<HTMLDivElement>(null)

  function handleMapClick(e: React.MouseEvent) {
    if (!placingCafe || !mapRef.current) return
    const rect = mapRef.current.getBoundingClientRect()
    onPlace(placingCafe.id, {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    })
  }

  return (
    <div className="h-full w-full bg-paper bg-texture font-serif text-ink flex flex-col" id="map-section">
      <div className="bg-[#4A2D1A] shrink-0 px-8 py-3 flex items-center justify-between">
        <span className="font-display text-2xl font-bold text-paper leading-none tracking-wide">Cat Cafe Field Guide</span>
        <span className="font-mono text-[12px] tracking-widest uppercase text-paper/70">Map · cafe · categories</span>
      </div>

      {isAdmin && placingCafe && (
        <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-2 bg-terracotta/10 border-b border-terracotta/30">
          <span className="font-mono text-[14px] tracking-wider uppercase text-terracotta">
            Placing {placingCafe.name || '(unnamed)'} — click map
          </span>
          <button onClick={onCancelPlace} className="font-mono text-[13px] tracking-widest uppercase text-terracotta/70 hover:text-terracotta">Cancel</button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex gap-0">
        <div className="flex-[68] min-w-0 p-6 flex flex-col justify-center">
          <p className="font-mono text-[13px] tracking-widest uppercase text-sepia mb-3">— Cat cafe map</p>
          <div
            ref={mapRef}
            onClick={handleMapClick}
            className={`relative w-full border border-dashed border-sepia/40 overflow-hidden ${placingCafe ? 'cursor-crosshair' : ''}`}
            style={{ aspectRatio: '4/3' }}
          >
            <img src="/map_north.png" alt="Cat cafe map" className="absolute inset-0 w-full h-full object-cover" />
            {cafes.filter(c => c.mapCoords).map((cafe, idx) => {
              const { x = 0, y = 0 } = cafe.mapCoords!
              return (
                <button
                  key={cafe.id}
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    if (placingCafe) return
                    onOpenCafe(cafe)
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 hover:scale-110 cursor-pointer transition-transform"
                  style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
                  title={cafe.name}
                >
                  <div className="relative w-9 h-9 rounded-full bg-terracotta border-2 border-ink shadow-card flex items-center justify-center">
                    <span className="font-mono text-[13px] font-bold text-paper leading-none">{idx + 1}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-[32] min-w-0 border-l border-dashed border-ink/15 p-6 flex flex-col overflow-y-auto">
          <p className="font-mono text-[13px] tracking-widest uppercase text-sepia mb-4">Cafe List</p>
          <div className="space-y-3">
            {cafes.map((cafe, idx) => (
              <button key={cafe.id} type="button" onClick={() => onOpenCafe(cafe)} className="w-full text-left flex items-start gap-3 hover:bg-ink/5 p-2 -mx-2">
                <div className="relative shrink-0 w-7 h-7 mt-0.5 rounded-full bg-terracotta border border-ink flex items-center justify-center">
                  <span className="font-mono text-[12px] font-bold text-paper">{idx + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold text-ink leading-tight truncate">{cafe.name}</p>
                  <p className="font-mono text-[12px] tracking-widest uppercase text-sepia">{cafe.neighborhood} · {cafe.cats.length} cats</p>
                  {isAdmin && (
                    <span
                      className="inline-block mt-1 font-mono text-[11px] uppercase text-terracotta"
                      onClick={e => { e.stopPropagation(); onEditCafe(cafe) }}
                    >
                      Edit
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CafeDetailPage({ cafe, isAdmin, onEdit, onPlace }: { cafe: CatCafe; isAdmin: boolean; onEdit: () => void; onPlace: () => void }) {
  const [category, setCategory] = useState<'overview' | 'environment' | 'visit' | 'cats' | 'photos'>('overview')
  const categories = [
    ['overview', 'Overview'],
    ['environment', 'Environment'],
    ['visit', 'Visit'],
    ['cats', 'Cats'],
    ['photos', 'Photos'],
  ] as const

  return (
    <div className="h-full w-full bg-paper bg-texture font-serif text-ink flex flex-col">
      <div className="bg-[#4A2D1A] shrink-0 px-8 py-3 flex items-center justify-between">
        <span className="font-display text-2xl font-bold text-paper leading-none tracking-wide">{cafe.name}</span>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={onPlace} className="font-mono text-[12px] tracking-widest uppercase text-paper/75 hover:text-paper">Place Pin</button>
            <button onClick={onEdit} className="font-mono text-[12px] tracking-widest uppercase text-paper/75 hover:text-paper">Edit</button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[38%_62%]">
        <div className="border-r border-dashed border-ink/15 p-6 overflow-y-auto">
          <CardA cafe={cafe} />
        </div>
        <div className="p-8 overflow-y-auto">
          <p className="font-mono text-[13px] tracking-widest uppercase text-sepia mb-2">Cafe Categories</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className={`font-mono text-[12px] tracking-widest uppercase border px-3 py-2 ${category === id ? 'bg-ink text-paper border-ink' : 'border-ink/20 text-ink hover:bg-ink/5'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {category === 'overview' && <CategoryBlock title="Cafe Notes" text={cafe.review} />}
          {category === 'environment' && <CategoryBlock title="Environment" text={cafe.environmentNote || 'No environment note yet.'} />}
          {category === 'visit' && (
            <div className="grid grid-cols-2 gap-5">
              <CategoryBlock title="Reservation" text={cafe.reservationNote || 'No reservation note yet.'} />
              <CategoryBlock title="Price" text={cafe.priceNote || 'No price note yet.'} />
              <CategoryBlock title="Photo / Check-in" text={cafe.photoNote || 'No photo note yet.'} />
              <CategoryBlock title="Visit Tip" text={cafe.visitTips || 'No visit tip yet.'} />
            </div>
          )}
          {category === 'cats' && (
            <div className="grid grid-cols-2 gap-4">
              {cafe.cats.map(cat => <CatCard key={cat.id} cat={cat} />)}
            </div>
          )}
          {category === 'photos' && (
            <div className="grid grid-cols-2 gap-4">
              {cafe.photos.length > 0 ? cafe.photos.map(photo => (
                <img key={photo} src={photo} alt={cafe.name} className="w-full aspect-[4/3] object-cover border border-dashed border-ink/20" />
              )) : (
                <CategoryBlock title="Photos" text="No cafe photos uploaded yet." />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="border border-dashed border-ink/15 p-5 bg-paper/60">
      <h3 className="font-display text-4xl font-bold text-ink leading-none mb-3">{title}</h3>
      <p className="font-serif italic text-lg leading-relaxed text-ink/75">{text}</p>
    </section>
  )
}

function ColophonPage() {
  return (
    <div className="h-full w-full bg-ink text-paper flex flex-col items-center justify-center font-serif">
      <div className="text-center px-8 max-w-lg">
        <p className="font-mono text-base tracking-[0.4em] uppercase text-sepia mb-6">Fin.</p>
        <h2 className="font-display text-7xl font-bold text-paper leading-none mb-6">Thanks for turning the pages.</h2>
        <p className="font-serif text-lg text-paper leading-relaxed">
          Compiled with soft paws and strong opinions.
        </p>
      </div>
    </div>
  )
}
