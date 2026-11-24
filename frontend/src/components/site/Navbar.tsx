"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { ButtonLink } from "@/components/ui/Button";
import { siteConfig } from "@/lib/config";
import { cn } from "@/utils/cn";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const cta = siteConfig.email ? `mailto:${siteConfig.email}?subject=Project%20enquiry` : "/contact";

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition",
                isActive(link.href) ? "text-white" : "text-silver-400 hover:text-white",
              )}
            >
              {isActive(link.href) && <span className="mr-1.5 font-mono text-cyan-400">/</span>}
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <ButtonLink href={cta} size="sm">
            Start a project
          </ButtonLink>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-silver-200 hover:bg-white/5 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Mobile" className="border-t border-white/5 px-5 pb-4 md:hidden">
          <ul className="space-y-1 pt-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-md px-3 py-2.5 text-sm",
                    isActive(link.href) ? "bg-white/5 text-white" : "text-silver-300",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
