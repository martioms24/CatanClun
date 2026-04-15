"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MeepleIcon } from "@/components/ui/MeepleIcon";
import { logout } from "@/app/actions/auth-actions";
import { LayoutDashboard, Swords, PlusCircle, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard", label: "Tablero", icon: LayoutDashboard },
  { href: "/games", label: "Partidas", icon: Swords },
  { href: "/games/new", label: "Nueva Partida", icon: PlusCircle },
];

export function Navbar({ playerName }: { playerName?: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-medieval-brown border-b-4 border-medieval-gold shadow-medieval">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <MeepleIcon color="#D4AF37" size={28} />
          <span className="font-cinzel font-bold text-medieval-gold text-lg leading-none hidden sm:block">
            Catán<br />
            <span className="text-parchment text-sm font-normal">Clune</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-medieval font-cinzel text-sm transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-medieval-gold text-medieval-dark font-semibold"
                  : "text-parchment hover:bg-parchment/10"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Player + logout */}
        <div className="hidden md:flex items-center gap-3">
          {playerName && (
            <span className="text-parchment/70 font-garamond text-sm">
              {playerName}
            </span>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-parchment/70 hover:text-medieval-gold font-cinzel text-sm transition-colors"
            >
              <LogOut size={15} />
              Salir
            </button>
          </form>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-parchment p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-medieval-dark border-t-2 border-medieval-gold/30 px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-medieval font-cinzel text-base transition-colors",
                pathname === href
                  ? "bg-medieval-gold text-medieval-dark font-semibold"
                  : "text-parchment hover:bg-parchment/10"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <div className="border-t border-medieval-gold/20 mt-2 pt-2">
            {playerName && (
              <p className="text-parchment/50 font-garamond text-sm px-4 pb-1">
                {playerName}
              </p>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-3 rounded-medieval text-parchment/70 hover:text-medieval-gold font-cinzel text-base w-full transition-colors"
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
