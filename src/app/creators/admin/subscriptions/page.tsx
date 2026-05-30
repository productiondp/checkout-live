"use client";

import React, { useState } from "react";
import { Settings, Users, CreditCard, Tag, TrendingUp, Search } from "lucide-react";
import Button from "@/components/ui/Button";

export default function SubscriptionAdminPanel() {
  const [activeTab, setActiveTab] = useState<"PLANS" | "SUBSCRIBERS" | "PROMOS" | "REVENUE">("PLANS");

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
            Admin: Revenue Engine.
          </h1>
          <p className="text-black/40 font-medium text-lg">
            Manage subscription tiers, feature gates, and promotional campaigns.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-black/5 pb-4 overflow-x-auto no-scrollbar">
        {[
          { id: "PLANS", icon: Settings, label: "Plans & Entitlements" },
          { id: "SUBSCRIBERS", icon: Users, label: "Subscribers" },
          { id: "PROMOS", icon: Tag, label: "Coupons & Promos" },
          { id: "REVENUE", icon: TrendingUp, label: "Revenue Analytics" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 border-b-2 text-xs font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-black text-black" 
                : "border-transparent text-black/40 hover:text-black"
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-8">
        
        {activeTab === "PLANS" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Plan Editor */}
            <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
               <div className="flex justify-between items-center">
                 <h3 className="font-black uppercase tracking-tight text-xl">Creator Pro</h3>
                 <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg">Active</span>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Monthly Price</label>
                   <input type="text" defaultValue="$24.00" className="w-full h-12 bg-black/5 rounded-xl px-4 font-bold focus:outline-none" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Annual Price</label>
                   <input type="text" defaultValue="$19.00/mo" className="w-full h-12 bg-black/5 rounded-xl px-4 font-bold focus:outline-none" />
                 </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-black/5">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Feature Entitlements (JSON)</h4>
                 <div className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                   <pre>{`{
  "MAX_OPPORTUNITIES": -1,
  "MAX_SHORTLISTS": 100,
  "AI_RECOMMENDATIONS": true,
  "PRIORITY_RANKING": true,
  "ADVANCED_ANALYTICS": true,
  "PORTFOLIO_LIMIT": -1
}`}</pre>
                 </div>
                 <Button className="w-full h-12 rounded-xl bg-black text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-black/80">
                   Save Plan configuration
                 </Button>
               </div>
            </div>

            {/* Feature Gates Overview */}
            <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
              <h3 className="font-black uppercase tracking-tight text-xl">Global Feature Gates</h3>
              <p className="text-sm font-medium text-black/40">These metrics track limits in the <code className="bg-black/5 px-1 py-0.5 rounded">usage_tracking</code> table.</p>
              
              <div className="space-y-4">
                {[
                  { key: "MAX_OPPORTUNITIES", type: "Quantitative (Int)" },
                  { key: "MAX_SHORTLISTS", type: "Quantitative (Int)" },
                  { key: "AI_RECOMMENDATIONS", type: "Boolean" },
                  { key: "PRIORITY_RANKING", type: "Boolean" }
                ].map((gate, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border border-black/5 rounded-xl">
                    <span className="font-bold text-sm font-mono">{gate.key}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/40">{gate.type}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {activeTab === "PROMOS" && (
          <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-black uppercase tracking-tight text-xl">Active Promotions</h3>
               <Button className="h-10 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-[0.1em] px-4">
                 + Create Promo
               </Button>
             </div>
             
             <table className="w-full text-left">
               <thead>
                 <tr className="border-b border-black/5 text-[10px] font-black uppercase tracking-widest text-black/40">
                   <th className="pb-4 font-bold">Code</th>
                   <th className="pb-4 font-bold">Discount</th>
                   <th className="pb-4 font-bold">Uses</th>
                   <th className="pb-4 font-bold">Expires</th>
                   <th className="pb-4 font-bold text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="text-sm font-bold">
                 <tr className="border-b border-black/5">
                   <td className="py-4">EARLYBIRD50</td>
                   <td className="py-4">50% OFF (3 Months)</td>
                   <td className="py-4">45 / 100</td>
                   <td className="py-4">June 30, 2026</td>
                   <td className="py-4 text-right text-green-500">Active</td>
                 </tr>
                 <tr>
                   <td className="py-4">BETA_TESTER</td>
                   <td className="py-4">100% OFF (Lifetime)</td>
                   <td className="py-4">12 / 50</td>
                   <td className="py-4">Never</td>
                   <td className="py-4 text-right text-green-500">Active</td>
                 </tr>
               </tbody>
             </table>
          </div>
        )}
        
        {/* Placeholder for Subscribers/Revenue */}
        {(activeTab === "SUBSCRIBERS" || activeTab === "REVENUE") && (
          <div className="text-center py-20 text-black/40 font-medium">
             Ready for Stripe Webhook Integration.
          </div>
        )}

      </div>
    </div>
  );
}
