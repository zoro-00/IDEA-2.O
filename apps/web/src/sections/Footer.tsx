"use client";

import { motion } from "framer-motion";
import { Shield, Globe, MessageCircle, Briefcase, ExternalLink } from "lucide-react";

export default function Footer() {
  const sections = [
    {
      title: "Platform",
      links: [
        "Graph Explorer",
        "Alert Dashboard",
        "AI Copilot",
        "SAR Generator",
        "Case Management",
      ],
    },
    {
      title: "Technology",
      links: [
        "Architecture",
        "Graph Analytics",
        "GNN Models",
        "API Reference",
        "Documentation",
      ],
    },
    {
      title: "Company",
      links: ["About", "Careers", "Blog", "Contact", "Partners"],
    },
    {
      title: "Compliance",
      links: [
        "SOC 2 Type II",
        "GDPR",
        "BSA/AML",
        "Privacy Policy",
        "Terms of Service",
      ],
    },
  ];

  return (
    <footer className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] to-[#030712]" />
      <div className="absolute inset-0 grid-pattern opacity-5" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5FF] to-[#3B82F6] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#020617]" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-wider text-white">
                  STAR
                </div>
                <div className="text-[9px] font-mono text-[#94A3B8] tracking-[0.15em]">
                  INTELLIGENCE
                </div>
              </div>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
              Spatial Temporal Automated Risk System. AI-native graph intelligence
              for modern financial crime detection.
            </p>
            <div className="flex items-center gap-3">
              {[Globe, MessageCircle, Briefcase].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-lg glass flex items-center justify-center hover:bg-white/5 transition-colors group"
                >
                  <Icon className="w-4 h-4 text-[#94A3B8] group-hover:text-[#00F5FF] transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-mono text-[#00F5FF] tracking-wider uppercase mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#94A3B8] hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      {link}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#94A3B8] font-mono">
            © 2024 STAR Intelligence. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs text-[#94A3B8] font-mono">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#06D6A0]" />
              <span>All Systems Operational</span>
            </div>
            <span className="text-white/10">|</span>
            <span>SOC 2 Certified</span>
            <span className="text-white/10">|</span>
            <span>GDPR Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
