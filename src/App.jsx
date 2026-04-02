import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Nav from './components/Nav'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import BrowseChefsPage from './pages/BrowseChefsPage'
import BookingPage from './pages/BookingPage'
import ChefSignup from './pages/ChefSignup'
import ChefDashboard from './pages/ChefDashboard'
import ClientDashboard from './pages/ClientDashboard'
import AdminDashboard from './pages/AdminDashboard'

// Smart dashboard router — shows the right dashboard per role
function Dashboard({ go }) {
  const { isChef, isAdmin } = useAuth()
  if (isChef || isAdmin) return <ChefDashboard go={go} />
  return <ClientDashboard go={go} />
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const go = (path) => { navigate(path); window.scrollTo(0, 0) }

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      <Nav currentPath={location.pathname} go={go} />
      <Routes>
        <Route path="/" element={<HomePage go={go} />} />
        <Route path="/chefs" element={<BrowseChefsPage />} />
        <Route path="/book" element={<BookingPage go={go} />} />
        <Route path="/join" element={<ChefSignup go={go} />} />
        <Route path="/dashboard" element={<Dashboard go={go} />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      <Footer go={go} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
