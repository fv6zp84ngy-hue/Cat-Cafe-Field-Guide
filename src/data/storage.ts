import type { CatCafe } from './types'
import { DEMO_CAFES } from './cafes'

const KEY = 'catcafe_fieldguide_cafes'

export function loadCafes(_isAdmin = false): CatCafe[] {
  const raw = localStorage.getItem(KEY)
  if (!raw) {
    saveCafes(DEMO_CAFES)
    return DEMO_CAFES
  }
  try {
    return JSON.parse(raw) as CatCafe[]
  } catch {
    return DEMO_CAFES
  }
}

export function saveCafes(cafes: CatCafe[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cafes))
  } catch {
    console.warn('localStorage quota exceeded — data not persisted locally')
  }
  // Dev-server middleware writes to src/data/cafes.json so the change is committable.
  // Tree-shaken out of production builds.
  if (import.meta.env.DEV) {
    fetch('/api/save-cafes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cafes),
    }).catch(() => {})
  }
}

export function exportJSON(cafes: CatCafe[]): void {
  download(
    new Blob([JSON.stringify(cafes, null, 2)], { type: 'application/json' }),
    'cat-cafe-field-guide.json',
  )
}

export function exportCSV(cafes: CatCafe[]): void {
  const header = ['Map Number', 'Name', 'Address', 'Neighborhood', 'Comfort', 'Cats', 'Photo', 'Review', 'Cat Count']
  const rows = cafes
    .slice()
    .sort((a, b) => a.mapNumber - b.mapNumber)
    .map(c => [
      c.mapNumber,
      c.name,
      c.address,
      c.neighborhood,
      c.ratings.comfort,
      c.ratings.catFriendliness,
      c.ratings.photoFriendly,
      c.review,
      c.cats.length,
    ])
  const csv = [header, ...rows]
    .map(row => row.map(cell => {
      const str = String(cell ?? '')
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
    }).join(','))
    .join('\n')
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'cat-cafe-field-guide.csv')
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
