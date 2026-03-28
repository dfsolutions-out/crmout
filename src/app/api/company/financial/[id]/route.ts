import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type UpdateBody = {
  type?: "PAGAR" | "RECEBER";
  description?: string;
  category?: string | null;
  amount?: number;
  due_date?: string;
  status?: "PENDENTE" | "PAGO" | "VENCIDO";
  paid_at?: string | null;
  notes?: string | null;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (membershipError || !membership?.company_id) {
      return NextResponse.json(
        { error: "Empresa não encontrada para este usuário." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as UpdateBody;

    const payload: Record<string, unknown> = {};

    if (body.type !== undefined) payload.type = body.type;
    if (body.description !== undefined) payload.description = body.description.trim();
    if (body.category !== undefined) payload.category = body.category?.trim() || null;
    if (body.amount !== undefined) payload.amount = Number(body.amount);
    if (body.due_date !== undefined) payload.due_date = body.due_date;
    if (body.status !== undefined) payload.status = body.status;
    if (body.paid_at !== undefined) payload.paid_at = body.paid_at;
    if (body.notes !== undefined) payload.notes = body.notes?.trim() || null;

    const { error } = await supabase
      .from("financial_entries")
      .update(payload)
      .eq("id", id)
      .eq("company_id", membership.company_id);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao atualizar lançamento." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao atualizar lançamento.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (membershipError || !membership?.company_id) {
      return NextResponse.json(
        { error: "Empresa não encontrada para este usuário." },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("financial_entries")
      .delete()
      .eq("id", id)
      .eq("company_id", membership.company_id);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao excluir lançamento." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao excluir lançamento.",
      },
      { status: 500 }
    );
  }
}