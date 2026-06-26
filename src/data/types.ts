export interface CatCafe {
  id: string
  name: string
  address: string
  neighborhood: string
  mapNumber: number
  region?: 'north' | 'south'
  mapCoords?: { x: number; y: number }
  photos: string[]
  review: string
  ratings: {
    comfort: number
    catFriendliness: number
    photoFriendly: number
  }
  reservationNote?: string
  priceNote?: string
  environmentNote?: string
  photoNote?: string
  visitTips?: string
  coordinatePolicy?: string
  pinSource?: 'manual' | 'poi' | 'imported' | 'needs_review'
  poi?: ResolvedPOI
  geoReview?: AlignmentResult
  cats: CatProfile[]
}

export interface CatProfile {
  id: string
  name: string
  photos: string[]
  tags: string[]
  review: string
  ratings: {
    friendly: number
    active: number
    photogenic: number
  }
}

export interface AMapPOICandidate {
  poi_id: string
  name: string
  address: string
  province: string
  city: string
  district: string
  type: string
  typecode: string
  lng_gcj02: number
  lat_gcj02: number
  raw?: Record<string, unknown>
}

export interface ResolvedPOI {
  input_name: string
  resolved_name: string | null
  source: string
  poi_id: string | null
  address: string | null
  province: string | null
  city: string | null
  district: string | null
  type: string | null
  typecode: string | null
  lng_gcj02: number | null
  lat_gcj02: number | null
  lng_wgs84: number | null
  lat_wgs84: number | null
  confidence: number
  status: string
  needs_review: boolean
  candidates: AMapPOICandidate[]
}

export interface POISet {
  city: string
  theme: string
  source: string
  coordinate_policy: string
  pois: ResolvedPOI[]
}

export interface AlignmentIssue {
  code: string
  message: string
}

export interface AlignmentResult {
  input_name: string
  status: string
  in_frame: boolean
  city_bounds_ok: boolean
  issues: AlignmentIssue[]
}
