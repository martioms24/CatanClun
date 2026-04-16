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
  Award,
  Calendar,
  CalendarHeart,
  ListTodo,
  MessageSquare,
  Dices,
  Gift,
} from "lucide-react";
import { useState } from "react";

type NavLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  activePrefixes?: string[];
};

const mainLinks: NavLink[] = [
  {
    href: "/forum",
    label: "Fòrum",
    icon: MessageSquare,
    activePrefixes: ["/forum"],
  },
  {
    href: "/dashboard",
    label: "Carcassonne",
    icon: Castle,
    activePrefixes: ["/dashboard", "/games", "/players"],
  },
  { href: "/plans", label: "Plans", icon: Scroll, activePrefixes: ["/plans"] },
  {
    href: "/awards",
    label: "Premis",
    icon: Award,
    activePrefixes: ["/awards"],
  },
  {
    href: "/rewards",
    label: "Recompenses",
    icon: Gift,
    activePrefixes: ["/rewards"],
  },
  {
    href: "/gambling",
    label: "Gambling",
    icon: Dices,
    activePrefixes: ["/gambling"],
  },
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

const plansSubLinks: NavLink[] = [
  { href: "/plans/llista", label: "Llista", icon: ListTodo },
  { href: "/plans/quedades", label: "Quedades", icon: CalendarHeart },
];

const awardsSubLinks: NavLink[] = [
  { href: "/awards/2024", label: "2024", icon: Calendar },
  { href: "/awards/2025", label: "2025", icon: Calendar },
  { href: "/awards/2026", label: "2026", icon: Calendar },
];

function isActive(pathname: string, link: NavLink): boolean {
  if (link.activePrefixes) {
    return link.activePrefixes.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
  }
  return pathname === link.href;
}

function getSection(
  pathname: string,
): "carcassonne" | "plans" | "awards" | null {
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/games" ||
    pathname.startsWith("/games/") ||
    pathname === "/players" ||
    pathname.startsWith("/players/")
  )
    return "carcassonne";
  if (pathname === "/plans" || pathname.startsWith("/plans/"))
    return "plans";
  if (pathname === "/awards" || pathname.startsWith("/awards/"))
    return "awards";
  return null;
}

function isSubActive(pathname: string, link: NavLink): boolean {
  // Carcassonne sub-nav
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
  // Plans sub-nav
  if (link.href === "/plans/llista")
    return pathname === "/plans" || pathname === "/plans/llista";
  if (link.href === "/plans/quedades")
    return pathname === "/plans/quedades" || pathname.startsWith("/plans/quedades/");
  // Awards sub-nav — exact match on year
  return pathname === link.href;
}

// Identifies which main-link key controls the mobile sub-nav
function getMobileSubKey(link: NavLink): string | null {
  if (link.href === "/dashboard") return "carcassonne";
  if (link.href === "/plans") return "plans";
  if (link.href === "/awards") return "awards";
  return null;
}

export function Navbar({ playerName, playerId }: { playerName?: string | null; playerId?: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const section = getSection(pathname);
  const subLinks =
    section === "carcassonne"
      ? carcassonneSubLinks
      : section === "plans"
      ? plansSubLinks
      : section === "awards"
      ? awardsSubLinks
      : null;

  return (
    <header className="sticky top-0 z-40 bg-medieval-brown border-b-4 border-medieval-gold shadow-medieval">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/forum"
          className="flex items-center shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/title.png"
            alt="Catan Clun"
            width={160}
            height={48}
            className="object-contain h-11 w-auto"
            priority
          />
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
            <Link
              href={playerId ? `/players/${playerId}` : "#"}
              className="text-parchment/70 hover:text-medieval-gold font-garamond text-sm transition-colors"
            >
              {playerName}
            </Link>
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

      {/* Desktop sub-nav */}
      {subLinks && (
        <div className="hidden md:block bg-medieval-dark border-t border-medieval-gold/20">
          <div className="max-w-5xl mx-auto px-4 h-11 flex items-center gap-1">
            {subLinks.map((link) => {
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
            const subKey = getMobileSubKey(link);
            const mobileSubLinks =
              subKey === "carcassonne"
                ? carcassonneSubLinks
                : subKey === "plans"
                ? plansSubLinks
                : subKey === "awards"
                ? awardsSubLinks
                : null;

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
                {active && mobileSubLinks && (
                  <div className="ml-4 mt-1 mb-1 pl-3 border-l-2 border-medieval-gold/30 flex flex-col gap-1">
                    {mobileSubLinks.map((sub) => {
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
              <Link
                href={playerId ? `/players/${playerId}` : "#"}
                onClick={() => setMenuOpen(false)}
                className="text-parchment/50 hover:text-medieval-gold font-garamond text-sm px-4 pb-1 transition-colors block"
              >
                {playerName}
              </Link>
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
