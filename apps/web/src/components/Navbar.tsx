"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield, TreePine } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Intelligence", href: "#intelligence" },
  { label: "Graph", href: "#graph" },
  { label: "ML Engine", href: "#isolation-forest" },
  { label: "AI Copilot", href: "#ai-copilot" },
  { label: "Architecture", href: "#architecture" },
  { label: "Command Center", href: "#command-center" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#020617]/95 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.05),0_8px_40px_rgba(0,0,0,0.6)]"
          : "bg-transparent"
      }`}
    >
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#00F5FF]/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(0,245,255,0.4)]"
              style={{ background: "linear-gradient(135deg, #00F5FF, #3B82F6, #A855F7)" }}
            >
              <Shield className="w-4.5 h-4.5 text-[#020617] font-bold" />
            </div>
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981]"
              style={{ boxShadow: "0 0 6px rgba(16,185,129,0.6)" }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-[0.15em] text-white leading-none">
              STAR
            </span>
            <span className="text-[8px] font-mono text-[#475569] tracking-[0.25em] leading-none mt-0.5">
              INTELLIGENCE
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative px-3 py-2 text-xs text-[#94A3B8] hover:text-white transition-colors duration-300 group font-medium tracking-wide"
            >
              {link.label === "ML Engine" && (
                <TreePine className="inline-block w-2.5 h-2.5 mr-1 text-[#A855F7] -mt-0.5" />
              )}
              {link.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-[#00F5FF] to-[#A855F7] group-hover:w-4/5 transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Right CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#architecture"
            className="px-3 py-2 text-xs text-[#475569] hover:text-[#94A3B8] transition-colors font-medium"
          >
            Docs
          </a>
          <Link
            href="/dashboard"
            className="relative px-5 py-2.5 text-xs font-semibold rounded-xl overflow-hidden transition-all duration-300 group"
            style={{ background: "linear-gradient(135deg, #00F5FF, #3B82F6)", color: "#020617" }}
          >
            <motion.div
              animate={{ x: ["-200%", "200%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5 }}
              className="absolute inset-0 opacity-30"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }}
            />
            <span className="relative z-10">Launch Platform</span>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-[#94A3B8] hover:text-white transition-colors p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
            style={{
              background: "rgba(2,6,23,0.97)",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-3 text-sm text-[#94A3B8] hover:text-[#00F5FF] transition-colors font-medium rounded-lg hover:bg-white/[0.03]"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/dashboard"
                className="mt-3 px-5 py-3 text-sm font-semibold rounded-xl text-center block"
                style={{ background: "linear-gradient(135deg, #00F5FF, #3B82F6)", color: "#020617" }}
                onClick={() => setMobileOpen(false)}
              >
                Launch Platform
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
