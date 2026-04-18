import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { detectWard } from '../lib/wardDetection'

function ReportForm({ selectedLocation, setShowForm, setReports, reports, lang }) {
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [severity, setSeverity] = useState('medium')
  const [wasteType, setWasteType] = useState('household')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [wardInfo, setWardInfo] = useState(null)
  const [detectingWard, setDetectingWard] = useState(false)

  const t = {
    title: lang === 'ta' ? '📸 குப்பை புகார்' : '📸 Report Garbage',
    photoLabel: lang === 'ta' ? 'படம் எடுக்கவும்' : 'Tap to take photo or upload',
    photoSub: lang === 'ta' ? 'கேமரா அல்லது கேலரி' : 'Opens back camera on mobile',
    impactLabel: 'Impact Level',
    wasteLabel: lang === 'ta' ? 'கழிவு வகை' : 'Waste Type',
    locationWarning: lang === 'ta' ? '⚠️ வரைபடத்தில் இடத்தை தேர்வு செய்யுங்கள்' : '⚠️ Tap on map to select location',
    submit: 'Submit Report',
    submitting: lang === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...',
    success: lang === 'ta' ? '✅ புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!\nசிங்கார சென்னைக்கு உதவியதற்கு நன்றி!' : '✅ Report submitted.\nTogether, we can fix it.\nFor the Chennai we grew up loving. 🏙️',
    ward: lang === 'ta' ? 'வார்டு' : 'Ward',
    councillor: lang === 'ta' ? 'கவுன்சிலர்' : 'Councillor',
    mla: 'MLA',
    mp: 'MP',
    corp: lang === 'ta' ? 'நிறுவனம்' : 'Corp',
    detecting: lang === 'ta' ? '🔍 இடம் கண்டறிகிறது...' : '🔍 Detecting location...',
    outsideBoundary: lang === 'ta' ? '🚫 சென்னை எல்லைக்கு வெளியே தட்டினீர்கள். நகரத்திற்குள் தட்டவும்.' : '🚫 Please tap inside Chennai city limits to report.',
    anonymous: lang === 'ta' ? '🔒 அனைத்து புகாரும் அநாமதேய' : '🔒 All reports are anonymous',
    outsideMsg: lang === 'ta' ? 'சென்னை எல்லைக்கு வெளியே' : 'Outside Chennai limits',
    outsideSub: lang === 'ta' ? 'நகரத்திற்குள் தட்டவும்' : 'Please tap inside Chennai city limits to report',
  }

  const severityOptions = [
    {
      key: 'low',
      icon: '🟡',
      name: 'Low',
      desc: lang === 'ta' ? 'ஒரு சுற்றில் சுத்தமாகும்' : 'A small pile, clears in one trip'
    },
    {
      key: 'medium',
      icon: '🟠',
      name: 'Medium',
      desc: lang === 'ta' ? 'ஆட்டோ அளவு குவியல்' : 'Heap size of an auto, needs attention'
    },
    {
      key: 'high',
      icon: '🔴',
      name: 'High',
      desc: lang === 'ta' ? 'நடைபாதை தடைபட்டுள்ளது' : 'Footpath blocked, people walking on road'
    },
    {
      key: 'critical',
      icon: '⚫',
      name: 'Critical',
      desc: lang === 'ta' ? 'முழு தெரு / மனை நிரம்பியுள்ளது' : 'Entire plot or road stretch dumped'
    },
  ]

  const wasteOptions = [
    { key: 'household', color: '#4CAF50', label: lang === 'ta' ? 'வீட்டு கழிவு' : 'Household Waste' },
    { key: 'construction', color: '#FF9800', label: lang === 'ta' ? 'கட்டிட இடிபாடு' : 'Construction Debris' },
    { key: 'mixed', color: '#9C27B0', label: lang === 'ta' ? 'கலப்பு கழிவு' : 'Mixed Waste' },
    { key: 'ewaste', color: '#2196F3', label: lang === 'ta' ? 'மின்னணு கழிவு' : 'E-Waste' },
    { key: 'biomedical', color: '#F44336', label: lang === 'ta' ? 'மருத்துவ கழிவு' : 'Biomedical Waste' },
    { key: 'drainage', color: '#00BCD4', label: lang === 'ta' ? 'வடிகால் கழிவு' : 'Drainage / Sewage' },
  ]

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
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 1024
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxSize) { height *= maxSize / width; width = maxSize }
        } else {
          if (height > maxSize) { width *= maxSize / height; height = maxSize }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, { type: 'image/jpeg' })
          setPhoto(compressedFile)
          setPhotoPreview(URL.createObjectURL(compressedFile))
        }, 'image/jpeg', 0.7)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const isOutsideBoundary = !detectingWard && selectedLocation && wardInfo === null
  const submitDisabled = loading || detectingWard || isOutsideBoundary

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
          waste_type: wasteType,
          ward_number: wardInfo?.ward_number || null,
          ward_name: wardInfo?.ward_name || 'Unknown',
          councillor_name: wardInfo?.councillor_name || '',
          mla_constituency: wardInfo?.mla_constituency || '',
          mla_name: wardInfo?.mla_name || '',
          mp_constituency: wardInfo?.mp_constituency || '',
          mp_name: wardInfo?.mp_name || '',
          zone: wardInfo?.zone || '',
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
        <div className="form-header">
          <h2>{t.title}</h2>
          <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
        </div>
        {success ? (
          <div className="success-message">{t.success}</div>
        ) : (
          <>
            {/CriOS/i.test(navigator.userAgent) && (
              <div style={{background:'#fff8e6',border:'0.5px solid #FFD700',borderRadius:'8px',padding:'8px 12px',marginBottom:'12px',fontSize:'12px',color:'#C41E3A',fontWeight:'600'}}>
                📱 {lang === 'ta' ? 'சிறந்த அனுபவத்திற்கு Safari பயன்படுத்தவும்' : 'For best experience, open in Safari'}
              </div>
            )}

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
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{display:'none'}} />
                  <div className="upload-placeholder">
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">{t.photoLabel}</span>
                    <span className="upload-sub">{t.photoSub}</span>
                  </div>
                </label>
              )}
            </div>

            <div className="severity-section">
              <div className="severity-label">{t.impactLabel}</div>
              <div className="severity-options">
                {severityOptions.map(opt => (
                  <button
                    key={opt.key}
                    className={`severity-btn ${severity === opt.key ? `selected-${opt.key}` : ''}`}
                    onClick={() => setSeverity(opt.key)}
                  >
                    <span className="sev-icon">{opt.icon}</span>
                    <span className="sev-name">{opt.name}</span>
                    <span className="sev-tamil">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="severity-section">
              <div className="severity-label">{t.wasteLabel}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                {wasteOptions.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setWasteType(opt.key)}
                    style={{
                      display:'flex',
                      alignItems:'center',
                      gap:'8px',
                      padding:'8px 10px',
                      border: wasteType === opt.key ? `2px solid ${opt.color}` : '0.5px solid var(--color-border-tertiary)',
                      borderRadius:'8px',
                      background: wasteType === opt.key ? `${opt.color}18` : 'var(--color-background-secondary)',
                      cursor:'pointer',
                      textAlign:'left'
                    }}
                  >
                    <div style={{width:'10px',height:'10px',borderRadius:'50%',background:opt.color,flexShrink:0}}></div>
                    <span style={{fontSize:'12px',fontWeight:'500',color:'var(--color-text-primary)',lineHeight:'1.3'}}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedLocation ? (
              <div className="ward-info-box">
                {detectingWard ? (
                  <div className="ward-row">
                    <span className="ward-key">{t.detecting}</span>
                  </div>
                ) : wardInfo ? (
                  <>
                    {wardInfo.ward_number ? (
                      <>
                        <div className="ward-row">
                          <span className="ward-key">{t.ward}</span>
                          <span className="ward-val">#{wardInfo.ward_number} — {wardInfo.ward_name}</span>
                        </div>
                        <div className="ward-divider" />
                      </>
                    ) : (
                      <>
                        <div className="ward-row">
                          <span className="ward-key">{t.ward}</span>
                          <span className="ward-val">{wardInfo.ward_name}</span>
                        </div>
                        <div className="ward-divider" />
                      </>
                    )}
                    <div className="ward-row">
                      <span className="ward-key">{t.corp}</span>
                      <span className="ward-val">{wardInfo.corporation}</span>
                    </div>
                    <div className="ward-divider" />
                    {wardInfo.councillor_name ? (
                      <>
                        <div className="ward-row">
                          <span className="ward-key">{t.councillor}</span>
                          <span className="ward-val">{wardInfo.councillor_name}</span>
                        </div>
                        <div className="ward-divider" />
                      </>
                    ) : null}
                    <div className="ward-row">
                      <span className="ward-key">{t.mla}</span>
                      <span className="ward-val">
                        {wardInfo.mla_name
                          ? <><strong>{wardInfo.mla_name}</strong><span style={{color:'#888',fontSize:'11px',marginLeft:'4px'}}>({wardInfo.mla_constituency})</span></>
                          : wardInfo.mla_constituency}
                      </span>
                    </div>
                    <div className="ward-divider" />
                    <div className="ward-row">
                      <span className="ward-key">{t.mp}</span>
                      <span className="ward-val">
                        {wardInfo.mp_name
                          ? <><strong>{wardInfo.mp_name}</strong><span style={{color:'#888',fontSize:'11px',marginLeft:'4px'}}>({wardInfo.mp_constituency})</span></>
                          : wardInfo.mp_constituency}
                      </span>
                    </div>
                  </>
                ) : (
                  <div style={{textAlign:'center',padding:'8px 0'}}>
                    <div style={{fontSize:'15px',color:'#C41E3A',fontWeight:'600',marginBottom:'4px'}}>
                      🚫 {t.outsideMsg}
                    </div>
                    <div style={{fontSize:'13px',color:'#666'}}>
                      {t.outsideSub}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="location-warning">{t.locationWarning}</div>
            )}

            <div style={{textAlign:'center',padding:'8px 0',fontSize:'11px',color:'var(--color-text-secondary)'}}>
              {t.anonymous}
            </div>

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={submitDisabled}
              style={{opacity:submitDisabled ? 0.45 : 1, cursor:submitDisabled ? 'not-allowed' : 'pointer'}}
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