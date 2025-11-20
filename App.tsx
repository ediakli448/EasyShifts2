import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ScheduleBuilder } from './pages/ScheduleBuilder';
import { Constraints } from './pages/Constraints';
import { Swaps } from './pages/Swaps';
import { Role } from './types';

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === Role.ADMIN ? '/admin' : '/worker/constraints'} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      <Route element={<Layout />}>
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={[Role.ADMIN]}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/schedule" element={
          <ProtectedRoute allowedRoles={[Role.ADMIN]}>
            <ScheduleBuilder />
          </ProtectedRoute>
        } />
        <Route path="/admin/swaps" element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <Swaps />
            </ProtectedRoute>
        } />

        {/* Worker Routes */}
        <Route path="/worker/constraints" element={
          <ProtectedRoute allowedRoles={[Role.WORKER]}>
            <Constraints />
          </ProtectedRoute>
        } />
        <Route path="/worker/swaps" element={
            <ProtectedRoute allowedRoles={[Role.WORKER]}>
              <Swaps />
            </ProtectedRoute>
        } />
        <Route path="/schedule/current" element={
             <ProtectedRoute allowedRoles={[Role.WORKER, Role.ADMIN]}>
                 {/* Reusing ScheduleBuilder in read-only mode conceptually, but typically a simpler view. 
                     For demo, pointing to a placeholder or reuse builder with disabled controls. 
                     Let's just redirect workers to constraints for now or reuse Swaps as a placeholder
                 */}
                 <div className="p-8 text-center text-slate-500">Published Schedule View (Read-Only) would go here.</div>
             </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}