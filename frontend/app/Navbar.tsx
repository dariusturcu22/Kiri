"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const NAV_LINKS = ["Portfolio", "Maintenance", "Scheduling", "Contracts"];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-night px-6 md:px-12 h-16 flex items-center relative">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-cream-bg tracking-tight">
            Kiri
          </span>
          <Image src="/logo.png" alt="Kiri logo" width={18} height={18} />
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((label) => (
            <Link
              key={label}
              href={`#${label.toLowerCase()}`}
              className="text-sm font-semibold text-brown-light hover:text-cream-bg transition-colors no-underline"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/auth"
            className="text-sm font-semibold text-brown-light hover:text-cream-bg transition-colors no-underline"
          >
            Sign In
          </Link>
          <Link
            href="/auth"
            className="bg-green-dark text-cream-bg px-6 py-2 rounded-full text-sm font-bold hover:bg-green-hover transition-colors no-underline"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <Link
            href="/auth"
            className="bg-green-dark text-cream-bg px-4 py-2 rounded-full text-sm font-bold hover:bg-green-hover transition-colors no-underline"
          >
            Get Started
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-cream-bg p-1"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-night border-t border-white/10 z-50 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((label) => (
            <Link
              key={label}
              href={`#${label.toLowerCase()}`}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-semibold text-brown-light hover:text-cream-bg transition-colors no-underline"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/auth"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-semibold text-brown-light hover:text-cream-bg transition-colors no-underline"
          >
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}
