import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { BookingsPage } from './pages/BookingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LeadsPage } from './pages/LeadsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { PayoutsPage } from './pages/PayoutsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || (user && user.role !== 'vendor')) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="payouts" element={<PayoutsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
