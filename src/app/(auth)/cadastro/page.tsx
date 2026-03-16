import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { AuthForm } from "@/src/components/auth-form";

export default async function CadastroPage() {
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
          <h1 className="text-3xl font-bold text-slate-900">Criar conta</h1>
          <p className="text-slate-600 mt-2">
            Cadastre o administrador inicial do sistema.
          </p>
        </div>

        <AuthForm mode="signup" />

        <p className="mt-6 text-sm text-slate-600">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}