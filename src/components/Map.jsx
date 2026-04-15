import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import 'leaflet/dist/leaflet.css'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'
import L from 'leaflet'
import 'leaflet-control-geocoder'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createCircleIcon(color, size, borderColor) {
  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: 2.5px solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 0 0 3px ${color}44;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -(size/2)],
    className: ''
  })
}

const severityIcons = {
  minor: createCircleIcon('#f59e0b', 14, '#d97706'),
  moderate: createCircleIcon('#f97316', 18, '#ea580c'),
  severe: createCircleIcon('#C41E3A', 22, '#9b1827'),
  critical: createCircleIcon('#1a1a2e', 26, '#000'),
}

const defaultIcon = createCircleIcon('#C41E3A', 16, '#9b1827')

const goldIcon = L.divIcon({
  html: `<div style="
    width: 28px;
    height: 28px;
    background: #FFD700;
    border: 3px solid #C41E3A;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
  className: ''
})

function SearchControl({ setSelectedLocation, setShowForm, setClickedPin }) {
  const map = useMap()

  useEffect(() => {
    try {
      const geocoderControl = L.Control.Geocoder.nominatim()
      const control = L.Control.geocoder({
        defaultMarkGeocode: false,
        placeholder: 'Search area, street...',
        geocoder: geocoderControl,
      })

      control.on('markgeocode', function(e) {
        const { center } = e.geocode
        const location = { lat: center.lat, lng: center.lng }
        map.flyTo(center, 16)
        setSelectedLocation(location)
        setClickedPin(location)
        setShowForm(true)
      })

      control.addTo(map)
      return () => map.removeControl(control)
    } catch(err) {
      console.error('Geocoder init error:', err)
    }
  }, [map])

  return null
}

function MapClickHandler({ setSelectedLocation, setShowForm, setClickedPin }) {
  useMapEvents({
    click(e) {
      const location = { lat: e.latlng.lat, lng: e.latlng.lng }
      setSelectedLocation(location)
      setClickedPin(location)
      setShowForm(true)
    }
  })
  return null
}

// GPS button inside map
function GPSButton({ setSelectedLocation, setShowForm, setClickedPin, lang }) {
  const map = useMap()
  const [locating, setLocating] = useState(false)

  function handleGPS() {
    if (!navigator.geolocation) {
      alert(lang === 'ta' ? 'உங்கள் சாதனம் GPS ஐ ஆதரிக்கவில்லை' : 'GPS not supported on this device')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        map.flyTo([location.lat, location.lng], 17)
        setSelectedLocation(location)
        setClickedPin(location)
        setShowForm(true)
        setLocating(false)
      },
      (err) => {
        console.error('GPS error:', err)
        alert(lang === 'ta' ? 'இடத்தை கண்டறிய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Could not get location. Please try again or tap the map.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        right: '12px',
        zIndex: 1000,
      }}
    >
      <button
        onClick={handleGPS}
        disabled={locating}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: '#fff',
          border: '2px solid #C41E3A',
          cursor: locating ? 'not-allowed' : 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          opacity: locating ? 0.6 : 1,
        }}
        title={lang === 'ta' ? 'என் இடம்' : 'Use my location'}
      >
        {locating ? '⏳' : '📍'}
      </button>
    </div>
  )
}

function Map({ reports, setReports, setSelectedLocation, setShowForm, lang }) {
  const chennaiCenter = [13.0827, 80.2707]
  const [clickedPin, setClickedPin] = useState(null)

  const t = {
    reporting: lang === 'ta' ? '📍 இங்கே புகாரளிக்கிறோம்' : '📍 Reporting here',
    ward: lang === 'ta' ? 'வார்டு' : 'Ward',
    councillor: lang === 'ta' ? 'கவுன்சிலர்' : 'Councillor',
    mla: lang === 'ta' ? 'எம்எல்ஏ' : 'MLA',
    mp: lang === 'ta' ? 'எம்பி' : 'MP',
    reported: lang === 'ta' ? 'புகாரளிக்கப்பட்டது' : 'Reported',
  }

  const severityLabels = {
    minor: lang === 'ta' ? 'சிறியது' : 'Minor',
    moderate: lang === 'ta' ? 'மிதமான' : 'Moderate',
    severe: lang === 'ta' ? 'தீவிரமான' : 'Severe',
    critical: lang === 'ta' ? 'அவசரகால' : 'Critical',
  }

  const severityColors = {
    minor: '#f59e0b',
    moderate: '#f97316',
    severe: '#C41E3A',
    critical: '#1a1a2e',
  }

  useEffect(() => { fetchReports() }, [])

  async function fetchReports() {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setReports(data)
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={chennaiCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='© OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SearchControl
          setSelectedLocation={setSelectedLocation}
          setShowForm={setShowForm}
          setClickedPin={setClickedPin}
        />

        <MapClickHandler
          setSelectedLocation={setSelectedLocation}
          setShowForm={setShowForm}
          setClickedPin={setClickedPin}
        />

        <GPSButton
          setSelectedLocation={setSelectedLocation}
          setShowForm={setShowForm}
          setClickedPin={setClickedPin}
          lang={lang}
        />

        {clickedPin && (
          <Marker position={[clickedPin.lat, clickedPin.lng]} icon={goldIcon}>
            <Popup>{t.reporting}</Popup>
          </Marker>
        )}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={severityIcons[report.severity] || defaultIcon}
          >
            <Popup>
              <div className="popup-content">
                {report.photo_url && (
                  <img
                    src={report.photo_url}
                    alt="Garbage report"
                    style={{ width: '150px', borderRadius: '8px', marginBottom: '6px' }}
                  />
                )}
                {report.severity && (
                  <span
                    className={`popup-severity sev-${report.severity}`}
                    style={{color: severityColors[report.severity]}}
                  >
                    {severityLabels[report.severity] || report.severity}
                  </span>
                )}
                <p><strong>{t.ward}:</strong> {report.ward_name || '—'}</p>
                <p><strong>{t.councillor}:</strong> {report.councillor_name || '—'}</p>
                <p><strong>{t.mla}:</strong> {report.mla_name || '—'}</p>
                <p><strong>{t.mp}:</strong> {report.mp_name || '—'}</p>
                {report.corporation && (
                  <span className="corp-badge">{report.corporation}</span>
                )}
                <p style={{marginTop:'4px',color:'#999',fontSize:'10px'}}>
                  {t.reported}: {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default Map