"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import React from "react";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  icon?: any;
  children: React.ReactNode;
  showArrow?: boolean;
}

export function NeonButton({
  variant = "primary",
  icon: Icon,
  children,
  showArrow = false,
  className = "",
  ...props
}: NeonButtonProps) {
  
  if (variant === "primary") {
    return (
      <button
        className={`group relative inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm overflow-hidden transition-all duration-300 ${className}`}
        style={{
          background: "linear-gradient(135deg, #00F5FF, #3B82F6, #A855F7)",
          color: "#020617",
        }}
        {...props}
      >
        <motion.div
          animate={{ x: ["-200%", "200%"] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
          className="absolute inset-0 opacity-30"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }}
        />
        {Icon && <Icon className="w-4 h-4 relative z-10" />}
        <span className="relative z-10">{children}</span>
        {showArrow && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />}
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        className={`group inline-flex items-center gap-2 px-8 py-3 rounded-xl border font-medium text-sm transition-all duration-300 ${className}`}
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: "rgba(255,255,255,0.08)",
          color: "#E2E8F0",
          backdropFilter: "blur(10px)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.3)";
          (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.05)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
        }}
        {...props}
      >
        {Icon && <Icon className="w-4 h-4" />}
        <span>{children}</span>
        {showArrow && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#00F5FF]" />}
      </button>
    );
  }

  // secondary
  return (
    <button
      className={`group inline-flex items-center gap-2 px-8 py-3 rounded-xl border font-medium text-sm transition-all duration-300 ${className}`}
      style={{
        background: "rgba(168,85,247,0.08)",
        borderColor: "rgba(168,85,247,0.2)",
        color: "#A855F7",
        backdropFilter: "blur(10px)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.15)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.08)";
      }}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span>{children}</span>
    </button>
  );
}
