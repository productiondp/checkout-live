"use client";

import React, { useState } from "react";
import { ArrowLeft, MessageSquare, Folder, CheckCircle, FileText, Activity, Upload, Download } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function CreatorWorkspacePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"CHAT" | "FILES" | "MILESTONES" | "CONTRACTS" | "ACTIVITY">("CHAT");

  return (
    <div className="bg-[#FBFBFD] min-h-screen">
      
      {/* Header */}
      <div className="bg-white border-b border-black/5 px-6 md:px-12 py-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <Link href="/creators/opportunities" className="inline-flex items-center gap-2 text-black/40 hover:text-black font-bold uppercase tracking-widest text-[10px] transition-colors">
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-black uppercase tracking-tight">Summer Fashion Campaign Shoot</h1>
            <p className="text-sm font-medium text-black/40 flex items-center gap-2">
              Lumina Apparel <span className="w-1 h-1 bg-black/20 rounded-full" /> Sarah Jenkins
            </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
               Active Project
             </div>
             <div className="text-right hidden md:block">
               <p className="text-xs font-bold uppercase tracking-[0.1em] text-black/40">Total Budget</p>
               <p className="font-black">$1,500.00</p>
             </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto flex gap-6 mt-6 overflow-x-auto no-scrollbar">
          {[
            { id: "CHAT", icon: MessageSquare, label: "Chat" },
            { id: "FILES", icon: Folder, label: "Files & Deliverables" },
            { id: "MILESTONES", icon: CheckCircle, label: "Milestones" },
            { id: "CONTRACTS", icon: FileText, label: "Contracts" },
            { id: "ACTIVITY", icon: Activity, label: "Activity" }
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
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-6 md:p-12">
        
        {/* CHAT TAB */}
        {activeTab === "CHAT" && (
          <div className="bg-white rounded-[2rem] border border-black/5 h-[600px] flex flex-col shadow-sm">
            <div className="p-6 border-b border-black/5">
              <h3 className="font-black uppercase tracking-tight">Project Chat</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
               <div className="text-center text-black/30 text-[10px] font-bold uppercase tracking-widest my-4">Workspace Created</div>
               
               {/* Mock Messages */}
               <div className="flex gap-4">
                 <div className="h-10 w-10 bg-black/10 rounded-full shrink-0" />
                 <div className="bg-black/5 p-4 rounded-2xl rounded-tl-none max-w-md">
                   <p className="text-sm font-medium">Hi Sarah, we accepted your proposal! The contract is in the Contracts tab.</p>
                 </div>
               </div>

               <div className="flex gap-4 flex-row-reverse">
                 <div className="h-10 w-10 bg-[#E53935]/20 rounded-full shrink-0" />
                 <div className="bg-[#E53935] text-white p-4 rounded-2xl rounded-tr-none max-w-md">
                   <p className="text-sm font-medium">Amazing! I'll review and sign it today. When do you want to schedule the first shoot?</p>
                 </div>
               </div>
            </div>
            <div className="p-4 border-t border-black/5 flex gap-2">
              <Button className="h-12 w-12 rounded-xl bg-black/5 text-black hover:bg-black/10 flex items-center justify-center shrink-0">
                <Upload size={18} />
              </Button>
              <input type="text" placeholder="Type a message..." className="flex-1 bg-black/5 rounded-xl px-4 text-sm font-medium focus:outline-none" />
              <Button className="h-12 px-6 rounded-xl bg-black text-white text-xs font-black uppercase tracking-[0.1em]">Send</Button>
            </div>
          </div>
        )}

        {/* FILES TAB */}
        {activeTab === "FILES" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight">Files & Deliverables</h3>
              <Button className="h-10 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 px-4">
                <Upload size={14} /> Upload File
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {[
                 { name: "Brand_Guidelines_2026.pdf", type: "REFERENCE", date: "Today" },
                 { name: "Shoot_Moodboard.jpg", type: "REFERENCE", date: "Yesterday" },
                 { name: "Draft_Edits_V1.mp4", type: "DELIVERABLE", date: "Just now" }
               ].map((file, i) => (
                 <div key={i} className="bg-white p-4 rounded-2xl border border-black/5 flex items-start gap-4 hover:shadow-md transition-all cursor-pointer">
                   <div className="h-12 w-12 bg-black/5 rounded-xl flex items-center justify-center shrink-0">
                     <Folder size={20} className="text-black/40" />
                   </div>
                   <div className="flex-1 overflow-hidden">
                     <p className="font-bold text-sm truncate">{file.name}</p>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-1">{file.type} • {file.date}</p>
                   </div>
                   <Download size={16} className="text-black/30 hover:text-black" />
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* CONTRACTS TAB */}
        {activeTab === "CONTRACTS" && (
          <div className="max-w-3xl space-y-6">
             <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-xl">Service Agreement</h3>
                    <p className="text-sm font-medium text-black/40">Generated on May 30, 2026</p>
                  </div>
                  <div className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest rounded-lg">
                    Pending Signature
                  </div>
                </div>

                <div className="p-6 bg-[#FBFBFD] rounded-2xl border border-black/5 text-sm font-medium text-black/60 space-y-4">
                  <p><strong>Client:</strong> Lumina Apparel</p>
                  <p><strong>Creator:</strong> Sarah Jenkins</p>
                  <p><strong>Budget:</strong> $1,500.00 (Escrowed via Stripe Connect)</p>
                  <p><strong>Deliverables:</strong></p>
                  <ul className="list-disc pl-5">
                    <li>3 High-resolution lifestyle photos</li>
                    <li>2 UGC Reels (15-30s)</li>
                    <li>Full usage rights for 12 months</li>
                  </ul>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button className="flex-1 h-12 rounded-xl bg-[#E53935] text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-black">
                    Sign Contract
                  </Button>
                  <Button className="flex-1 h-12 rounded-xl bg-black/5 text-black text-xs font-black uppercase tracking-[0.1em] hover:bg-black/10">
                    Request Changes
                  </Button>
                </div>
             </div>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === "ACTIVITY" && (
          <div className="max-w-2xl bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
             <h3 className="font-black uppercase tracking-tight mb-8">Workspace Activity</h3>
             <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {[
                  { text: "Workspace Created", time: "May 30, 10:00 AM" },
                  { text: "Lumina Apparel uploaded Brand_Guidelines_2026.pdf", time: "May 30, 10:15 AM" },
                  { text: "Contract Generated", time: "May 30, 10:30 AM" },
                  { text: "Sarah Jenkins uploaded Draft_Edits_V1.mp4", time: "May 30, 2:45 PM" }
                ].map((act, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-black text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-black/5 bg-[#FBFBFD] shadow-sm">
                      <p className="font-bold text-sm text-black">{act.text}</p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">{act.time}</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
