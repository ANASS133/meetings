import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ToastContainer from './components/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MeetingsList from './pages/MeetingsList';
import CreateMeeting from './pages/CreateMeeting';
import MeetingDetail from './pages/MeetingDetail';
import EditMeeting from './pages/EditMeeting';
import CalendarView from './pages/CalendarView';
import HistoriqueList from './pages/HistoriqueList';
import HistoriqueDetail from './pages/HistoriqueDetail';

import LiveMeetingDashboard from './pages/LiveMeetingDashboard';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <ToastContainer />
          <main className="main-content">
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected — any authenticated user */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/meetings" element={<PrivateRoute><MeetingsList /></PrivateRoute>} />
              <Route path="/meetings/new" element={<PrivateRoute><CreateMeeting /></PrivateRoute>} />
              <Route path="/meetings/:id" element={<PrivateRoute><MeetingDetail /></PrivateRoute>} />
              <Route path="/meetings/:id/edit" element={<PrivateRoute><EditMeeting /></PrivateRoute>} />
              <Route path="/meetings/:id/live" element={<PrivateRoute><LiveMeetingDashboard /></PrivateRoute>} />
              <Route path="/calendar" element={<PrivateRoute><CalendarView /></PrivateRoute>} />
              <Route path="/historique" element={<PrivateRoute><HistoriqueList /></PrivateRoute>} />
              <Route path="/historique/:id" element={<PrivateRoute><HistoriqueDetail /></PrivateRoute>} />



              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
