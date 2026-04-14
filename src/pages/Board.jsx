import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function Board({ lang, setLang }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [groupedData, setGroupedData] = useState([])
  const [corpFilter, setCorpFilter] = useState('all')

  const t = {
    title: lang === 'ta' ? 'பொறுப்பு பலகை' : 'Responsibility Board',
    subtitle: lang === 'ta' ? 'புகார்களால் தரவரிசை' : 'Ranked by garbage reports',
    back: lang === 'ta' ? '← வரைபடம்' : '← Back to Map',
    councillor: lang === 'ta' ? 'கவுன்சிலர்' : 'Councillor',
    mla: lang === 'ta' ? 'எம்எல்ஏ' : 'MLA',
    mp: lang === 'ta' ? 'எம்பி' : 'MP',
    reports: lang === 'ta' ? 'புகார்கள்' : 'reports',
    noData: lang === 'ta' ? 'இன்னும் புகார்கள் இல்லை. முதலில் புகாரளியுங்கள்!' : 'No reports yet. Be the first to report!',
    allCorps: lang === 'ta' ? 'அனைத்து கார்ப்' : 'All Corps',
  }

  useEffect(() => { fetchReports() }, [corpFilter])

  async function fetchReports() {
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (corpFilter !== 'all') query = query.eq('corporation', corpFilter)

    const { data, error } = await query
    if (error) {
      console.error('Error:', error)
    } else {
      setReports(data)
      groupByWard(data)
    }
    setLoading(false)
  }

  function groupByWard(data) {
    const grouped = {}
    data.forEach(report => {
      const ward = report.ward_name || 'Unknown Ward'
      if (!grouped[ward]) {
        grouped[ward] = {
          ward_name: ward,
          ward_number: report.ward_number,
          corporation: report.corporation,
          councillor_name: report.councillor_name,
          mla_name: report.mla_name,
          mla_constituency: report.mla_constituency,
          mp_name: report.mp_name,
          mp_constituency: report.mp_constituency,
          count: 0,
          critical: 0,
          severe: 0,
        }
      }
      grouped[ward].count++
      if (report.severity === 'critical') grouped[ward].critical++
      if (report.severity === 'severe') grouped[ward].severe++
    })
    const sorted = Object.values(grouped).sort((a, b) => b.count - a.count)
    setGroupedData(sorted)
  }

  function getSeverityBadge(ward) {
    if (ward.critical > 0) return <span style={{background:'#f5f5f5',color:'#1a1a2e',fontSize:'9px',padding:'2px 6px',borderRadius:'4px',border:'0.5px solid #1a1a2e',marginLeft:'6px'}}>⚫ {ward.critical} Critical</span>
    if (ward.severe > 0) return <span style={{background:'#fff5f5',color:'#C41E3A',fontSize:'9px',padding:'2px 6px',borderRadius:'4px',border:'0.5px solid #C41E3A',marginLeft:'6px'}}>🔴 {ward.severe} Severe</span>
    return null
  }

  return (
    <div className="board-container">
      {/* Header */}
      <div className="board-header">
        <a href="/" className="back-btn">{t.back}</a>
        <h1>{t.title}</h1>
        <button
          className="lang-toggle"
          onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
          style={{background:'transparent',color:'#FFD700',border:'0.5px solid #444',padding:'5px 10px',borderRadius:'20px',fontSize:'11px',cursor:'pointer'}}
        >
          {lang === 'ta' ? 'EN' : 'தமிழ்'}
        </button>
      </div>

      {/* Subtitle */}
      <div style={{background:'#111827',padding:'6px 16px',textAlign:'center'}}>
        <span style={{fontSize:'11px',color:'#888'}}>{t.subtitle}</span>
      </div>

      {/* Filters */}
      <div className="board-filters">
        <select
          className="filter-select"
          value={corpFilter}
          onChange={e => setCorpFilter(e.target.value)}
        >
          <option value="all">{t.allCorps}</option>
          <option value="GCC">GCC</option>
          <option value="Avadi">Avadi</option>
          <option value="Tambaram">Tambaram</option>
        </select>
        <span style={{marginLeft:'auto',fontSize:'12px',color:'#C41E3A',fontWeight:'700'}}>
          {groupedData.length} {lang === 'ta' ? 'வார்டுகள்' : 'wards'}
        </span>
      </div>

      {/* Board List */}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="board-list">
          {groupedData.length === 0 ? (
            <div className="no-data">{t.noData}</div>
          ) : (
            groupedData.map((ward, index) => (
              <div key={index} className="ward-card">
                <div className="ward-rank">#{index + 1}</div>
                <div className="ward-info">
                  <h3>
                    {ward.ward_name}
                    {getSeverityBadge(ward)}
                  </h3>
                  <p>🏛️ {t.councillor}: {ward.councillor_name || '—'}</p>
                  <p>🗳️ {t.mla}: {ward.mla_name || '—'} {ward.mla_constituency ? `— ${ward.mla_constituency}` : ''}</p>
                  <p>🏟️ {t.mp}: {ward.mp_name || '—'}</p>
                  {ward.corporation && (
                    <span className="corp-badge">{ward.corporation}</span>
                  )}
                </div>
                <div className="ward-count">
                  <span className="count-number">{ward.count}</span>
                  <span className="count-label">{t.reports}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <div className="footer-corps">
          <span style={{fontSize:'9px',color:'#555'}}>Covering:</span>
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

export default Board