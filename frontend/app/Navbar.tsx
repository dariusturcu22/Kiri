import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = ["Portfolio", "Maintenance", "Scheduling", "Contracts"];

export function Navbar() {
  return (
    <nav className="bg-night px-12 h-16 flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-cream-bg tracking-tight">
            Kiri
          </span>
          <Image src="/logo.png" alt="Kiri logo" width={18} height={18} />
        </div>

        <div className="flex items-center gap-8">
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

        <div className="flex items-center gap-4">
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
      </div>
    </nav>
  );
}
