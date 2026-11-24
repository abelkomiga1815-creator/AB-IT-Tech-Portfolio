import { Suspense } from "react";
import { LoginForm } from "@/features/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
