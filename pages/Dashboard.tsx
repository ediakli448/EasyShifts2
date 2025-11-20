import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, AlertCircle, CalendarCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const stats = [
    { name: 'Vets', submitted: 85, total: 100 },
    { name: 'Assistants', submitted: 60, total: 100 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500">Overview for October Cycle A</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-700">Pending Constraints</h3>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">3</p>
          <p className="text-sm text-slate-500 mt-1">Workers haven't submitted yet</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-700">Unassigned Shifts</h3>
            <CalendarCheck className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">12</p>
          <p className="text-sm text-slate-500 mt-1">Open slots requiring staff</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-700">Swap Requests</h3>
            <Users className="w-5 h-5 text-secondary-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">1</p>
          <p className="text-sm text-slate-500 mt-1">Requires admin approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">Constraints Submission %</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="submitted" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-8 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">October Schedule Draft</h3>
            <p className="text-primary-100 mb-6">
              Deadline passed. 85% of shifts are covered. Review auto-assignments before publishing.
            </p>
          </div>
          <Link to="/admin/schedule">
            <button className="flex items-center bg-white text-primary-700 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors">
              Go to Schedule Builder
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
