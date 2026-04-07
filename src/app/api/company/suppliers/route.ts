import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type SupplierBody = {
  name: string;
  cnpj?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  is_active?: boolean;
};

type CompanyMemberRow = {
  company_id: string | null;
};

function clean(value?: string | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: member, error: memberError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .single<CompanyMemberRow>();

    if (memberError || !member?.company_id) {
      return NextResponse.json(
        { error: "Empresa do usuário não encontrada." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const active = searchParams.get("active")?.trim() ?? "";

    let query = supabase
      .from("suppliers")
      .select("*")
      .eq("company_id", member.company_id)
      .order("name", { ascending: true });

    if (q) {
      query = query.or(
        `name.ilike.%${q}%,cnpj.ilike.%${q}%,contact_name.ilike.%${q}%,email.ilike.%${q}%`
      );
    }

    if (active === "true") {
      query = query.eq("is_active", true);
    }

    if (active === "false") {
      query = query.eq("is_active", false);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar fornecedores.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: member, error: memberError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .single<CompanyMemberRow>();

    if (memberError || !member?.company_id) {
      return NextResponse.json(
        { error: "Empresa do usuário não encontrada." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as SupplierBody;

    if (!clean(body.name)) {
      return NextResponse.json(
        { error: "Nome do fornecedor é obrigatório." },
        { status: 400 }
      );
    }

    const payload = {
      company_id: member.company_id,
      name: clean(body.name),
      cnpj: clean(body.cnpj),
      contact_name: clean(body.contact_name),
      phone: clean(body.phone),
      email: clean(body.email),
      notes: clean(body.notes),
      is_active: body.is_active ?? true,
    };

    const { data, error } = await supabase
      .from("suppliers")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar fornecedor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}