"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, FileText, AlertCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { createClient } from '@/utils/supabase/client';

import { useAuth } from '@/hooks/useAuth';

export default function CreatorFinanceDashboard() {
  const { user } = useAuth();
  const [isAccountConnected, setIsAccountConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState({
    cleared: 0,
    escrow: 0,
    totalEarnings: 0
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadFinanceData() {
      try {
        if (!user) return;

        // 1. Check Connected Account Status
        const { data: account } = await supabase
          .from('connected_accounts')
          .select('is_verified')
          .eq('user_id', user.id)
          .single();
        
        setIsAccountConnected(account?.is_verified || false);

        // 2. Fetch Escrow Balances
        const { data: escrows } = await supabase
          .from('escrows')
          .select('amount, status, workspaces!inner(creator_id)')
          .eq('workspaces.creator_id', user.id)
          .eq('status', 'FUNDED');
        
        const escrowSum = escrows?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        // 3. Fetch Cleared Payouts (Total Earnings)
        const { data: payouts } = await supabase
          .from('payouts')
          .select('amount, status')
          .eq('creator_id', user.id);
        
        const totalPaid = payouts?.filter(p => p.status === 'PAID').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
        const totalPending = payouts?.filter(p => p.status === 'PENDING').reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        setFinancials({
          cleared: totalPending, // Available for payout (processing)
          escrow: escrowSum,
          totalEarnings: totalPaid
        });

        // 4. Fetch Transaction History (Payouts & Fees)
        const { data: recentPayouts } = await supabase
          .from('payouts')
          .select('id, amount, status, created_at')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        setTransactions(recentPayouts || []);
      } catch (err) {
        console.error("Failed to load financial data", err);
      } finally {
        setLoading(false);
      }
    }

    loadFinanceData();
  }, [supabase]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-black" size={48} /></div>;
  }

  return (
    <div className="bg-[#FBFBFD] min-h-screen pb-32">
      <div className="bg-black text-white p-6 md:p-12">
        <div className="max-w-7xl mx-auto space-y-6 pt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-black uppercase tracking-[0.2em]">
            <ShieldCheck size={14} /> Secure Escrow Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Finances & Payouts.</h1>
          <p className="text-white/60 font-medium max-w-xl">Track your earnings, manage active escrows, and configure your bank payout settings.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {!isAccountConnected ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <AlertCircle size={24} className="text-red-500" />
              <div>
                <h3 className="font-bold text-red-900">Payout Account Not Connected</h3>
                <p className="text-sm font-medium text-red-700">You must connect a verified bank account via Stripe Connect to receive payouts.</p>
              </div>
            </div>
            <Button className="h-10 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-6 hover:bg-red-700">Connect via Stripe</Button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ShieldCheck size={24} className="text-green-600" />
              <div>
                <h3 className="font-bold text-green-900">Payout System Active</h3>
                <p className="text-sm font-medium text-green-700">Your Stripe Express account is connected. Automatic payouts occur every Wednesday.</p>
              </div>
            </div>
            <Button className="h-10 rounded-xl bg-white border border-green-200 text-green-800 text-[10px] font-black uppercase tracking-widest px-6 hover:bg-green-100">Manage Account</Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40">Available for Payout</h3>
            <p className="text-5xl font-black">${financials.cleared.toLocaleString()}</p>
            <p className="text-xs font-bold uppercase text-black/40 mt-4 flex items-center gap-1"><ArrowUpRight size={14} /> Processed & Cleared</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-black/5 group-hover:text-amber-500/10 transition-colors"><ShieldCheck size={100} /></div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40 relative z-10">In Escrow (Secured)</h3>
            <p className="text-5xl font-black relative z-10">${financials.escrow.toLocaleString()}</p>
            <p className="text-xs font-bold uppercase text-amber-500 mt-4 flex items-center gap-1 relative z-10"><Clock size={14} /> Awaiting Approval</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-black/40">Total Earnings (YTD)</h3>
            <p className="text-5xl font-black">${financials.totalEarnings.toLocaleString()}</p>
            <p className="text-xs font-bold uppercase text-black/40 mt-4 flex items-center gap-1"><FileText size={14} /> Download Tax Statement</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm space-y-8">
           <div className="flex justify-between items-center">
             <h3 className="font-black uppercase tracking-tight text-xl">Recent Transactions</h3>
           </div>
           {transactions.length === 0 ? (
             <p className="text-black/40 text-sm font-medium">No recent transactions found.</p>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="border-b border-black/5 text-[10px] font-black uppercase tracking-widest text-black/40">
                     <th className="pb-4 font-bold">Date</th>
                     <th className="pb-4 font-bold">Project / ID</th>
                     <th className="pb-4 font-bold">Type</th>
                     <th className="pb-4 font-bold">Amount</th>
                     <th className="pb-4 font-bold text-right">Status</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm font-bold">
                   {transactions.map((txn, i) => (
                     <tr key={txn.id} className="border-b border-black/5">
                       <td className="py-4">{new Date(txn.created_at).toLocaleDateString()}</td>
                       <td className="py-4"><p className="text-[10px] text-black/40 font-mono">{txn.id}</p></td>
                       <td className="py-4 text-green-600 flex items-center gap-1 mt-2"><ArrowUpRight size={14} /> Payout</td>
                       <td className="py-4">${Number(txn.amount).toLocaleString()}</td>
                       <td className="py-4 text-right">
                         <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest ${txn.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{txn.status}</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
