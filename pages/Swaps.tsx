import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SwapRequest, SwapStatus, Role } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const Swaps: React.FC = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSwaps = async () => {
      const res = await api.getSwaps();
      if (res.success && res.data) {
          setSwaps(res.data);
      } else {
          setError(res.error || 'Failed to load swaps');
      }
    };
    loadSwaps();
  }, []);

  const handleApprove = async (id: string) => {
    setError(null);
    const res = await api.approveSwap(id);
    if (res.success) {
        setSwaps(prev => prev.map(s => s.id === id ? { ...s, status: SwapStatus.APPROVED } : s));
    } else {
        setError(res.error || 'Failed to approve swap');
    }
  };

  const StatusBadge = ({ status }: { status: SwapStatus }) => {
      const styles = {
          [SwapStatus.REQUESTED]: "bg-slate-100 text-slate-700",
          [SwapStatus.OFFERED]: "bg-blue-100 text-blue-700",
          [SwapStatus.ADMIN_APPROVAL]: "bg-amber-100 text-amber-800",
          [SwapStatus.APPROVED]: "bg-green-100 text-green-800",
          [SwapStatus.REJECTED]: "bg-red-100 text-red-800",
          [SwapStatus.CANCELED]: "bg-gray-100 text-gray-500",
      };
      return <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${styles[status]}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Swap Market</h1>
            <p className="text-slate-500">Manage shift trades and requests</p>
        </div>
        {user?.role === Role.WORKER && (
            <Button>
                <RefreshCw className="w-4 h-4 mr-2" />
                Request New Swap
            </Button>
        )}
      </div>
      
      {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2"/>
              {error}
          </div>
      )}

      <div className="space-y-4">
        {swaps.map(swap => (
            <div key={swap.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary-50 text-secondary-600 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-slate-800">{swap.shiftDate} ({swap.shiftLabel})</h3>
                            <StatusBadge status={swap.status} />
                        </div>
                        <p className="text-sm text-slate-600">
                            <span className="font-medium">{swap.requesterName}</span> wants to give up this shift.
                        </p>
                        {swap.offers.length > 0 && (
                            <div className="mt-3 bg-slate-50 p-3 rounded-lg text-sm">
                                <span className="font-medium text-slate-900">Offers: </span>
                                {swap.offers.map(o => o.offerUserName).join(', ')}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {user?.role === Role.ADMIN && swap.status === SwapStatus.ADMIN_APPROVAL && (
                        <>
                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 border-red-200">
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                            </Button>
                            <Button size="sm" onClick={() => handleApprove(swap.id)} className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </Button>
                        </>
                    )}
                     {user?.role === Role.WORKER && swap.status === SwapStatus.REQUESTED && swap.requesterId !== user.id && (
                        <Button size="sm">Offer to Take</Button>
                    )}
                </div>
            </div>
        ))}
        
        {swaps.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No active swap requests.
            </div>
        )}
      </div>
    </div>
  );
};