"use client";

import { motion } from "framer-motion";
import React from "react";

interface SectionHeaderProps {
  badgeIcon?: any;
  badgeText: string;
  badgeColor?: string;
  title1: string;
  title2: string;
  description: string;
  align?: "left" | "center";
}

export function SectionHeader({
  badgeIcon: Icon,
  badgeText,
  badgeColor = "#00F5FF",
  title1,
  title2,
  description,
  align = "center"
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`mb-16 ${align === "center" ? "text-center" : "text-left"}`}
    >
      <div className={`inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 ${align === "center" ? "mx-auto" : ""}`}>
        {Icon && <Icon className="w-3 h-3" style={{ color: badgeColor }} />}
        <span className="text-xs font-mono tracking-[0.12em]" style={{ color: badgeColor }}>
          {badgeText}
        </span>
      </div>
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
        <span className="text-white">{title1} </span>
        <span className="gradient-text">{title2}</span>
      </h2>
      <p className={`text-lg text-[#94A3B8] max-w-2xl leading-relaxed ${align === "center" ? "mx-auto" : ""}`}>
        {description}
      </p>
    </motion.div>
  );
}
