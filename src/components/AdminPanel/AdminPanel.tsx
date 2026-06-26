import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Slider from '@radix-ui/react-slider'
import * as Label from '@radix-ui/react-label'
import type { CatCafe, CatProfile } from '../../data/types'
import { exportJSON, exportCSV } from '../../data/storage'
import { X, Upload, MapPin } from 'lucide-react'

interface Props {
  cafe: CatCafe
  isNew?: boolean
  onSave: (cafe: CatCafe) => void
  onDelete?: (id: string) => void
  onClose: () => void
  onPlaceOnMap?: (cafe: CatCafe) => void
  onClearPin?: (id: string) => void
  allCafes: CatCafe[]
  onCafesChange: (cafes: CatCafe[]) => void
}

export default function AdminPanel({ cafe, isNew, onSave, onDelete, onClose, onPlaceOnMap, onClearPin, allCafes, onCafesChange }: Props) {
  const [draft, setDraft] = useState<CatCafe>({ ...cafe, cats: cafe.cats.map(cat => ({ ...cat })) })
  const [dragging, setDragging] = useState('')
  const needsGeoReview = draft.geoReview ? draft.geoReview.status === 'needs_review' : Boolean(draft.poi?.needs_review)
  const cafeFileRef = useRef<HTMLInputElement>(null)
  const catFileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const importRef = useRef<HTMLInputElement>(null)

  function saveImage(file: File, id: string, onDone: (url: string) => void) {
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#F5EBD6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressed = canvas.toDataURL('image/jpeg', 0.82)
        fetch('/api/save-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, dataUrl: compressed }),
        })
          .then(r => r.json())
          .then(data => onDone(data.ok ? data.url : compressed))
          .catch(() => onDone(compressed))
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  function handleCafeImage(file: File) {
    saveImage(file, `${draft.id}-${Date.now()}`, url => {
      setDraft(d => ({ ...d, photos: [url, ...d.photos] }))
    })
  }

  function handleCatImage(catId: string, file: File) {
    saveImage(file, `${catId}-${Date.now()}`, url => {
      setDraft(d => ({
        ...d,
        cats: d.cats.map(cat => cat.id === catId ? { ...cat, photos: [url, ...cat.photos] } : cat),
      }))
    })
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string) as CatCafe[]
        onCafesChange(data)
        onClose()
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  function updateCat(catId: string, patch: Partial<CatProfile>) {
    setDraft(d => ({
      ...d,
      cats: d.cats.map(cat => cat.id === catId ? { ...cat, ...patch } : cat),
    }))
  }

  function addCat() {
    setDraft(d => ({
      ...d,
      cats: [
        ...d.cats,
        {
          id: crypto.randomUUID(),
          name: '',
          photos: [],
          tags: [],
          review: '',
          ratings: { friendly: 3, active: 3, photogenic: 3 },
        },
      ],
    }))
  }

  function deleteCat(catId: string) {
    setDraft(d => ({ ...d, cats: d.cats.filter(cat => cat.id !== catId) }))
  }

  return (
    <Dialog.Root open onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[10000]" />
        <Dialog.Content className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div className="bg-paper rounded-sm shadow-card-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink/15">
              <Dialog.Title className="font-display text-3xl font-bold text-ink leading-none">{isNew ? 'New Cat Cafe' : 'Edit Cat Cafe'}</Dialog.Title>
              <Dialog.Close className="text-ink opacity-40 hover:opacity-80 transition-opacity">
                <X size={18} />
              </Dialog.Close>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div>
                <Label.Root className="font-mono text-[13px] tracking-widest uppercase text-sepia block mb-2">
                  Cafe Photo
                </Label.Root>
                <div
                  className={`border-2 border-dashed rounded-sm h-32 flex flex-col items-center justify-center cursor-pointer transition-colors ${dragging === 'cafe' ? 'border-terracotta bg-paper' : 'border-ink/15 hover:border-sepia'}`}
                  onDragOver={e => { e.preventDefault(); setDragging('cafe') }}
                  onDragLeave={() => setDragging('')}
                  onDrop={e => { e.preventDefault(); setDragging(''); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleCafeImage(f) }}
                  onClick={() => cafeFileRef.current?.click()}
                >
                  {draft.photos[0] ? (
                    <img src={draft.photos[0]} alt="" className="h-full w-full object-cover rounded-sm" />
                  ) : (
                    <>
                      <Upload size={20} className="text-sepia mb-2" />
                      <span className="font-mono text-[15px] text-sepia">Drop image or click to upload</span>
                    </>
                  )}
                </div>
                <input ref={cafeFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleCafeImage(f) }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Name">
                  <input className="input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
                </Field>
                <Field label="Neighborhood">
                  <input className="input" value={draft.neighborhood} onChange={e => setDraft(d => ({ ...d, neighborhood: e.target.value }))} />
                </Field>
              </div>

              <Field label="Address">
                <input className="input" value={draft.address} onChange={e => setDraft(d => ({ ...d, address: e.target.value }))} />
              </Field>

              <div className="border border-dashed border-ink/15 p-3">
                <Label.Root className="font-mono text-[13px] tracking-widest uppercase text-sepia block mb-2">
                  POI / Geo Review
                </Label.Root>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <ReadonlyMeta label="Status" value={draft.geoReview?.status ?? draft.poi?.status ?? 'manual'} />
                  <ReadonlyMeta label="Needs Review" value={needsGeoReview ? 'yes' : 'no'} />
                  <ReadonlyMeta label="Confidence" value={draft.poi?.confidence != null ? String(draft.poi.confidence) : 'n/a'} />
                  <ReadonlyMeta label="Pin Source" value={draft.pinSource ?? 'manual'} />
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ReadonlyMeta label="POI Name" value={draft.poi?.resolved_name ?? draft.poi?.input_name ?? 'n/a'} />
                  <ReadonlyMeta label="POI Address" value={draft.poi?.address ?? 'n/a'} />
                  <ReadonlyMeta label="WGS84" value={formatCoords(draft.poi?.lng_wgs84, draft.poi?.lat_wgs84)} />
                  <ReadonlyMeta label="GCJ-02" value={formatCoords(draft.poi?.lng_gcj02, draft.poi?.lat_gcj02)} />
                </div>
                {draft.geoReview?.issues?.length ? (
                  <ul className="mt-2 space-y-1">
                    {draft.geoReview.issues.map(issue => (
                      <li key={`${issue.code}-${issue.message}`} className="font-serif italic text-sm text-terracotta">
                        {issue.code}: {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <Field label="Cafe Review">
                <textarea rows={3} className="input resize-none" value={draft.review} onChange={e => setDraft(d => ({ ...d, review: e.target.value }))} />
              </Field>

              <Field label="Environment Note">
                <textarea rows={2} className="input resize-none" value={draft.environmentNote ?? ''} onChange={e => setDraft(d => ({ ...d, environmentNote: e.target.value }))} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Reservation Note">
                  <input className="input" value={draft.reservationNote ?? ''} onChange={e => setDraft(d => ({ ...d, reservationNote: e.target.value }))} />
                </Field>
                <Field label="Price Note">
                  <input className="input" value={draft.priceNote ?? ''} onChange={e => setDraft(d => ({ ...d, priceNote: e.target.value }))} />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Photo / Check-in Note">
                  <textarea rows={2} className="input resize-none" value={draft.photoNote ?? ''} onChange={e => setDraft(d => ({ ...d, photoNote: e.target.value }))} />
                </Field>
                <Field label="Visit Tip">
                  <textarea rows={2} className="input resize-none" value={draft.visitTips ?? ''} onChange={e => setDraft(d => ({ ...d, visitTips: e.target.value }))} />
                </Field>
              </div>

              <div className="space-y-4">
                <Label.Root className="font-mono text-[13px] tracking-widest uppercase text-sepia block">
                  Cafe Ratings
                </Label.Root>
                {([
                  ['comfort', 'Comfort'],
                  ['catFriendliness', 'Cats'],
                  ['photoFriendly', 'Photo'],
                ] as const).map(([key, label]) => (
                  <RatingSlider
                    key={key}
                    label={label}
                    value={draft.ratings[key]}
                    onChange={value => setDraft(d => ({ ...d, ratings: { ...d.ratings, [key]: value } }))}
                  />
                ))}
              </div>

              <div className="flex items-end justify-between gap-4">
                <p className="font-mono text-[13px] tracking-widest uppercase text-sepia">
                  Map pin is placed visually on the map.
                </p>
                {onPlaceOnMap && !isNew && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { onSave(draft); onPlaceOnMap(draft) }} className="font-mono text-[13px] tracking-widest uppercase border border-ink/60 text-ink px-3 py-2 hover:bg-paper flex items-center gap-1.5">
                      <MapPin size={12} />
                      {draft.mapCoords ? 'Move Pin' : 'Place on Map'}
                    </button>
                    {draft.mapCoords && onClearPin && (
                      <button type="button" onClick={() => { if (confirm('Remove this pin from the map?')) onClearPin(draft.id) }} className="font-mono text-[13px] tracking-widest uppercase border border-terracotta/60 text-terracotta px-3 py-2 hover:bg-terracotta hover:text-paper transition-colors flex items-center gap-1.5">
                        <X size={12} />
                        Clear Pin
                      </button>
                    )}
                  </div>
                )}
              </div>

              <section className="border-t border-dashed border-ink/15 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <Label.Root className="font-mono text-[13px] tracking-widest uppercase text-sepia">
                    Resident Cats
                  </Label.Root>
                  <button type="button" onClick={addCat} className="font-mono text-[13px] tracking-widest uppercase border border-ink/30 text-ink px-3 py-1.5 hover:bg-ink hover:text-paper transition-colors">
                    + Add Cat
                  </button>
                </div>
                <div className="space-y-4">
                  {draft.cats.map(cat => (
                    <div key={cat.id} className="border border-dashed border-ink/15 p-4">
                      <div className="flex gap-4">
                        <div
                          className="w-24 h-24 shrink-0 border-2 border-dashed border-ink/15 flex items-center justify-center cursor-pointer hover:border-sepia"
                          onClick={() => catFileRefs.current[cat.id]?.click()}
                          onDragOver={e => { e.preventDefault(); setDragging(cat.id) }}
                          onDragLeave={() => setDragging('')}
                          onDrop={e => { e.preventDefault(); setDragging(''); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleCatImage(cat.id, f) }}
                        >
                          {cat.photos[0] ? (
                            <img src={cat.photos[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Upload size={18} className={dragging === cat.id ? 'text-terracotta' : 'text-sepia'} />
                          )}
                        </div>
                        <input
                          ref={node => { catFileRefs.current[cat.id] = node }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleCatImage(cat.id, f) }}
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex gap-3">
                            <Field label="Cat Name">
                              <input className="input" value={cat.name} onChange={e => updateCat(cat.id, { name: e.target.value })} />
                            </Field>
                            <button type="button" onClick={() => deleteCat(cat.id)} className="self-end font-mono text-[13px] tracking-widest uppercase text-terracotta/70 hover:text-terracotta">
                              Delete
                            </button>
                          </div>
                          <Field label="Tags">
                            <input className="input" value={cat.tags.join(', ')} onChange={e => updateCat(cat.id, { tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })} />
                          </Field>
                          <Field label="Cat Review">
                            <textarea rows={2} className="input resize-none" value={cat.review} onChange={e => updateCat(cat.id, { review: e.target.value })} />
                          </Field>
                          <div className="space-y-3">
                            {([
                              ['friendly', 'Friendly'],
                              ['active', 'Active'],
                              ['photogenic', 'Photo'],
                            ] as const).map(([key, label]) => (
                              <RatingSlider
                                key={key}
                                label={label}
                                value={cat.ratings[key]}
                                onChange={value => updateCat(cat.id, { ratings: { ...cat.ratings, [key]: value } })}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-ink/15 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button className="font-mono text-[13px] tracking-widest uppercase text-sepia hover:text-ink transition-colors" onClick={() => exportCSV(allCafes)}>
                  Export CSV
                </button>
                <span className="text-paper">·</span>
                <button className="font-mono text-[13px] tracking-widest uppercase text-sepia hover:text-ink transition-colors" onClick={() => exportJSON(allCafes)}>
                  JSON
                </button>
                <span className="text-paper">·</span>
                <button className="font-mono text-[13px] tracking-widest uppercase text-sepia hover:text-ink transition-colors" onClick={() => importRef.current?.click()}>
                  Import
                </button>
                <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              </div>
              <div className="flex gap-3 items-center">
                {!isNew && onDelete && (
                  <button className="font-mono text-[13px] tracking-widest uppercase text-terracotta/70 hover:text-terracotta transition-colors" onClick={() => { if (confirm(`Delete "${cafe.name}"?`)) onDelete(cafe.id) }}>
                    Delete
                  </button>
                )}
                <button className="font-mono text-[15px] text-ink opacity-50 hover:opacity-80 transition-opacity" onClick={onClose}>
                  Cancel
                </button>
                <button className="font-mono text-[15px] tracking-widest uppercase bg-ink text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors" onClick={() => onSave(draft)}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="w-full">
      <Label.Root className="font-mono text-[13px] tracking-widest uppercase text-sepia block mb-2">
        {label}
      </Label.Root>
      {children}
    </div>
  )
}

function RatingSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[13px] tracking-widest uppercase text-ink w-24 shrink-0">
        {label}
      </span>
      <Slider.Root className="relative flex items-center flex-1 h-5" min={1} max={5} step={1} value={[value]} onValueChange={([v]) => onChange(v)}>
        <Slider.Track className="relative grow rounded-full h-1.5 bg-ink/10">
          <Slider.Range className="absolute bg-terracotta rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 bg-terracotta rounded-full shadow focus:outline-none focus:ring-2 focus:ring-terracotta/50" />
      </Slider.Root>
      <span className="font-mono text-[15px] text-ink w-5 text-right">{value}</span>
    </div>
  )
}

function ReadonlyMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-widest uppercase text-sepia">{label}</p>
      <p className="font-serif text-base text-ink">{value}</p>
    </div>
  )
}

function formatCoords(lng?: number | null, lat?: number | null) {
  if (lng == null || lat == null) return 'n/a'
  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`
}
