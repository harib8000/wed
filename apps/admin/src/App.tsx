import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Vendors } from './pages/Vendors';
import { Bookings, Users, Payments } from './pages/Bookings';
import { Disputes } from './pages/Disputes';
import { Reports } from './pages/Reports';
import Cookies from 'js-cookie';

function Protect({ children }: { children: React.ReactNode }) {
  const token = Cookies.get('admin_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protect><AdminLayout /></Protect>}>
        <Route index element={<Dashboard />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="users" element={<Users />} />
        <Route path="payments" element={<Payments />} />
        <Route path="disputes" element={<Disputes />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
