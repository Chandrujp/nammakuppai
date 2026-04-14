import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Board from './pages/Board'
import './App.css'

function App() {
  const [lang, setLang] = useState('ta')

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home lang={lang} setLang={setLang} />} />
        <Route path="/board" element={<Board lang={lang} setLang={setLang} />} />
      </Routes>
    </Router>
  )
}

export default App