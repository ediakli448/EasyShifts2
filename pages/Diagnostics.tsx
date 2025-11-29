import React, { useEffect, useState } from 'react';
import { monitor } from '../services/monitoring';
import { LogEntry } from '../types';
import { Button } from '../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, Activity, RefreshCw, Terminal } from 'lucide-react';

export const Diagnostics: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);

  const refresh = () => {
    setLogs(monitor.getLogs());
    setStats(monitor.getStats());
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000); // Live update
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div>Loading diagnostics...</div>;

  const chartData = [
    { 
      name: 'Stable (A)', 
      Errors: stats.groupA.errors, 
      Success: stats.groupA.total - stats.groupA.errors 
    },
    { 
      name: 'Canary (B)', 
      Errors: stats.groupB.errors, 
      Success: stats.groupB.total - stats.groupB.errors 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">System Diagnostics & A/B Testing</h1>
            <p className="text-slate-500">Real-time error discovery and experiment monitoring</p>
        </div>
        <Button onClick={refresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* A/B Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Group A: Stable</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-slate-900">{stats.groupA.total}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Requests</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-green-600">{stats.groupA.avgLatency}ms</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Avg Latency</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-slate-900">{stats.groupA.errorRate}%</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Error Rate</div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                Group B: Canary (Chaos Mode)
                <AlertTriangle className="w-4 h-4 text-amber-500 ml-2" />
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-slate-900">{stats.groupB.total}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Requests</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-amber-600">{stats.groupB.avgLatency}ms</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Avg Latency</div>
                </div>
                <div>
                    <div className={`text-2xl font-bold ${parseFloat(stats.groupB.errorRate) > 5 ? 'text-red-600' : 'text-slate-900'}`}>
                        {stats.groupB.errorRate}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wide">Error Rate</div>
                </div>
            </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
          <h3 className="font-bold text-slate-800 mb-4">Request Outcome by Experiment Group</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Success" stackId="a" fill="#0ea5e9" />
              <Bar dataKey="Errors" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
      </div>

      {/* Live Logs */}
      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg flex flex-col h-96">
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center text-slate-300">
              <Terminal className="w-5 h-5 mr-2" />
              <span className="font-mono text-sm font-bold">Live System Logs</span>
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs space-y-2">
            {logs.length === 0 && <div className="text-slate-500 italic">No logs generated yet...</div>}
            {logs.map(log => (
                <div key={log.id} className="flex gap-3 border-b border-slate-800 pb-2 mb-2 last:border-0">
                    <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`font-bold shrink-0 w-16 ${
                        log.level === 'ERROR' ? 'text-red-500' : 
                        log.level === 'WARN' ? 'text-amber-500' : 'text-blue-400'
                    }`}>{log.level}</span>
                    <span className="text-slate-400 shrink-0 w-20">[{log.group || 'SYS'}]</span>
                    <span className="text-slate-300 break-all">{log.message}</span>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
};