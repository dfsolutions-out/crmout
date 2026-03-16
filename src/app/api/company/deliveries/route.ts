import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type DeliveryBody = {
  employee_id: string;
  product_id: string;
  quantity: number;
  note?: string | null;
};

type EmployeeRow = {
  id: string;
  full_name: string | null;
  company_id: string | null;
};

type ProductRow = {
  id: string;
  company_id: string | null;
  name: string;
  stock: number;
  unit: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employee_id")?.trim() ?? "";
    const productId = searchParams.get("product_id")?.trim() ?? "";

    let query = supabase
      .from("deliveries")
      .select(`
        id,
        company_id,
        employee_id,
        product_id,
        quantity,
        note,
        created_at,
        employee:employees(id,full_name),
        product:products(id,name,type,unit)
      `)
      .order("created_at", { ascending: false });

    if (employeeId) query = query.eq("employee_id", employeeId);
    if (productId) query = query.eq("product_id", productId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar entregas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = (await req.json()) as DeliveryBody;
    const quantity = Number(body.quantity);

    if (!body.employee_id) {
      return NextResponse.json(
        { error: "Funcionário é obrigatório." },
        { status: 400 }
      );
    }

    if (!body.product_id) {
      return NextResponse.json(
        { error: "Produto é obrigatório." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Quantidade inválida." },
        { status: 400 }
      );
    }

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, full_name, company_id")
      .eq("id", body.employee_id)
      .single<EmployeeRow>();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    if (!employee.company_id) {
      return NextResponse.json(
        { error: "O funcionário está sem company_id." },
        { status: 400 }
      );
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, company_id, name, stock, unit")
      .eq("id", body.product_id)
      .single<ProductRow>();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 404 }
      );
    }

    if (!product.company_id) {
      return NextResponse.json(
        { error: "O produto está sem company_id." },
        { status: 400 }
      );
    }

    if (product.company_id !== employee.company_id) {
      return NextResponse.json(
        { error: "Produto e funcionário pertencem a empresas diferentes." },
        { status: 400 }
      );
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: "Estoque insuficiente para esta entrega." },
        { status: 400 }
      );
    }

    const employeeName = employee.full_name || "Funcionário";
    const movementNote = `Entrega para ${employeeName}${
      body.note?.trim() ? ` - ${body.note.trim()}` : ""
    }`;

    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert({
        company_id: product.company_id,
        product_id: product.id,
        movement_type: "OUT",
        quantity,
        note: movementNote,
      });

    if (movementError) {
      return NextResponse.json(
        {
          error: `Falha ao registrar movimentação de estoque: ${movementError.message}`,
        },
        { status: 400 }
      );
    }

    const newStock = product.stock - quantity;

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", product.id)
      .select("id, stock")
      .single();

    if (updateError || !updatedProduct) {
      return NextResponse.json(
        { error: updateError?.message || "Erro ao baixar estoque." },
        { status: 400 }
      );
    }

    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert({
        company_id: product.company_id,
        employee_id: body.employee_id,
        product_id: body.product_id,
        quantity,
        note: body.note?.trim() || null,
      })
      .select(`
        id,
        company_id,
        employee_id,
        product_id,
        quantity,
        note,
        created_at,
        employee:employees(id,full_name),
        product:products(id,name,type,unit)
      `)
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: deliveryError?.message || "Erro ao registrar entrega." },
        { status: 400 }
      );
    }

    return NextResponse.json({ item: delivery }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar entrega.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}