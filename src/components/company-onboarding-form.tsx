"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function CompanyOnboardingForm() {
  const router = useRouter();
  const supabase = createClient();

  const [companyName, setCompanyName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const finalSlug = slugify(slug || companyName);

      const { data, error } = await supabase.rpc("create_company_with_owner", {
        p_company_name: companyName,
        p_slug: finalSlug,
      });

      if (error) throw error;

      if (!data) {
        throw new Error("Não foi possível criar a empresa.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar empresa.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Nome da empresa
        </label>
        <input
          type="text"
          required
          value={companyName}
          onChange={(e) => {
            const value = e.target.value;
            setCompanyName(value);
            if (!slug) {
              setSlug(slugify(value));
            }
          }}
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Delta Serviços"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Slug</label>
        <input
          type="text"
          required
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="delta-servicos"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-900 text-white px-6 py-3 font-medium hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Criando..." : "Criar empresa"}
      </button>
    </form>
  );
}