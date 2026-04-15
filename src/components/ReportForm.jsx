import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { detectWard } from '../lib/wardDetection'

function ReportForm({ selectedLocation, setShowForm, setReports, reports, lang }) {
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [severity, setSeverity] = useState('moderate')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [wardInfo, setWardInfo] = useState(null)
  const [detectingWard, setDetectingWard] = useState(false)

  const t = {
    title: lang === 'ta' ? '📸 குப்பை புகாரளிக்க' : '📸 Report Garbage',
    photoLabel: lang === 'ta' ? 'படம் எடுக்கவும்' : 'Tap to take photo or upload',
    photoSub: lang === 'ta' ? 'Camera or gallery' : 'Opens back camera on mobile',
    severityLabel: lang === 'ta' ? 'தீவிரம் தேர்வு செய்யுங்கள்' : 'Select Severity',
    locationSelected: lang === 'ta' ? '📍 இடம் தேர்வு செய்யப்பட்டது' : '📍 Location selected',
    locationWarning: lang === 'ta' ? '⚠️ வரைபடத்தில் இடத்தை தேர்வு செய்யுங்கள்' : '⚠️ Tap on map to select location',
    submit: lang === 'ta' ? 'தாக்கல் செய்க' : 'Submit Report',
    submitting: lang === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...',
    success: lang === 'ta' ? '✅ புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!\nசிங்கார சென்னைக்கு உதவியதற்கு நன்றி!' : '✅ Report submitted.\nTogether, we can fix it.\nFor the Chennai we grew up loving. 🏙️',
    ward: lang === 'ta' ? 'வார்டு' : 'Ward',
    councillor: lang === 'ta' ? 'கவுன்சிலர்' : 'Councillor',
    mla: lang === 'ta' ? 'எம்எல்ஏ' : 'MLA',
    mp: lang === 'ta' ? 'எம்பி' : 'MP',
    detecting: lang === 'ta' ? '🔍 வார்டு கண்டறிகிறது...' : '🔍 Detecting ward...',
    wardFound: lang === 'ta' ? '✅ வார்டு கண்டறியப்பட்டது' : '✅ Ward detected',
    wardNotFound: lang === 'ta' ? '⚠️ வார்டு எல்லைக்கு வெளியே' : '⚠️ Outside ward boundary',
    outsideBoundary: lang === 'ta' ? '🚫 சென்னை எல்லைக்கு வெளியே தட்டினீர்கள். நகரத்திற்குள் தட்டவும்.' : '🚫 Please tap inside Chennai city limits to report.',
  }

  const severityOptions = [
    { key: 'minor', icon: '🟡', name: lang === 'ta' ? 'சிறியது' : 'Minor', tamil: lang === 'ta' ? 'Small pile' : 'சிறிய குவியல்' },
    { key: 'moderate', icon: '🟠', name: lang === 'ta' ? 'மிதமான' : 'Moderate', tamil: lang === 'ta' ? 'Medium dump' : 'நடுத்தர' },
    { key: 'severe', icon: '🔴', name: lang === 'ta' ? 'தீவிரமான' : 'Severe', tamil: lang === 'ta' ? 'Large dump' : 'பெரிய குவியல்' },
    { key: 'critical', icon: '⚫', name: lang === 'ta' ? 'அவசரகால' : 'Critical', tamil: lang === 'ta' ? 'Health hazard' : 'உடல்நல அபாயம்' },
  ]

  // Auto-detect ward when location is selected
  useEffect(() => {
    if (selectedLocation) {
      setDetectingWard(true)
      setWardInfo(null)
      detectWard(selectedLocation.lat, selectedLocation.lng)
        .then(ward => {
          setWardInfo(ward)
          setDetectingWard(false)
        })
        .catch(() => {
          setWardInfo(null)
          setDetectingWard(false)
        })
    }
  }, [selectedLocation])

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  // Block submit if outside boundary
  const isOutsideBoundary = selectedLocation && !detectingWard && !wardInfo
  const submitDisabled = loading || isOutsideBoundary || detectingWard

  async function handleSubmit() {
    if (!photo) {
      alert(lang === 'ta' ? 'படம் பதிவேற்றவும்' : 'Please upload a photo')
      return
    }
    if (!selectedLocation) {
      alert(lang === 'ta' ? 'வரைபடத்தில் இடத்தை தேர்வு செய்யுங்கள்' : 'Please tap on map to select location')
      return
    }
    if (!wardInfo) {
      alert(t.outsideBoundary)
      return
    }

    setLoading(true)

    try {
      const fileName = `report_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, photo)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName)

      const photoUrl = urlData.publicUrl

      const { data, error } = await supabase
        .from('reports')
        .insert([{
          photo_url: photoUrl,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          severity: severity,
          ward_number: wardInfo?.ward_number || null,
          ward_name: wardInfo?.ward_name || 'Unknown',
          councillor_name: wardInfo?.councillor_name || '',
          mla_constituency: wardInfo?.mla_constituency || '',
          mla_name: wardInfo?.mla_name || '',
          mp_constituency: wardInfo?.mp_constituency || '',
          mp_name: wardInfo?.mp_name || '',
          corporation: wardInfo?.corporation || 'GCC',
          status: 'pending'
        }])
        .select()

      if (error) throw error

      setReports([...reports, data[0]])
      setSuccess(true)

      setTimeout(() => {
        setShowForm(false)
        setSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Error:', error)
      alert(lang === 'ta' ? 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.' : 'Error submitting. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="form-overlay">
      <div className="form-container">

        {/* Header */}
        <div className="form-header">
          <h2>{t.title}</h2>
          <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
        </div>

        {success ? (
          <div className="success-message">
            {t.success}
          </div>
        ) : (
          <>
            {/* Photo Upload */}
            <div className="photo-upload">
              {photoPreview ? (
                <div style={{position:'relative'}}>
                  <img src={photoPreview} alt="Preview" className="photo-preview" />
                  <button
                    onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                    style={{position:'absolute',top:'8px',right:'8px',background:'rgba(0,0,0,0.5)',color:'#fff',border:'none',borderRadius:'50%',width:'24px',height:'24px',cursor:'pointer',fontSize:'12px'}}
                  >✕</button>
                </div>
              ) : (
                <label className="upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">{t.photoLabel}</span>
                    <span className="upload-sub">{t.photoSub}</span>
                  </div>
                </label>
              )}
            </div>

            {/* Severity */}
            <div className="severity-section">
              <div className="severity-label">{t.severityLabel}</div>
              <div className="severity-options">
                {severityOptions.map(opt => (
                  <button
                    key={opt.key}
                    className={`severity-btn ${severity === opt.key ? `selected-${opt.key}` : ''}`}
                    onClick={() => setSeverity(opt.key)}
                  >
                    <span className="sev-icon">{opt.icon}</span>
                    <span className="sev-name">{opt.name}</span>
                    <span className="sev-tamil">{opt.tamil}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location + Ward Info */}
            {selectedLocation ? (
              <div className="ward-info-box">
                {detectingWard ? (
                  <div className="ward-row">
                    <span className="ward-key">{t.detecting}</span>
                  </div>
                ) : wardInfo ? (
                  <>
                    <div className="ward-row">
                      <span className="ward-key">{t.ward}</span>
                      <span className="ward-val">#{wardInfo.ward_number} — {wardInfo.ward_name}</span>
                    </div>
                    <div className="ward-divider" />
                    <div className="ward-row">
                      <span className="ward-key">Zone</span>
                      <span className="ward-val">{wardInfo.zone}</span>
                    </div>
                    <div className="ward-divider" />
                    <div className="ward-row">
                      <span className="ward-key">{t.mla}</span>
                      <span className="ward-val">{wardInfo.mla_constituency}</span>
                    </div>
                    <div className="ward-divider" />
                    <div className="ward-row">
                      <span className="ward-key">{t.mp}</span>
                      <span className="ward-val">{wardInfo.mp_constituency}</span>
                    </div>
                    <div className="ward-divider" />
                    <div className="ward-row">
                      <span className="ward-key">Corp</span>
                      <span className="ward-val">{wardInfo.corporation}</span>
                    </div>
                  </>
                ) : (
                  // Outside boundary — show error
                  <div style={{textAlign:'center', padding:'8px 0'}}>
                    <div style={{fontSize:'15px', color:'#C41E3A', fontWeight:'600', marginBottom:'4px'}}>
                      🚫 {lang === 'ta' ? 'சென்னை எல்லைக்கு வெளியே' : 'Outside Chennai limits'}
                    </div>
                    <div style={{fontSize:'13px', color:'#666'}}>
                      {lang === 'ta' ? 'நகரத்திற்குள் தட்டவும்' : 'Please tap inside Chennai city limits to report'}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="location-warning">{t.locationWarning}</div>
            )}

            {/* Submit */}
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={submitDisabled}
              style={{
                opacity: submitDisabled ? 0.45 : 1,
                cursor: submitDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? t.submitting : detectingWard ? t.detecting : t.submit}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportForm