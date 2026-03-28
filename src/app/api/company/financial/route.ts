import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type CreateBody = {
  type: "PAGAR" | "RECEBER";
  description: string;
  category?: string | null;
  amount: number;
  due_date: string;
  status?: "PENDENTE" | "PAGO" | "VENCIDO";
  paid_at?: string | null;
  notes?: string | null;
};

export async function POST(req: Request) {
  try {
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

    const body = (await req.json()) as CreateBody;

    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: "Descrição é obrigatória." },
        { status: 400 }
      );
    }

    if (!body.type || !["PAGAR", "RECEBER"].includes(body.type)) {
      return NextResponse.json(
        { error: "Tipo inválido." },
        { status: 400 }
      );
    }

    if (!body.due_date) {
      return NextResponse.json(
        { error: "Vencimento é obrigatório." },
        { status: 400 }
      );
    }

    if (Number(body.amount) <= 0) {
      return NextResponse.json(
        { error: "Valor deve ser maior que zero." },
        { status: 400 }
      );
    }

    const payload = {
      company_id: membership.company_id,
      type: body.type,
      description: body.description.trim(),
      category: body.category?.trim() || null,
      amount: Number(body.amount),
      due_date: body.due_date,
      status: body.status || "PENDENTE",
      paid_at: body.paid_at || null,
      notes: body.notes?.trim() || null,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("financial_entries")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao criar lançamento." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao criar lançamento.",
      },
      { status: 500 }
    );
  }
}