import wardData from '../data/gcc-ward-data.json'
import pincodeData from '../data/pincode-data.json'

const CHENNAI_METRO_PINS = new Set([
  600001, 600002, 600003, 600004, 600005, 600006, 600007, 600008, 600009, 600010,
  600011, 600012, 600013, 600014, 600015, 600016, 600017, 600018, 600019, 600020,
  600021, 600022, 600023, 600024, 600025, 600026, 600027, 600028, 600029, 600030,
  600031, 600032, 600033, 600034, 600035, 600036, 600037, 600038, 600039, 600040,
  600041, 600042, 600043, 600044, 600045, 600046, 600047, 600048, 600049, 600050,
  600051, 600052, 600053, 600054, 600055, 600056, 600057, 600058, 600059, 600060,
  600061, 600062, 600063, 600064, 600065, 600066, 600067, 600068, 600069, 600070,
  600071, 600072, 600073, 600074, 600075, 600076, 600077, 600078, 600079, 600080,
  600081, 600082, 600083, 600084, 600085, 600086, 600087, 600088, 600089, 600090,
  600091, 600092, 600093, 600094, 600095, 600096, 600097, 600098, 600099, 600100,
  600101, 600102, 600103, 600104, 600105, 600106, 600107, 600108, 600109, 600110,
  600111, 600112, 600113, 600114, 600115, 600116, 600117, 600118, 600119,
  600054, 600062, 600065, 600066, 600067, 600068, 600071, 600072, 600077,
  600045, 600048, 600059, 600063, 600073, 600074, 600075, 600076,
  600123, 600124, 600069, 600122, 600096, 600097, 600100, 600119,
])

function isPointInPolygon(point, polygon) {
  const x = point[0], y = point[1]
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function checkGeoJSON(point, geojson) {
  for (const feature of geojson.features) {
    const geom = feature.geometry
    let polygons = []
    if (geom.type === 'Polygon') {
      polygons = [geom.coordinates[0]]
    } else if (geom.type === 'MultiPolygon') {
      polygons = geom.coordinates.map(p => p[0])
    }
    for (const polygon of polygons) {
      if (isPointInPolygon(point, polygon)) {
        return feature.properties
      }
    }
  }
  return null
}

async function getPinCode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await response.json()
    const pin = data?.address?.postcode
    return pin ? parseInt(pin) : null
  } catch (err) {
    console.error('PIN lookup error:', err)
    return null
  }
}

export async function detectWard(lat, lng) {
  try {
    const point = [lng, lat]

    // LAYER 1 — GCC ward GeoJSON (exact ward + councillor)
    const gccResponse = await fetch('/gcc-wards.geojson')
    const gccWards = await gccResponse.json()

    for (const feature of gccWards.features) {
      const wardNumber = parseInt(feature.properties.Name.trim())
      let polygons = []
      if (feature.geometry.type === 'Polygon') {
        polygons = [feature.geometry.coordinates[0]]
      } else if (feature.geometry.type === 'MultiPolygon') {
        polygons = feature.geometry.coordinates.map(p => p[0])
      }
      for (const polygon of polygons) {
        if (isPointInPolygon(point, polygon.map(c => [c[0], c[1]]))) {
          const data = wardData[wardNumber.toString()]

          // LAYER 1a — enrich MLA/MP from official assembly boundaries
          let mla_name = data?.mla_name || ''
          let mla_constituency = data?.mla_constituency || ''
          let mp_name = data?.mp_name || ''
          let mp_constituency = data?.mp_constituency || ''

          try {
            const assemblyRes = await fetch('/chennai-assembly.geojson')
            const assemblyGJ = await assemblyRes.json()
            const match = checkGeoJSON(point, assemblyGJ)
            if (match) {
              mla_name = match.mla_name || mla_name
              mla_constituency = match.ac_name || mla_constituency
              mp_name = match.mp_name || mp_name
              mp_constituency = match.mp_constituency || mp_constituency
            }
          } catch (e) {
            console.warn('Assembly enrichment failed, using ward data')
          }

          return {
            ward_number: wardNumber,
            ward_name: data?.ward_name || `Ward ${wardNumber}`,
            zone: data?.zone || '',
            mla_constituency,
            mla_name,
            mp_constituency,
            mp_name,
            councillor_name: data?.councillor_name || '',
            corporation: 'GCC'
          }
        }
      }
    }

    // LAYER 2 — Assembly GeoJSON spatial lookup (non-GCC areas)
    try {
      const assemblyRes = await fetch('/chennai-assembly.geojson')
      const assemblyGJ = await assemblyRes.json()
      const match = checkGeoJSON(point, assemblyGJ)

      if (match) {
        const pin = await getPinCode(lat, lng)
        const pinInfo = pin ? pincodeData[pin.toString()] : null

        return {
          ward_number: null,
          ward_name: pinInfo?.ward_name || match.ac_name + ' Area',
          zone: pinInfo?.zone || match.ac_name,
          mla_constituency: match.ac_name,
          mla_name: match.mla_name || '',
          mp_constituency: match.mp_constituency || '',
          mp_name: match.mp_name || '',
          councillor_name: '',
          corporation: pinInfo?.corporation || 'Municipality'
        }
      }
    } catch (e) {
      console.warn('Assembly GeoJSON layer failed')
    }

    // LAYER 3 — Pincode whitelist + pincode-data fallback
    const pin = await getPinCode(lat, lng)
    if (!pin || !CHENNAI_METRO_PINS.has(pin)) {
      return null
    }

    const pinInfo = pincodeData[pin.toString()]
    if (pinInfo) {
      return {
        ward_number: null,
        ward_name: pinInfo.ward_name,
        zone: pinInfo.zone || '',
        mla_constituency: pinInfo.mla_constituency || '',
        mla_name: pinInfo.mla_name || '',
        mp_constituency: pinInfo.mp_constituency || '',
        mp_name: pinInfo.mp_name || '',
        councillor_name: '',
        corporation: pinInfo.corporation || 'GCC'
      }
    }

    // LAYER 4 — whitelisted pin but no data
    return {
      ward_number: null,
      ward_name: `Chennai Area — PIN ${pin}`,
      zone: 'Chennai Metro',
      mla_constituency: '',
      mla_name: '',
      mp_constituency: '',
      mp_name: '',
      councillor_name: '',
      corporation: 'GCC'
    }

  } catch (err) {
    console.error('Ward detection error:', err)
    return null
  }
}