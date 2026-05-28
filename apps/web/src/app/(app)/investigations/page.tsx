"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Briefcase, FolderOpen } from "lucide-react";

export default function InvestigationsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-[#3B82F6]" />
          Case Management
        </h1>
        <p className="text-[#94A3B8]">Investigator workspace and SAR filings.</p>
      </div>

      <GlassCard className="p-12 flex flex-col items-center justify-center opacity-50 border-dashed h-[500px]">
        <FolderOpen className="w-16 h-16 text-[#475569] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Active Cases</h2>
        <p className="text-[#94A3B8] text-sm text-center max-w-md">
          Start an investigation from the Alert Center or AI Copilot to generate a new case file.
        </p>
      </GlassCard>
    </div>
  );
}
