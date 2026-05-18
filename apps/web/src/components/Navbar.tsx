"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Shield } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 bg-[#020617] shadow-[0_4px_30px_rgba(0,0,0,0.5)]`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5FF] to-[#3B82F6] flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-shadow duration-300">
              <Shield className="w-5 h-5 text-[#020617]" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#06D6A0] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-wider text-white">
              STAR
            </span>
            <span className="text-[10px] font-mono text-[#94A3B8] tracking-[0.2em] -mt-1">
              INTELLIGENCE
            </span>
          </div>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm text-[#94A3B8] hover:text-[#00F5FF] transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-[#00F5FF] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#architecture"
            className="px-4 py-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
          >
            Documentation
          </a>
          <a
            href="#cta"
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-[#00F5FF] to-[#3B82F6] text-[#020617] hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-shadow duration-300"
          >
            Request Demo
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-strong border-t border-white/5"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[#94A3B8] hover:text-[#00F5FF] transition-colors py-2"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#cta"
                className="mt-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-[#00F5FF] to-[#3B82F6] text-[#020617] text-center"
              >
                Request Demo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
