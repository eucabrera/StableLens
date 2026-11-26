"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  CloseIcon,
  DashboardIcon,
  DirectoryIcon,
  LibraryIcon,
  MenuIcon,
  PegIcon,
  RegulationIcon,
  ToolsIcon,
} from "@/components/icons";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Sprint the section ships in; shown as "Soon" until then. */
  soon?: string;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Peg monitor", href: "/peg", icon: PegIcon, soon: "S4" },
  { label: "Directory", href: "/directory", icon: DirectoryIcon, soon: "S5" },
  { label: "Regulation", href: "/regulation", icon: RegulationIcon, soon: "S6" },
  { label: "Research library", href: "/library", icon: LibraryIcon, soon: "S6" },
  { label: "Analysis tools", href: "/tools", icon: ToolsIcon, soon: "S7" },
];

function Nav({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5 px-3">
      {NAV.map(({ label, href, icon: Icon, soon }) => {
        if (soon) {
          return (
            <span
              key={href}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted/70"
            >
              <Icon className="shrink-0" />
              <span className="flex-1">{label}</span>
              <span className="rounded-full border border-line px-1.5 py-px font-mono text-[10px] uppercase tracking-wide">
                Soon
              </span>
            </span>
          );
        }
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
              active ? "bg-accent-soft text-accent-text" : "text-fg hover:bg-surface-2"
            }`}
          >
            <Icon className="shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Sidebar (drawer on mobile) + top bar around every signed-in page. */
export function AppShell({ user, children }: { user: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex min-h-full flex-1">
      {open && (
        <div aria-hidden="true" onClick={close} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />
      )}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gap-6 border-r border-line bg-bg py-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-9 items-center justify-between px-6">
          <Logo />
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="flex size-9 items-center justify-center rounded-md text-muted hover:text-fg lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>
        <Nav onNavigate={close} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-controls="sidebar"
            aria-expanded={open}
            className="flex size-9 items-center justify-center rounded-md text-muted hover:text-fg lg:hidden"
          >
            <MenuIcon />
          </button>
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {user}
          </div>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
