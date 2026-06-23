import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import NavBar from './components/NavBar'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import OnboardingPage from './pages/OnboardingPage'
import SessionPage from './pages/SessionPage'
import AdminVideosPage from './pages/AdminVideosPage'
import AdminLibraryPage from './pages/AdminLibraryPage'
import AdminProgrammeBuilderPage from './pages/AdminProgrammeBuilderPage'
import AdminPage from './pages/AdminPage'
import ProgressPage from './pages/ProgressPage'
import LibraryPage from './pages/LibraryPage'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
      <p className="font-sans text-gray-500">Loading…</p>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading, assessmentCompleted, assessmentLoading } = useAuth()
  const location = useLocation()

  if (loading || assessmentLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  // If assessment not done and not already going to onboarding, redirect there
  if (assessmentCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!profile?.is_admin) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session/:id"
          element={
            <ProtectedRoute>
              <SessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <LibraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/videos"
          element={
            <AdminRoute>
              <AdminVideosPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/library"
          element={
            <AdminRoute>
              <AdminLibraryPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/builder"
          element={
            <ProtectedRoute>
              <AdminProgrammeBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
