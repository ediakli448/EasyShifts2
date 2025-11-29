import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ScheduleBuilder } from './pages/ScheduleBuilder';
import { Constraints } from './pages/Constraints';
import { Swaps } from './pages/Swaps';
import { Diagnostics } from './pages/Diagnostics';
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
        <Route path="/admin/diagnostics" element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <Diagnostics />
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
                 <div className="p-8 text-center text-slate-500">Published Schedule View (Read-Only)</div>
             </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}