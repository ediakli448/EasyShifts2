import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Stethoscope } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
        navigate(user.role === Role.ADMIN ? '/admin' : '/worker/constraints');
    }
  }, [user, navigate]);

  const handleLogin = async (role: Role) => {
    await login(role);
    // Navigation happens in effect
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
        <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">EasyShifts</h1>
        <p className="text-slate-500 mb-8">Sign in to manage clinic schedules</p>

        <div className="space-y-4">
          <Button 
            onClick={() => handleLogin(Role.ADMIN)} 
            className="w-full justify-center h-12 text-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Demo: Sign in as Admin'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or</span>
            </div>
          </div>

          <Button 
            onClick={() => handleLogin(Role.WORKER)} 
            variant="outline" 
            className="w-full justify-center h-12 text-lg"
            disabled={isLoading}
          >
            Demo: Sign in as Worker
          </Button>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Simulation Mode. In production this would use Google OAuth 2.0.
        </p>
      </div>
    </div>
  );
};