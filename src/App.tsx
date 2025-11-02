import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/dashboard/Home';
import Institutions from './pages/dashboard/Institutions';
import Teams from './pages/dashboard/Teams';
import Adjudicators from './pages/dashboard/Adjudicators';
import Rooms from './pages/dashboard/Rooms';
import Tournaments from './pages/dashboard/Tournaments';
import Rounds from './pages/dashboard/Rounds';
import Standings from './pages/dashboard/Standings';
import PublicDraw from './pages/participant/PublicDraw';
import AdjudicatorDebate from './pages/participant/AdjudicatorDebate';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/team/:teamId" element={<PublicDraw />} />
          <Route path="/adjudicator/:adjudicatorId" element={<AdjudicatorDebate />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="institutions" element={<Institutions />} />
            <Route path="teams" element={<Teams />} />
            <Route path="adjudicators" element={<Adjudicators />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="rounds" element={<Rounds />} />
            <Route path="standings" element={<Standings />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
