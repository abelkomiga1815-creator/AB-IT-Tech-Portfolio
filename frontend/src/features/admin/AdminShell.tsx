"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, FolderTree, LayoutDashboard, LogOut, Menu, PlusCircle, Layers, X } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { LoadingState } from "@/components/ui/States";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/utils/cn";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Projects", icon: Layers, exact: false },
  { href: "/admin/projects/new", label: "New project", icon: PlusCircle, exact: true },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { status, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (status === "anonymous" && !isLogin) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, isLogin, pathname, router]);

  useEffect(() => setOpen(false), [pathname]);

  if (isLogin) return <>{children}</>;
  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Checking your session..." />
      </div>
    );
  }

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    if (href === "/admin/projects") return pathname.startsWith(href) && pathname !== "/admin/projects/new";
    return pathname.startsWith(href);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Logo />
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-silver-500">Admin console</p>
      </div>
      <nav aria-label="Admin" className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href, exact) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
              isActive(href, exact) ? "bg-volt-500/15 text-white ring-1 ring-volt-400/30" : "text-silver-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/5 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-silver-400 hover:bg-white/5 hover:text-white">
          <ExternalLink className="h-4 w-4" aria-hidden /> View public site
        </Link>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/admin/login");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-silver-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
        <p className="truncate px-3 pt-2 text-xs text-silver-500">Signed in as {user?.username}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-white/5 bg-ink-900/70 lg:block">{sidebar}</aside>
      <div className="flex items-center justify-between border-b border-white/5 bg-ink-900/80 px-4 py-3 lg:hidden">
        <Logo />
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="rounded-md p-2 text-silver-200 hover:bg-white/5">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && <div className="border-b border-white/5 bg-ink-900 lg:hidden">{sidebar}</div>}
      <div className="min-w-0 px-4 py-8 sm:px-8">{children}</div>
    </div>
  );
}
