"use client";

import React, { useState } from "react";
import { ArrowLeft, Sparkles, BrainCircuit, Wand2 } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function AICreateOpportunityPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<any>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI delay
    setTimeout(() => {
      setGeneratedProject({
        title: "Local Photography Shoot for Restaurant",
        description: "We are looking for a professional lifestyle photographer to shoot high-quality images for our new restaurant menu and social media channels. The focus should be on authentic, vibrant shots of the food and the dining atmosphere.",
        category: "PHOTOGRAPHER",
        budget: "$800 - $1500",
        timeline: "Need completed within 14 days",
        skills: ["Food Photography", "Lifestyle", "Lighting", "Editing"]
      });
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-12">
      
      <div className="space-y-6">
        <Link href="/creators/opportunities" className="inline-flex items-center gap-2 text-black/40 hover:text-black font-bold uppercase tracking-widest text-[10px] transition-colors">
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none flex items-center gap-4">
          AI Project Creator. <Sparkles className="text-blue-500" size={40} />
        </h1>
        <p className="text-black/40 font-medium text-lg">
          Don't know how to scope a project? Just tell our AI what you need in plain English, and we'll generate the perfect project description and budget for you.
        </p>
      </div>

      {!generatedProject ? (
        <div className="bg-white p-8 md:p-10 rounded-2xl border border-black/5 shadow-2xl shadow-black/[0.02] space-y-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="space-y-4 relative z-10">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Describe your needs</label>
            <textarea 
              rows={6}
              placeholder='e.g., "I need a food photographer in Kochi for a restaurant shoot this weekend. Budget is around $1000."' 
              className="w-full bg-[#FBFBFD] border border-black/10 rounded-3xl p-6 text-lg font-medium placeholder:text-black/30 focus:border-blue-500 focus:outline-none transition-all resize-none shadow-inner"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="pt-4 relative z-10">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className={`w-full h-16 rounded-2xl text-sm font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${isGenerating ? 'bg-black/10 text-black/40 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-black shadow-lg shadow-blue-500/20'}`}
            >
              {isGenerating ? <><BrainCircuit size={20} className="animate-pulse" /> Analyzing Request...</> : <><Wand2 size={20} /> Generate Project Details</>}
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-8 bg-white p-8 md:p-10 rounded-2xl border border-blue-500/30 shadow-2xl shadow-blue-500/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
            <CheckCircle2 size={14} /> AI Generated Draft
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Project Title</label>
            <input 
              type="text" 
              defaultValue={generatedProject.title}
              className="w-full h-14 bg-[#FBFBFD] border border-black/10 rounded-2xl px-4 text-base font-bold focus:border-black focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Category</label>
              <select className="w-full h-14 bg-[#FBFBFD] border border-black/10 rounded-2xl px-4 text-sm font-bold uppercase focus:border-black focus:outline-none" defaultValue={generatedProject.category}>
                <option value="PHOTOGRAPHER">Photography Project</option>
                <option value="VIDEOGRAPHER">Videography Project</option>
                <option value="UGC_CREATOR">UGC Creation</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Suggested Budget</label>
              <input 
                type="text" 
                defaultValue={generatedProject.budget}
                className="w-full h-14 bg-[#FBFBFD] border border-black/10 rounded-2xl px-4 text-base font-bold focus:border-black focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">AI Generated Description</label>
            <textarea 
              rows={5}
              defaultValue={generatedProject.description}
              className="w-full bg-[#FBFBFD] border border-black/10 rounded-2xl p-4 text-base font-medium focus:border-black focus:outline-none resize-none"
            />
          </div>

          <div className="pt-6 border-t border-black/5 flex justify-end gap-4">
            <Button type="button" onClick={() => setGeneratedProject(null)} className="h-14 rounded-2xl bg-black/5 text-black text-xs font-black uppercase tracking-[0.1em] hover:bg-black/10 px-8">
              Discard
            </Button>
            <Button type="button" className="h-14 rounded-2xl bg-[#E53935] text-white text-xs font-black uppercase tracking-[0.1em] hover:bg-black px-8 flex items-center gap-2">
              <Sparkles size={16} /> Publish & Auto-Match
            </Button>
          </div>

        </form>
      )}

    </div>
  );
}
