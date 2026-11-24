import Link from "next/link";
import { Logo } from "./Logo";
import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-ink-900/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-silver-400">
            Software, websites, mobile apps and management systems - built with care and documented in this portfolio.
          </p>
        </div>
        <div>
          <h2 className="eyebrow">Explore</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["/projects", "All projects"],
              ["/about", "About"],
              ["/contact", "Contact"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-silver-300 transition hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="eyebrow">Get in touch</h2>
          <ul className="mt-4 space-y-2 text-sm text-silver-300">
            {siteConfig.email && (
              <li>
                <a href={`mailto:${siteConfig.email}`} className="transition hover:text-white">
                  {siteConfig.email}
                </a>
              </li>
            )}
            {siteConfig.phone && <li>{siteConfig.phone}</li>}
            {siteConfig.address && <li>{siteConfig.address}</li>}
            {!siteConfig.email && !siteConfig.phone && !siteConfig.address && (
              <li className="text-silver-500">Contact details will appear here once configured.</li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-silver-500 sm:px-8">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <Link href="/admin" className="transition hover:text-silver-300">
            Admin sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
