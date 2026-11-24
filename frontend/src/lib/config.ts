export const siteConfig = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || "AB IT Tech Solution",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "",
  description:
    "A portfolio of websites, web applications, mobile apps and management systems designed and built by AB IT Tech Solution.",
};

export const hasContactDetails = Boolean(siteConfig.email || siteConfig.phone || siteConfig.address);
