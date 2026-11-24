import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/AdminShell";
import { AuthProvider } from "@/features/auth/AuthProvider";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
