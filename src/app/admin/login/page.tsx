import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { LogoMark } from "@/components/layout/logo";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <LogoMark size={44} />
      <h1 className="mt-6 mb-1 text-2xl font-bold tracking-tight">Admin Login</h1>
      <p className="mb-6 text-sm text-muted-foreground">Ballia News team only</p>
      <Suspense><LoginForm /></Suspense>
    </main>
  );
}
