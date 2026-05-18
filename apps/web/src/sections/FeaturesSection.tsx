"use client";

import { motion } from "framer-motion";
import {
  Zap,
  GitBranch,
  Brain,
  MessageSquare,
  FileText,
  Users,
  Radio,
  Clock,
  Activity,
} from "lucide-react";
import { FEATURES } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  Zap,
  GitBranch,
  Brain,
  MessageSquare,
  FileText,
  Users,
  Radio,
  Clock,
  Activity,
};

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#030712] to-[#020617]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <Zap className="w-3 h-3 text-[#FFD166]" />
            <span className="text-xs font-mono text-[#FFD166] tracking-wider">
              CAPABILITIES
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Every Tool for </span>
            <span className="gradient-text">Modern AML</span>
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            A comprehensive suite of graph-native intelligence tools. From real-time
            streaming detection to AI-powered investigation — everything you need.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = iconMap[feature.icon] || Zap;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative glass rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300"
              >
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{
                    boxShadow: `inset 0 0 60px ${feature.color}08, 0 0 30px ${feature.color}08`,
                  }}
                />

                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${feature.color}, transparent)`,
                  }}
                />

                <div className="relative z-10">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
                    style={{
                      backgroundColor: `${feature.color}10`,
                    }}
                  >
                    <Icon
                      className="w-6 h-6 transition-colors duration-300"
                      style={{ color: feature.color }}
                    />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#E2E8F0] transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
