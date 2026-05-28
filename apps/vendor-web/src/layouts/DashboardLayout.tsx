import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, CalendarDays, User, BarChart2, Bell, LogOut, Settings, Inbox, Star, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Bookings', icon: Calendar, to: '/bookings' },
  { label: 'Leads', icon: Inbox, to: '/leads' },
  { label: 'Calendar', icon: CalendarDays, to: '/calendar' },
  { label: 'Reviews', icon: Star, to: '/reviews' },
  { label: 'Payouts', icon: Wallet, to: '/payouts' },
  { label: 'Analytics', icon: BarChart2, to: '/analytics' },
  { label: 'Settings', icon: Settings, to: '/settings' },
  { label: 'My Profile', icon: User, to: '/profile' },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold">V</span>
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">Vendor OS</div>
              <div className="text-xs text-gray-400">Wedding OS</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon size={18} /> {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-brand-700 text-xs font-bold">{user?.phone?.slice(-2) || 'VN'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user?.phone || 'Vendor'}</div>
              <div className="text-xs text-gray-400">Vendor Account</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
