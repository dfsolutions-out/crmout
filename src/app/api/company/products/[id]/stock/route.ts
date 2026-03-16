import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type Params = {
  params: Promise<{ id: string }>;
};

type StockAction = "IN" | "OUT" | "ADJUST";

type StockBody = {
  action: StockAction;
  quantity: number;
  note?: string | null;
};

type ProductRow = {
  id: string;
  company_id: string | null;
  name: string;
  stock: number;
};

function isValidAction(value: string): value is StockAction {
  return value === "IN" || value === "OUT" || value === "ADJUST";
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const body = (await req.json()) as StockBody;
    const quantity = Number(body.quantity);

    if (!isValidAction(body.action)) {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, company_id, name, stock")
      .eq("id", id)
      .single<ProductRow>();

    if (productError || !product) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    if (!product.company_id) {
      return NextResponse.json(
        {
          error:
            "O produto está sem company_id. Corrija o company_id deste produto antes de movimentar o estoque.",
        },
        { status: 400 }
      );
    }

    let newStock = product.stock;

    if (body.action === "IN") {
      newStock = product.stock + quantity;
    }

    if (body.action === "OUT") {
      if (product.stock < quantity) {
        return NextResponse.json({ error: "Estoque insuficiente." }, { status: 400 });
      }
      newStock = product.stock - quantity;
    }

    if (body.action === "ADJUST") {
      newStock = quantity;
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", id)
      .select("id, company_id, name, stock")
      .single<ProductRow>();

    if (updateError || !updatedProduct) {
      return NextResponse.json(
        { error: updateError?.message || "Erro ao atualizar estoque." },
        { status: 400 }
      );
    }

    const movementNote =
      body.note?.trim() ||
      (body.action === "IN"
        ? "Entrada manual de estoque"
        : body.action === "OUT"
        ? "Saída manual de estoque"
        : "Ajuste manual de estoque");

    const movementPayload = {
      company_id: product.company_id,
      product_id: product.id,
      movement_type: body.action,
      quantity,
      note: movementNote,
    };

    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert(movementPayload);

    if (movementError) {
      return NextResponse.json(
        {
          error: `Estoque atualizado, mas falhou ao registrar movimentação: ${movementError.message}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      item: updatedProduct,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro interno no ajuste de estoque.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}