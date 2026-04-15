import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Map from '../components/Map'
import ReportForm from '../components/ReportForm'
import '../App.css'

function Home({ lang, setLang }) {
  const [showForm, setShowForm] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [reports, setReports] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [corpFilter, setCorpFilter] = useState('all')
  const [view, setView] = useState('map')
  const [selectedReport, setSelectedReport] = useState(null)
  const [showCleanedModal, setShowCleanedModal] = useState(false)
  const [cleanedPhoto, setCleanedPhoto] = useState(null)
  const [cleanedPhotoPreview, setCleanedPhotoPreview] = useState(null)
  const [cleanedLoading, setCleanedLoading] = useState(false)
  const [cleanedSuccess, setCleanedSuccess] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('nk_welcome_seen')
  })

  const t = {
    logo: lang === 'ta' ? 'நம்ம குப்பை' : 'Namma Kuppai',
    tagline: lang === 'ta' ? 'சிங்கார சென்னை' : 'Singara Chennai',
    board: lang === 'ta' ? 'பொறுப்பு பலகை' : 'Responsibility Board',
    reportBtn: lang === 'ta' ? '📸 குப்பை புகாரளிக்க' : '📸 Report Garbage',
    reports: lang === 'ta' ? 'புகார்கள்' : 'Reports',
    allSeverity: lang === 'ta' ? 'அனைத்து தீவிரம்' : 'All Severity',
    allStatus: lang === 'ta' ? 'அனைத்து நிலை' : 'All Status',
    allCorps: lang === 'ta' ? 'அனைத்து கார்ப்' : 'All Corps',
  }

  useEffect(() => { fetchReports() }, [severityFilter, statusFilter, corpFilter])

  async function fetchReports() {
    let query = supabase.from('reports').select('*').order('created_at', { ascending: false })
    if (severityFilter !== 'all') query = query.eq('severity', severityFilter)
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (corpFilter !== 'all') query = query.eq('corporation', corpFilter)
    const { data, error } = await query
    if (!error) setReports(data)
  }

  const activeReports = reports.filter(r => r.status === 'pending').length

  function timeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const severityColors = {
    minor: { bg: '#fffbeb', color: '#f59e0b', label: 'Minor' },
    moderate: { bg: '#fff7ed', color: '#f97316', label: 'Moderate' },
    severe: { bg: '#fff5f5', color: '#C41E3A', label: 'Severe' },
    critical: { bg: '#1a1a2e', color: '#fff', label: 'Critical' },
  }

  function closeWelcome() {
    localStorage.setItem('nk_welcome_seen', 'true')
    setShowWelcome(false)
  }

  function shareOnWhatsApp(report) {
    const severity = severityColors[report.severity]?.label || report.severity
    const ward = report.ward_name || 'Unknown Ward'
    const wardNum = report.ward_number ? `#${report.ward_number}` : ''
    const corp = report.corporation || 'GCC'
    const isResolved = report.status === 'resolved'

    const message = isResolved
      ? `✅ Garbage CLEANED at ${ward} ${wardNum} (${corp})\n\nThis issue has been resolved and verified.\n\nSee more reports at nammakuppai.in\n\nFor the Singara Chennai we grew up loving 💛`
      : `🚨 Garbage reported at ${ward} ${wardNum} (${corp})\n\nSeverity: ${severity}\nMLA: ${report.mla_constituency || 'Unknown'}\nMP: ${report.mp_constituency || 'Unknown'}\n\n📍 View & report more at nammakuppai.in\n\nFor the Singara Chennai we grew up loving 💛`

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  function openCleanedModal() {
    setCleanedPhoto(null)
    setCleanedPhotoPreview(null)
    setCleanedSuccess(false)
    setShowCleanedModal(true)
  }

  function handleCleanedPhoto(e) {
    const file = e.target.files[0]
    if (file) {
      setCleanedPhoto(file)
      setCleanedPhotoPreview(URL.createObjectURL(file))
    }
  }

  async function submitCleaned() {
    if (!cleanedPhoto) {
      alert(lang === 'ta' ? 'சுத்தம் செய்யப்பட்ட படத்தை பதிவேற்றவும்' : 'Please upload a photo showing it is cleaned')
      return
    }

    setCleanedLoading(true)

    try {
      const fileName = `cleaned_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, cleanedPhoto)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName)

      const verifiedPhotoUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          verified_photo_url: verifiedPhotoUrl
        })
        .eq('id', selectedReport.id)

      if (updateError) throw updateError

      const updatedReport = {
        ...selectedReport,
        status: 'resolved',
        verified_photo_url: verifiedPhotoUrl
      }

      const updatedReports = reports.map(r => r.id === selectedReport.id ? updatedReport : r)
      setReports(updatedReports)
      setSelectedReport(updatedReport)
      setCleanedSuccess(true)

      setTimeout(() => {
        setShowCleanedModal(false)
        setCleanedSuccess(false)
        setSelectedReport(updatedReport)
      }, 2500)

    } catch (error) {
      console.error('Error:', error)
      alert(lang === 'ta' ? 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.' : 'Error submitting. Please try again.')
    }

    setCleanedLoading(false)
  }

  return (
    <div className="app-container">

      {/* Header */}
      <div className="header">
        <div className="header-left">
          <h1 className="logo">{t.logo}</h1>
          <span className="tagline">{t.tagline}</span>
        </div>
        <div className="header-right">
          <div className="social-icons">
            <a href="https://instagram.com/nammakuppai" target="_blank" className="social-icon" title="Instagram">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/>
              </svg>
            </a>
            <a href="https://x.com/nammakuppai" target="_blank" className="social-icon" title="X">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/namma-kuppai/" target="_blank" className="social-icon" title="LinkedIn">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="https://t.me/nammakuppai" target="_blank" className="social-icon" title="Telegram">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
          <button className="lang-toggle" onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}>
            {lang === 'ta' ? 'EN' : 'தமிழ்'}
          </button>
          <a href="/board" className="board-btn">{t.board}</a>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="filter-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
          <option value="all">{t.allSeverity}</option>
          <option value="minor">{lang === 'ta' ? 'சிறியது' : 'Minor'}</option>
          <option value="moderate">{lang === 'ta' ? 'மிதமான' : 'Moderate'}</option>
          <option value="severe">{lang === 'ta' ? 'தீவிரமான' : 'Severe'}</option>
          <option value="critical">{lang === 'ta' ? 'அவசரகால' : 'Critical'}</option>
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">{t.allStatus}</option>
          <option value="pending">{lang === 'ta' ? 'நிலுவையில்' : 'Pending'}</option>
          <option value="resolved">{lang === 'ta' ? 'தீர்க்கப்பட்டது' : 'Resolved'}</option>
        </select>
        <select className="filter-select" value={corpFilter} onChange={e => setCorpFilter(e.target.value)}>
          <option value="all">{t.allCorps}</option>
          <option value="GCC">GCC</option>
          <option value="Avadi">Avadi</option>
          <option value="Tambaram">Tambaram</option>
        </select>
        <span className="report-count">
          {reports.length}<span> {t.reports}</span>
        </span>
        <div className="view-toggle">
          <button className={`view-btn ${view === 'map' ? 'view-btn-active' : ''}`} onClick={() => setView('map')}>
            {lang === 'ta' ? 'வரைபடம்' : 'Map'}
          </button>
          <button className={`view-btn ${view === 'list' ? 'view-btn-active' : ''}`} onClick={() => setView('list')}>
            {lang === 'ta' ? 'பட்டியல்' : 'List'}
          </button>
        </div>
      </div>

      {/* MAP VIEW */}
      {view === 'map' && (
        <>
          <div className="map-container">
            <Map
              reports={reports}
              setReports={setReports}
              setSelectedLocation={setSelectedLocation}
              setShowForm={setShowForm}
              lang={lang}
            />
            <div className="map-stats">
              <div className="map-stat">
                <span className="map-stat-num">{activeReports}</span>
                <span className="map-stat-label">{lang === 'ta' ? 'செயலில்' : 'Active'}</span>
              </div>
              <div className="map-stat-divider" />
              <div className="map-stat">
                <span className="map-stat-num">{reports.length}</span>
                <span className="map-stat-label">{t.reports}</span>
              </div>
            </div>
          </div>
          {!showForm && (
            <div className="bottom-bar">
              <button className="report-btn" onClick={() => setShowForm(true)}>
                {t.reportBtn}
              </button>
              {!/Mobi|Android/i.test(navigator.userAgent) && (
                <button className="qr-btn" onClick={() => setShowQR(true)}>📱</button>
              )}
            </div>
          )}
        </>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <>
          <div className="list-container">
            {reports.length === 0 ? (
              <div className="no-data">
                {lang === 'ta' ? 'இன்னும் புகார்கள் இல்லை' : 'No reports yet. Be the first to report!'}
              </div>
            ) : (
              reports.map((report, index) => (
                <div key={report.id} className="list-card" onClick={() => setSelectedReport(reports.find(r => r.id === report.id) || report)}>
                  <div className="list-rank">{index + 1}</div>
                  <div className="list-info">
                    <h3>{report.ward_name || 'Unknown Ward'}</h3>
                    <p className="list-meta">Ward #{report.ward_number || '?'} · {report.corporation || 'GCC'}</p>
                    {report.mla_constituency && (
                      <p className="list-meta">MLA: {report.mla_constituency}</p>
                    )}
                    {report.mp_constituency && (
                      <p className="list-meta">MP: {report.mp_constituency}</p>
                    )}
                    <p className="list-time">{timeAgo(report.created_at)}</p>
                  </div>
                  <div className="list-right">
                    <span className="list-severity" style={{
                      background: severityColors[report.severity]?.bg,
                      color: severityColors[report.severity]?.color
                    }}>
                      {severityColors[report.severity]?.label || report.severity}
                    </span>
                    {report.status === 'resolved' && (
                      <span className="list-resolved">✅ Resolved</span>
                    )}
                    {report.photo_url && (
                      <img src={report.photo_url} alt="Report" className="list-thumb" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="bottom-bar">
            <button className="report-btn" onClick={() => { setShowForm(true); setView('map') }}>
              {t.reportBtn}
            </button>
          </div>
        </>
      )}

      {/* REPORT DETAIL MODAL */}
      {selectedReport && (
        <div className="form-overlay" onClick={() => setSelectedReport(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>

            <div className="detail-header">
              <div className="detail-badges">
                <span className="detail-severity-badge" style={{
                  background: severityColors[selectedReport.severity]?.bg,
                  color: severityColors[selectedReport.severity]?.color
                }}>
                  {severityColors[selectedReport.severity]?.label}
                </span>
                <span className={`detail-status-badge ${selectedReport.status === 'resolved' ? 'status-resolved' : 'status-pending'}`}>
                  {selectedReport.status === 'resolved' ? '✅ Resolved' : '🔴 Unresolved'}
                </span>
              </div>
              <button className="close-btn" onClick={() => setSelectedReport(null)}>✕</button>
            </div>

            <h2 className="detail-ward-title">
              {selectedReport.ward_name || 'Unknown Ward'}
            </h2>
            <p className="detail-ward-sub">
              Ward #{selectedReport.ward_number || '?'} · {selectedReport.corporation || 'GCC'} · {timeAgo(selectedReport.created_at)}
            </p>

            {selectedReport.photo_url && (
              <div className="detail-photo-wrap">
                <img src={selectedReport.photo_url} alt="Garbage report" className="detail-photo" />
              </div>
            )}

            {selectedReport.verified_photo_url && (
              <div className="detail-photo-wrap" style={{marginTop:'8px'}}>
                <div style={{fontSize:'11px',color:'#16a34a',fontWeight:'600',marginBottom:'4px'}}>✅ VERIFIED CLEAN PHOTO</div>
                <img src={selectedReport.verified_photo_url} alt="Cleaned verification" className="detail-photo" />
              </div>
            )}

            <div className="detail-stats-row">
              <div className="detail-stat">
                <span className="detail-stat-num">1</span>
                <span className="detail-stat-label">Report</span>
              </div>
              <div className="detail-stat-divider" />
              <div className="detail-stat">
                <span className="detail-stat-num">
                  {Math.floor((new Date() - new Date(selectedReport.created_at)) / 86400000) || 0}
                </span>
                <span className="detail-stat-label">Days open</span>
              </div>
              <div className="detail-stat-divider" />
              <div className="detail-stat">
                <span className="detail-stat-num" style={{fontSize:'12px'}}>
                  {selectedReport.zone || 'GCC'}
                </span>
                <span className="detail-stat-label">Zone</span>
              </div>
            </div>

            <div className="detail-accountability">
              <p className="detail-section-title">ACCOUNTABILITY</p>
              <div className="detail-ward-badge">
                Your Ward · #{selectedReport.ward_number || '?'}
              </div>
              <div className="detail-politicians">
                <div className="detail-politician">
                  <div className="detail-politician-icon">👤</div>
                  <div className="detail-politician-info">
                    <span className="detail-politician-role">Councillor</span>
                    <span className="detail-politician-name">
                      {selectedReport.councillor_name || 'Vacant since 2019'}
                    </span>
                  </div>
                </div>
                <div className="detail-politician">
                  <div className="detail-politician-icon">🏛️</div>
                  <div className="detail-politician-info">
                    <span className="detail-politician-role">MLA · {selectedReport.mla_constituency || 'Unknown'}</span>
                    <span className="detail-politician-name">
                      {selectedReport.mla_name || 'Name pending'}
                    </span>
                  </div>
                </div>
                <div className="detail-politician">
                  <div className="detail-politician-icon">🇮🇳</div>
                  <div className="detail-politician-info">
                    <span className="detail-politician-role">MP · {selectedReport.mp_constituency || 'Unknown'}</span>
                    <span className="detail-politician-name">
                      {selectedReport.mp_name || 'Name pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className="detail-whatsapp-share-btn"
                onClick={() => shareOnWhatsApp(selectedReport)}
              >
                💚 {lang === 'ta' ? 'WhatsApp-ல் பகிரவும்' : 'Share on WhatsApp'}
              </button>

              {selectedReport.status === 'pending' && (
                <button className="detail-cleaned-btn" onClick={openCleanedModal}>
                  ✅ {lang === 'ta' ? 'சுத்தம் செய்யப்பட்டது — சரிபார்க்கவும்' : 'It is Cleaned Up — Verify'}
                </button>
              )}

              <a
                href="https://gccservices.chennaicorporation.gov.in/pgr/home"
                target="_blank"
                className="detail-complaint-btn"
              >
                📋 {lang === 'ta' ? 'GCC புகார் பதிவு செய்க' : 'File GCC Complaint Online'}
              </a>
              <div className="detail-action-row">
                <a href="tel:1913" className="detail-action-small">📞 Call 1913</a>
                <a href="https://wa.me/919445061913?text=Hi" target="_blank" className="detail-action-small">💬 WhatsApp GCC</a>
              </div>
            </div>

            <p className="detail-anonymous">🔒 All reports are anonymous</p>
          </div>
        </div>
      )}

      {/* MARK AS CLEANED MODAL */}
      {showCleanedModal && (
        <div className="form-overlay" onClick={() => setShowCleanedModal(false)}>
          <div className="form-container" onClick={e => e.stopPropagation()}>
            <div className="form-header">
              <h2>{lang === 'ta' ? '✅ சுத்தம் சரிபார்க்கவும்' : '✅ Verify Cleaned'}</h2>
              <button className="close-btn" onClick={() => setShowCleanedModal(false)}>✕</button>
            </div>

            {cleanedSuccess ? (
              <div className="success-message">
                {lang === 'ta'
                  ? '🎉 நன்றி! சிங்கார சென்னைக்கு உதவியதற்கு நன்றி!'
                  : '🎉 Thank you! Marked as cleaned.\nFor the Singara Chennai we grew up loving 💛'}
              </div>
            ) : (
              <>
                <p style={{fontSize:'14px', color:'#555', marginBottom:'16px', lineHeight:'1.5'}}>
                  {lang === 'ta'
                    ? 'சுத்தம் செய்யப்பட்ட இடத்தின் படம் எடுத்து பதிவேற்றவும்'
                    : 'Upload a photo showing the area is now clean.'}
                </p>
                <div className="photo-upload">
                  {cleanedPhotoPreview ? (
                    <div style={{position:'relative'}}>
                      <img src={cleanedPhotoPreview} alt="Clean preview" className="photo-preview" />
                      <button
                        onClick={() => { setCleanedPhoto(null); setCleanedPhotoPreview(null) }}
                        style={{position:'absolute',top:'8px',right:'8px',background:'rgba(0,0,0,0.5)',color:'#fff',border:'none',borderRadius:'50%',width:'24px',height:'24px',cursor:'pointer',fontSize:'12px'}}
                      >✕</button>
                    </div>
                  ) : (
                    <label className="upload-label">
                      <input type="file" accept="image/*" capture="environment" onChange={handleCleanedPhoto} style={{display:'none'}} />
                      <div className="upload-placeholder">
                        <span className="upload-icon">📷</span>
                        <span className="upload-text">{lang === 'ta' ? 'சுத்தமான இடத்தின் படம் எடுக்கவும்' : 'Take photo of clean area'}</span>
                        <span className="upload-sub">{lang === 'ta' ? 'புகைப்படம் அல்லது கேலரி' : 'Camera or gallery'}</span>
                      </div>
                    </label>
                  )}
                </div>
                <button
                  className="submit-btn"
                  onClick={submitCleaned}
                  disabled={cleanedLoading || !cleanedPhoto}
                  style={{
                    opacity: cleanedLoading || !cleanedPhoto ? 0.45 : 1,
                    cursor: cleanedLoading || !cleanedPhoto ? 'not-allowed' : 'pointer',
                    background: '#16a34a'
                  }}
                >
                  {cleanedLoading
                    ? (lang === 'ta' ? 'சமர்ப்பிக்கிறது...' : 'Submitting...')
                    : (lang === 'ta' ? '✅ சுத்தம் உறுதிப்படுத்து' : '✅ Confirm Cleaned')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report Form */}
      {showForm && (
        <ReportForm
          selectedLocation={selectedLocation}
          setShowForm={setShowForm}
          setReports={setReports}
          reports={reports}
          lang={lang}
        />
      )}

      {/* QR Modal — desktop only */}
      {showQR && (
        <div className="form-overlay" onClick={() => setShowQR(false)}>
          <div className="qr-modal" onClick={e => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>Report from your phone</h3>
              <button className="close-btn" onClick={() => setShowQR(false)}>✕</button>
            </div>
            <p className="qr-modal-sub">Scan to open Namma Kuppai on your phone and report garbage with a live photo.</p>
            <div className="qr-code-box">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://nammakuppai.in"
                alt="QR Code"
                width="180"
                height="180"
              />
            </div>
            <p className="qr-domain">nammakuppai.in</p>
          </div>
        </div>
      )}

      {/* WELCOME POPUP */}
      {showWelcome && (
  <div className="form-overlay" onClick={closeWelcome} style={{alignItems:'center', justifyContent:'center', display:'flex'}}>
          <div className="welcome-modal" onClick={e => e.stopPropagation()}>

            <div style={{textAlign:'center', marginBottom:'20px'}}>
              <div style={{fontSize:'36px', marginBottom:'8px'}}>🏛️</div>
              <div style={{fontSize:'22px', fontWeight:'800', color:'#C41E3A', margin:'0 0 4px'}}>
                Namma Kuppai
              </div>
              <p style={{fontSize:'13px', color:'#888', margin:'0'}}>
                For the Singara Chennai we grew up loving 💛
              </p>
            </div>

            <div style={{background:'#f0fdf4', borderRadius:'12px', padding:'16px', marginBottom:'12px', border:'1px solid #bbf7d0'}}>
              <p style={{fontSize:'13px', color:'#15803d', margin:'0 0 10px', fontWeight:'700'}}>✅ Live Now</p>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <span style={{width:'10px', height:'10px', background:'#16a34a', borderRadius:'50%', flexShrink:0}}></span>
                <div>
                  <div style={{fontSize:'14px', color:'#166534', fontWeight:'600'}}>GCC — Greater Chennai</div>
                  <div style={{fontSize:'12px', color:'#15803d'}}>200 wards covered</div>
                </div>
              </div>
            </div>

            <div style={{background:'#fff7ed', borderRadius:'12px', padding:'16px', marginBottom:'20px', border:'1px solid #fed7aa'}}>
              <p style={{fontSize:'13px', color:'#c2410c', margin:'0 0 10px', fontWeight:'700'}}>🔜 Coming Soon</p>
              <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                <span style={{width:'10px', height:'10px', background:'#f97316', borderRadius:'50%', flexShrink:0}}></span>
                <div>
                  <div style={{fontSize:'14px', color:'#7c2d12', fontWeight:'600'}}>Avadi Corporation</div>
                  <div style={{fontSize:'12px', color:'#9a3412'}}>45 wards</div>
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <span style={{width:'10px', height:'10px', background:'#f97316', borderRadius:'50%', flexShrink:0}}></span>
                <div>
                  <div style={{fontSize:'14px', color:'#7c2d12', fontWeight:'600'}}>Tambaram Corporation</div>
                  <div style={{fontSize:'12px', color:'#9a3412'}}>49 wards</div>
                </div>
              </div>
            </div>

            <button
              onClick={closeWelcome}
              style={{
                width:'100%',
                padding:'14px',
                background:'#C41E3A',
                color:'white',
                border:'none',
                borderRadius:'12px',
                fontSize:'15px',
                fontWeight:'700',
                cursor:'pointer',
              }}
            >
              {lang === 'ta' ? 'தொடங்குவோம் →' : "Let's Go →"}
            </button>

            <p style={{textAlign:'center', fontSize:'11px', color:'#aaa', marginTop:'12px', marginBottom:'0'}}>
              Tap anywhere to dismiss
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <div className="footer-corps">
          <span style={{fontSize:'8px',color:'#555'}}>Covering:</span>
          <span className="corp-tag">GCC</span>
          <span className="corp-tag">Avadi</span>
          <span className="corp-tag">Tambaram</span>
        </div>
        <span className="footer-meta">Data: April 2026</span>
        <span className="footer-domain">nammakuppai.in</span>
      </div>

    </div>
  )
}

export default Home