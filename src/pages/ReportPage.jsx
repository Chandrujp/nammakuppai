import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../App.css'

function ReportPage({ lang, setLang }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const severityColors = {
    minor:    { bg: '#fffbeb', color: '#f59e0b', label: 'Minor' },
    moderate: { bg: '#fff7ed', color: '#f97316', label: 'Moderate' },
    severe:   { bg: '#fff5f5', color: '#C41E3A', label: 'Severe' },
    critical: { bg: '#1a1a2e', color: '#fff',    label: 'Critical' },
  }

  useEffect(() => {
    async function fetchReport() {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single()
      if (error || !data) {
        setNotFound(true)
      } else {
        setReport(data)
      }
      setLoading(false)
    }
    fetchReport()
  }, [id])

  function shareOnWhatsApp() {
    const ward = report.ward_name || 'Unknown Ward'
    const wardNum = report.ward_number ? `#${report.ward_number}` : ''
    const severity = severityColors[report.severity]?.label || report.severity
    const isResolved = report.status === 'resolved'
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`
    const reportLink = `https://nammakuppai.in/report/${report.id}`
    const message = isResolved
      ? `✅ Garbage CLEANED at ${ward} ${wardNum}\n\nThis issue has been resolved.\n\n📍 Location: ${mapsLink}\n🔗 View report: ${reportLink}\n\nFor the Singara Chennai we grew up loving 💛`
      : `🚨 Garbage at ${ward} ${wardNum}\n\nSeverity: ${severity}\nCouncillor: ${report.councillor_name || '—'}\nMLA: ${report.mla_name || '—'} (${report.mla_constituency || '—'})\nMP: ${report.mp_name || '—'}\n\n📍 Navigate: ${mapsLink}\n🔗 View report: ${reportLink}\n\nReport more → nammakuppai.in\nFor the Singara Chennai we grew up loving 💛`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  function timeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr + 'Z')
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  if (loading) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'12px'}}>
      <div style={{fontSize:'32px'}}>🏛️</div>
      <div style={{fontSize:'14px', color:'#999'}}>Loading report...</div>
    </div>
  )

  if (notFound) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:'16px', padding:'24px', textAlign:'center'}}>
      <div style={{fontSize:'40px'}}>🔍</div>
      <div style={{fontSize:'18px', fontWeight:'800', color:'#C41E3A'}}>Report not found</div>
      <div style={{fontSize:'13px', color:'#999'}}>This report may have been removed.</div>
      <button onClick={() => navigate('/')} style={{background:'#C41E3A', color:'white', border:'none', borderRadius:'12px', padding:'12px 24px', fontSize:'14px', fontWeight:'700', cursor:'pointer', marginTop:'8px'}}>
        View all reports →
      </button>
    </div>
  )

  const sev = severityColors[report.severity] || severityColors.moderate

  return (
    <div style={{fontFamily:'-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', background:'#f8f8f8', minHeight:'100vh'}}>

      {/* Header */}
      <div style={{background:'white', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'0.5px solid #f0f0f0', position:'sticky', top:0, zIndex:100}}>
        <button onClick={() => navigate('/')} style={{background:'none', border:'none', color:'#C41E3A', fontSize:'13px', fontWeight:'700', cursor:'pointer', padding:0}}>
          ← நம்ம குப்பை
        </button>
        <span style={{fontSize:'11px', color:'#999'}}>Report #{report.ward_number}</span>
      </div>

      <div style={{padding:'16px', maxWidth:'480px', margin:'0 auto'}}>

        {/* Status + Severity */}
        <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
          <span style={{background:sev.bg, color:sev.color, fontSize:'11px', fontWeight:'700', padding:'4px 10px', borderRadius:'20px'}}>
            {sev.label}
          </span>
          <span style={{background: report.status === 'resolved' ? '#f0fff0' : '#fff0f0', color: report.status === 'resolved' ? '#2e7d32' : '#C41E3A', fontSize:'11px', fontWeight:'600', padding:'4px 10px', borderRadius:'20px'}}>
            {report.status === 'resolved' ? '✅ Resolved' : '🔴 Unresolved'}
          </span>
        </div>

        {/* Ward title */}
        <h1 style={{fontSize:'24px', fontWeight:'800', color:'#1a1a2e', margin:'0 0 4px'}}>
          {report.ward_name || 'Unknown Ward'}
        </h1>
        <p style={{fontSize:'12px', color:'#999', margin:'0 0 16px'}}>
          Ward #{report.ward_number} · {report.corporation || 'GCC'} · {timeAgo(report.created_at)}
        </p>

        {/* Photo */}
        {report.photo_url && (
          <div style={{borderRadius:'12px', overflow:'hidden', marginBottom:'16px'}}>
            <img src={report.photo_url} alt="Garbage report" style={{width:'100%', maxHeight:'260px', objectFit:'cover', display:'block'}} />
          </div>
        )}

        {/* Verified clean photo */}
        {report.verified_photo_url && (
          <div style={{borderRadius:'12px', overflow:'hidden', marginBottom:'16px'}}>
            <div style={{fontSize:'11px', color:'#16a34a', fontWeight:'600', marginBottom:'4px'}}>✅ VERIFIED CLEAN PHOTO</div>
            <img src={report.verified_photo_url} alt="Cleaned" style={{width:'100%', maxHeight:'220px', objectFit:'cover', display:'block', borderRadius:'12px'}} />
          </div>
        )}

        {/* Stats */}
        <div style={{background:'white', borderRadius:'12px', padding:'12px', display:'flex', gap:'12px', alignItems:'center', marginBottom:'16px', border:'0.5px solid #f0f0f0'}}>
          <div style={{flex:1, textAlign:'center'}}>
            <div style={{fontSize:'20px', fontWeight:'800', color:'#C41E3A'}}>1</div>
            <div style={{fontSize:'10px', color:'#999'}}>Report</div>
          </div>
          <div style={{width:'0.5px', height:'30px', background:'#eee'}}></div>
          <div style={{flex:1, textAlign:'center'}}>
            <div style={{fontSize:'20px', fontWeight:'800', color:'#C41E3A'}}>
              {Math.floor((new Date() - new Date(report.created_at)) / 86400000) || 0}
            </div>
            <div style={{fontSize:'10px', color:'#999'}}>Days open</div>
          </div>
          <div style={{width:'0.5px', height:'30px', background:'#eee'}}></div>
          <div style={{flex:1, textAlign:'center'}}>
            <div style={{fontSize:'13px', fontWeight:'700', color:'#C41E3A'}}>{report.zone || 'GCC'}</div>
            <div style={{fontSize:'10px', color:'#999'}}>Zone</div>
          </div>
        </div>

        {/* Accountability */}
        <div style={{background:'white', borderRadius:'12px', padding:'14px', marginBottom:'16px', border:'0.5px solid #f0f0f0'}}>
          <p style={{fontSize:'10px', fontWeight:'700', color:'#999', letterSpacing:'1px', margin:'0 0 10px'}}>ACCOUNTABILITY</p>
          <div style={{display:'inline-block', background:'#fff5f5', border:'1px solid #f5c0c0', color:'#C41E3A', fontSize:'11px', fontWeight:'700', padding:'4px 12px', borderRadius:'20px', marginBottom:'12px'}}>
            Your Ward · #{report.ward_number}
          </div>
          {[
            { icon: '👤', role: 'Councillor', name: report.councillor_name || 'Data pending' },
            { icon: '🏛️', role: `MLA · ${report.mla_constituency || ''}`, name: report.mla_name || 'Name pending' },
            { icon: '🇮🇳', role: `MP · ${report.mp_constituency || ''}`, name: report.mp_name || 'Name pending' },
          ].map((p, i) => (
            <div key={i} style={{display:'flex', alignItems:'center', gap:'10px', background:'#f9f9f9', borderRadius:'10px', padding:'10px 12px', marginBottom:'8px'}}>
              <span style={{fontSize:'20px'}}>{p.icon}</span>
              <div>
                <div style={{fontSize:'10px', color:'#999'}}>{p.role}</div>
                <div style={{fontSize:'13px', fontWeight:'700', color:'#1a1a2e'}}>{p.name}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px'}}>
          <button onClick={shareOnWhatsApp} style={{width:'100%', padding:'14px', background:'#25D366', color:'white', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'600', cursor:'pointer'}}>
            💚 {lang === 'ta' ? 'WhatsApp-ல் பகிரவும்' : 'Share on WhatsApp'}
          </button>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
            target="_blank"
            style={{width:'100%', padding:'14px', background:'#1a1a2e', color:'#FFD700', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', textAlign:'center', textDecoration:'none', display:'block', boxSizing:'border-box'}}
          >
            📍 {lang === 'ta' ? 'Google Maps-ல் பார்க்க' : 'Navigate on Google Maps'}
          </a>
          <a
            href="https://gccservices.chennaicorporation.gov.in/pgr/home"
            target="_blank"
            style={{width:'100%', padding:'14px', background:'white', color:'#1a1a2e', border:'0.5px solid #e8e8e8', borderRadius:'12px', fontSize:'14px', fontWeight:'600', cursor:'pointer', textAlign:'center', textDecoration:'none', display:'block', boxSizing:'border-box'}}
          >
            📋 {lang === 'ta' ? 'GCC புகார் பதிவு செய்க' : 'File GCC Complaint Online'}
          </a>
          <div style={{display:'flex', gap:'8px'}}>
            <a href="tel:1913" style={{flex:1, background:'#f9f9f9', border:'0.5px solid #e8e8e8', color:'#1a1a2e', textAlign:'center', padding:'10px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', textDecoration:'none'}}>📞 Call 1913</a>
            <a href="https://wa.me/919445061913?text=Hi" target="_blank" style={{flex:1, background:'#f9f9f9', border:'0.5px solid #e8e8e8', color:'#1a1a2e', textAlign:'center', padding:'10px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', textDecoration:'none'}}>💬 WhatsApp GCC</a>
          </div>
        </div>

        <p style={{textAlign:'center', fontSize:'11px', color:'#999', marginBottom:'32px'}}>🔒 All reports are anonymous</p>

        <button onClick={() => navigate('/')} style={{width:'100%', padding:'13px', background:'#C41E3A', color:'white', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:'pointer', marginBottom:'32px'}}>
          {lang === 'ta' ? 'மேலும் புகார்களை பார்க்க →' : 'View all reports →'}
        </button>

      </div>
    </div>
  )
}

export default ReportPage