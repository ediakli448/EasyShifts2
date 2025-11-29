import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  CheckSquare, 
  LogOut, 
  Menu,
  RefreshCw,
  Activity
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = user?.role === Role.ADMIN 
    ? [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/schedule', label: 'Schedule Builder', icon: CalendarDays },
        { to: '/admin/swaps', label: 'Swap Requests', icon: RefreshCw },
        { to: '/admin/users', label: 'Staff', icon: Users },
        { to: '/admin/diagnostics', label: 'Diagnostics (A/B)', icon: Activity },
      ]
    : [
        { to: '/worker/constraints', label: 'My Availability', icon: CheckSquare },
        { to: '/schedule/current', label: 'View Schedule', icon: CalendarDays },
        { to: '/worker/swaps', label: 'Swap Market', icon: RefreshCw },
        { to: '/worker/stats', label: 'My Stats', icon: LayoutDashboard },
      ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:h-screen
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
             <span className="text-white font-bold text-sm">ES</span>
          </div>
          <span className="text-xl font-bold text-slate-800">EasyShifts</span>
        </div>

        <div className="p-4">
          <div className="flex items-center p-3 bg-slate-50 rounded-lg mb-6">
            <img src={user?.photoUrl} alt={user?.name} className="w-10 h-10 rounded-full mr-3" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <div className="flex items-center text-xs text-slate-500">
                  <span className="capitalize">{user?.role.toLowerCase()}</span>
                  <span className="mx-1">•</span>
                  <span className={`${user?.abGroup === 'B_CANARY' ? 'text-amber-600' : 'text-blue-600'} font-medium`}>
                      {user?.abGroup === 'B_CANARY' ? 'Beta' : 'Stable'}
                  </span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
         <button onClick={() => setIsMobileMenuOpen(true)}>
           <Menu className="w-6 h-6 text-slate-600" />
         </button>
         <span className="font-bold text-slate-800">EasyShifts</span>
         <div className="w-6" /> 
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
};