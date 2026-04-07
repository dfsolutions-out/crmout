import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type Params = {
  params: Promise<{ id: string }>;
};

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

async function getCompanyId() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, companyId: null, error: "Não autenticado.", status: 401 };
  }

  const { data: member, error: memberError } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", user.id)
    .single<CompanyMemberRow>();

  if (memberError || !member?.company_id) {
    return {
      supabase,
      companyId: null,
      error: "Empresa do usuário não encontrada.",
      status: 400,
    };
  }

  return { supabase, companyId: member.company_id, error: null, status: 200 };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getCompanyId();

    if (!session.companyId || session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { data, error } = await session.supabase
      .from("suppliers")
      .select("*")
      .eq("id", id)
      .eq("company_id", session.companyId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Fornecedor não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar fornecedor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getCompanyId();

    if (!session.companyId || session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const body = (await req.json()) as SupplierBody;

    if (!clean(body.name)) {
      return NextResponse.json(
        { error: "Nome do fornecedor é obrigatório." },
        { status: 400 }
      );
    }

    const payload = {
      name: clean(body.name),
      cnpj: clean(body.cnpj),
      contact_name: clean(body.contact_name),
      phone: clean(body.phone),
      email: clean(body.email),
      notes: clean(body.notes),
      is_active: body.is_active ?? true,
    };

    const { data, error } = await session.supabase
      .from("suppliers")
      .update(payload)
      .eq("id", id)
      .eq("company_id", session.companyId)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Erro ao salvar fornecedor." },
        { status: 400 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao salvar fornecedor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await getCompanyId();

    if (!session.companyId || session.error) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    const { error } = await session.supabase
      .from("suppliers")
      .delete()
      .eq("id", id)
      .eq("company_id", session.companyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir fornecedor.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}