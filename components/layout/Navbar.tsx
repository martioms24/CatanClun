"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth-actions";
import { NotificationsToggle } from "@/components/notifications/NotificationsToggle";
import {
  LayoutDashboard,
  Swords,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Scroll,
  Castle,
} from "lucide-react";
import { useState } from "react";

type NavLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Route prefixes that should mark this link as active */
  activePrefixes?: string[];
};

const mainLinks: NavLink[] = [
  {
    href: "/dashboard",
    label: "Carcassonne",
    icon: Castle,
    activePrefixes: ["/dashboard", "/games", "/players"],
  },
  { href: "/plans", label: "Plans", icon: Scroll, activePrefixes: ["/plans"] },
];

const carcassonneSubLinks: NavLink[] = [
  { href: "/dashboard", label: "Tauler", icon: LayoutDashboard },
  {
    href: "/games",
    label: "Partides",
    icon: Swords,
    activePrefixes: ["/games", "/players"],
  },
  { href: "/games/new", label: "Nova Partida", icon: PlusCircle },
];

function isActive(pathname: string, link: NavLink): boolean {
  if (link.activePrefixes) {
    return link.activePrefixes.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
  }
  return pathname === link.href;
}

function isCarcassonneSection(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/games" ||
    pathname.startsWith("/games/") ||
    pathname === "/players" ||
    pathname.startsWith("/players/")
  );
}

// Sub-nav needs a special "exact match" behaviour for /games so it's not marked
// active when we're actually on /games/new
function isSubActive(pathname: string, link: NavLink): boolean {
  if (link.href === "/games/new") return pathname === "/games/new";
  if (link.href === "/games") {
    return (
      (pathname === "/games" ||
        pathname.startsWith("/games/") ||
        pathname.startsWith("/players/")) &&
      pathname !== "/games/new"
    );
  }
  if (link.href === "/dashboard") return pathname === "/dashboard";
  return pathname === link.href;
}

export function Navbar({ playerName }: { playerName?: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const showSubNav = isCarcassonneSection(pathname);

  return (
    <header className="sticky top-0 z-40 bg-medieval-brown border-b-4 border-medieval-gold shadow-medieval">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/logo.png"
            alt="Catan Clun"
            width={40}
            height={40}
            className="rounded-sm object-contain"
            priority
          />
          <span className="font-cinzel font-bold text-medieval-gold text-lg leading-none hidden sm:block">
            Catan<br />
            <span className="text-parchment text-sm font-normal">Clun</span>
          </span>
        </Link>

        {/* Desktop main nav */}
        <nav className="hidden md:flex items-center gap-1">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-medieval font-cinzel text-sm transition-colors",
                  active
                    ? "bg-medieval-gold text-medieval-dark font-semibold"
                    : "text-parchment hover:bg-parchment/10"
                )}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Player + notifications + logout */}
        <div className="hidden md:flex items-center gap-3">
          {playerName && (
            <span className="text-parchment/70 font-garamond text-sm">
              {playerName}
            </span>
          )}
          <NotificationsToggle variant="icon" />
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-parchment/70 hover:text-medieval-gold font-cinzel text-sm transition-colors"
            >
              <LogOut size={15} />
              Sortir
            </button>
          </form>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-parchment p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Obre el menú"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop sub-nav (only inside Carcassonne section) */}
      {showSubNav && (
        <div className="hidden md:block bg-medieval-dark border-t border-medieval-gold/20">
          <div className="max-w-5xl mx-auto px-4 h-11 flex items-center gap-1">
            {carcassonneSubLinks.map((link) => {
              const Icon = link.icon;
              const active = isSubActive(pathname, link);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-medieval font-cinzel text-xs transition-colors",
                    active
                      ? "bg-medieval-gold/20 text-medieval-gold font-semibold"
                      : "text-parchment/70 hover:bg-parchment/10 hover:text-parchment"
                  )}
                >
                  <Icon size={13} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-medieval-dark border-t-2 border-medieval-gold/30 px-4 py-3 flex flex-col gap-1">
          {mainLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(pathname, link);
            const isCarcassonne = link.href === "/dashboard";
            return (
              <div key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-medieval font-cinzel text-base transition-colors",
                    active
                      ? "bg-medieval-gold text-medieval-dark font-semibold"
                      : "text-parchment hover:bg-parchment/10"
                  )}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
                {isCarcassonne && active && (
                  <div className="ml-4 mt-1 mb-1 pl-3 border-l-2 border-medieval-gold/30 flex flex-col gap-1">
                    {carcassonneSubLinks.map((sub) => {
                      const SubIcon = sub.icon;
                      const subActive = isSubActive(pathname, sub);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-medieval font-cinzel text-sm transition-colors",
                            subActive
                              ? "text-medieval-gold font-semibold"
                              : "text-parchment/70 hover:text-parchment"
                          )}
                        >
                          <SubIcon size={14} />
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          <div className="border-t border-medieval-gold/20 mt-2 pt-2">
            {playerName && (
              <p className="text-parchment/50 font-garamond text-sm px-4 pb-1">
                {playerName}
              </p>
            )}
            <NotificationsToggle variant="full" />
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-3 rounded-medieval text-parchment/70 hover:text-medieval-gold font-cinzel text-base w-full transition-colors"
              >
                <LogOut size={18} />
                Tancar sessió
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
