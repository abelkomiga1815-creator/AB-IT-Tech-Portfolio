import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { hasContactDetails, siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${siteConfig.name} about your next project.`,
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-20 sm:px-8">
      <SectionHeading
        eyebrow="Contact"
        title="Let's talk about your project"
        description="Share what you need built, who it is for and when you need it. Include links or examples if you have them."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {siteConfig.email && (
          <a href={`mailto:${siteConfig.email}`} className="brackets glass flex items-start gap-4 rounded-xl p-6 transition hover:border-cyan-400/40">
            <Mail className="mt-0.5 h-5 w-5 text-cyan-400" aria-hidden />
            <span>
              <span className="block text-xs uppercase tracking-widest text-silver-500">Email</span>
              <span className="mt-1 block break-all text-silver-100">{siteConfig.email}</span>
            </span>
          </a>
        )}
        {siteConfig.phone && (
          <a href={`tel:${siteConfig.phone.replace(/\s+/g, "")}`} className="brackets glass flex items-start gap-4 rounded-xl p-6 transition hover:border-cyan-400/40">
            <Phone className="mt-0.5 h-5 w-5 text-cyan-400" aria-hidden />
            <span>
              <span className="block text-xs uppercase tracking-widest text-silver-500">Phone</span>
              <span className="mt-1 block text-silver-100">{siteConfig.phone}</span>
            </span>
          </a>
        )}
        {siteConfig.address && (
          <div className="glass flex items-start gap-4 rounded-xl p-6">
            <MapPin className="mt-0.5 h-5 w-5 text-cyan-400" aria-hidden />
            <span>
              <span className="block text-xs uppercase tracking-widest text-silver-500">Address</span>
              <span className="mt-1 block text-silver-100">{siteConfig.address}</span>
            </span>
          </div>
        )}
      </div>
      {!hasContactDetails && (
        <p className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-sm text-silver-400">
          Contact details have not been configured yet. Set NEXT_PUBLIC_CONTACT_EMAIL, NEXT_PUBLIC_CONTACT_PHONE and
          NEXT_PUBLIC_CONTACT_ADDRESS in the frontend environment to show them here.
        </p>
      )}
      {siteConfig.email && (
        <div className="mt-8">
          <ButtonLink href={`mailto:${siteConfig.email}?subject=Project%20enquiry`} size="lg">
            Email us about a project
          </ButtonLink>
        </div>
      )}
    </section>
  );
}
