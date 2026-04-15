import wardData from '../data/gcc-ward-data.json'

// Point in polygon detection
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

export async function detectWard(lat, lng) {
  try {
    const response = await fetch('/src/data/gcc-wards.geojson')
    const gccWards = await response.json()
    const point = [lng, lat]

    for (const feature of gccWards.features) {
      const wardNumber = parseInt(feature.properties.Name.trim())
      let polygons = []

      if (feature.geometry.type === 'Polygon') {
        polygons = [feature.geometry.coordinates[0]]
      } else if (feature.geometry.type === 'MultiPolygon') {
        polygons = feature.geometry.coordinates.map(p => p[0])
      }

      for (const polygon of polygons) {
        // Strip to 2D only
        const polygon2D = polygon.map(coord => [coord[0], coord[1]])
        if (isPointInPolygon(point, polygon2D)) {
          const data = wardData[wardNumber.toString()]
          return {
            ward_number: wardNumber,
            ward_name: data?.ward_name || `Ward ${wardNumber}`,
            zone: data?.zone || '',
            mla_constituency: data?.mla_constituency || '',
            mp_constituency: data?.mp_constituency || '',
            councillor_name: data?.councillor_name || '',
            mla_name: data?.mla_name || '',
            mp_name: data?.mp_name || '',
            corporation: 'GCC'
          }
        }
      }
    }
    return null
  } catch (err) {
    console.error('Ward detection error:', err)
    return null
  }
}