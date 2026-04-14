import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { supabase } from '../lib/supabase'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Severity based circle icons
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

// Gold pin for selected location
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
    severity: lang === 'ta' ? 'தீவிரம்' : 'Severity',
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
    <MapContainer
      center={chennaiCenter}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='© OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler
        setSelectedLocation={setSelectedLocation}
        setShowForm={setShowForm}
        setClickedPin={setClickedPin}
      />

      {/* Gold pin — selected location */}
      {clickedPin && (
        <Marker position={[clickedPin.lat, clickedPin.lng]} icon={goldIcon}>
          <Popup>{t.reporting}</Popup>
        </Marker>
      )}

      {/* Severity based circle pins */}
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
                <div>
                  <span
                    className={`popup-severity sev-${report.severity}`}
                    style={{color: severityColors[report.severity]}}
                  >
                    {severityLabels[report.severity] || report.severity}
                  </span>
                </div>
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
  )
}

export default Map