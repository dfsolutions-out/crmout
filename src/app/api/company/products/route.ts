import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type ProductType = "EPI" | "UNIFORME" | "OUTRO";

type ProductInsertBody = {
  name: string;
  sku?: string | null;
  type: ProductType;
  unit?: string | null;
  stock?: number;
  min_stock?: number;
  is_active?: boolean;
};

type CompanyMemberRow = {
  company_id: string | null;
};

function isProductType(value: string): value is ProductType {
  return value === "EPI" || value === "UNIFORME" || value === "OUTRO";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const type = searchParams.get("type")?.trim() ?? "";
    const active = searchParams.get("active")?.trim() ?? "";

    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (q) {
      query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
    }

    if (type && isProductType(type)) {
      query = query.eq("type", type);
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
      error instanceof Error ? error.message : "Erro ao listar produtos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const body = (await req.json()) as ProductInsertBody;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }

    if (!isProductType(body.type)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const { data: member, error: memberError } = await supabase
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id)
      .single<CompanyMemberRow>();

    if (memberError || !member?.company_id) {
      return NextResponse.json(
        { error: "Não foi possível localizar a empresa do usuário logado." },
        { status: 400 }
      );
    }

    const stock = Number(body.stock ?? 0);
    const minStock = Number(body.min_stock ?? 0);

    const { data, error } = await supabase
      .from("products")
      .insert({
        company_id: member.company_id,
        name: body.name.trim(),
        sku: body.sku?.trim() || null,
        type: body.type,
        unit: body.unit?.trim() || "UN",
        stock: Number.isFinite(stock) ? stock : 0,
        min_stock: Number.isFinite(minStock) ? minStock : 0,
        is_active: body.is_active ?? true,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar produto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}