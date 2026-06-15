import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentSetup from './pages/StudentSetup'
import Dashboard from './pages/Dashboard'
import Diagnose from './pages/Diagnose'
import Practice from './pages/Practice'
import Tutor from './pages/Tutor'
import ParentHome from './pages/parent/ParentHome'
import TeacherHome from './pages/teacher/TeacherHome'
import TeacherClasses from './pages/teacher/TeacherClasses'
import TeacherStudents from './pages/teacher/TeacherStudents'
import InstitutionHome from './pages/institution/InstitutionHome'
import InstitutionTeachers from './pages/institution/InstitutionTeachers'
import InstitutionClasses from './pages/institution/InstitutionClasses'
import PlatformHome from './pages/platform/PlatformHome'
import PlatformTenants from './pages/platform/PlatformTenants'
import PlatformDomains from './pages/platform/PlatformDomains'
import RequireAuth from './components/RequireAuth'
import RequireRole from './components/RequireRole'
import GuestOnly from './components/GuestOnly'
import AppLayout from './components/AppLayout'
import './App.css'

function AppRoutes() {
  const loc = useLocation()
  const isWide = ['/', '/login', '/register'].includes(loc.pathname)

  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className={isWide ? 'main main-wide' : 'main'}>
            <Landing />
          </main>
        }
      />
      <Route element={<GuestOnly />}>
        <Route
          path="/login"
          element={
            <main className="main main-wide">
              <Login />
            </main>
          }
        />
        <Route
          path="/register"
          element={
            <main className="main main-wide">
              <Register />
            </main>
          }
        />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route element={<RequireRole roles={['parent']} />}>
            <Route path="/parent" element={<ParentHome />} />
            <Route path="/parent/children" element={<StudentSetup />} />
            <Route path="/parent/dashboard" element={<Dashboard />} />
            <Route path="/parent/diagnose" element={<Diagnose />} />
            <Route path="/parent/practice" element={<Practice />} />
            <Route path="/parent/tutor/:questionId" element={<Tutor />} />
          </Route>

          <Route element={<RequireRole roles={['teacher']} />}>
            <Route path="/teacher" element={<TeacherHome />} />
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/students" element={<TeacherStudents />} />
          </Route>

          <Route element={<RequireRole roles={['institution']} />}>
            <Route path="/institution" element={<InstitutionHome />} />
            <Route path="/institution/teachers" element={<InstitutionTeachers />} />
            <Route path="/institution/classes" element={<InstitutionClasses />} />
          </Route>

          <Route element={<RequireRole roles={['platform']} />}>
            <Route path="/platform" element={<PlatformHome />} />
            <Route path="/platform/tenants" element={<PlatformTenants />} />
            <Route path="/platform/domains" element={<PlatformDomains />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
