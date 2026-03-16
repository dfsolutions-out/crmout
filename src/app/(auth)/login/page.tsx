import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { AuthForm } from "@/src/components/auth-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Entrar</h1>
          <p className="text-slate-600 mt-2">
            Acesse sua conta do CRMOut.
          </p>
        </div>

        <AuthForm mode="login" />

        <p className="mt-6 text-sm text-slate-600">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-slate-900 underline">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}