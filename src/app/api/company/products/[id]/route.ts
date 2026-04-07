import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type Params = {
  params: Promise<{ id: string }>;
};

type EmployeeRelation =
  | {
      id: string;
      full_name: string | null;
    }
  | {
      id: string;
      full_name: string | null;
    }[]
  | null;

type DeliveryRelation =
  | {
      id: string;
      note: string | null;
      created_at: string | null;
      employee?: EmployeeRelation;
    }
  | {
      id: string;
      note: string | null;
      created_at: string | null;
      employee?: EmployeeRelation;
    }[]
  | null;

type DeliveryItemRow = {
  id: string;
  quantity: number;
  delivery?: DeliveryRelation;
};

function getSingleEmployee(employee: EmployeeRelation) {
  if (!employee) return null;
  return Array.isArray(employee) ? (employee[0] ?? null) : employee;
}

function getSingleDelivery(delivery: DeliveryRelation) {
  if (!delivery) return null;
  return Array.isArray(delivery) ? (delivery[0] ?? null) : delivery;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: productError?.message || "Produto não encontrado." },
        { status: 404 }
      );
    }

    const { data: movements, error: movementsError } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (movementsError) {
      return NextResponse.json(
        { error: movementsError.message },
        { status: 400 }
      );
    }

    const { data: deliveryItems, error: deliveryItemsError } = await supabase
      .from("delivery_items")
      .select(`
        id,
        quantity,
        delivery:deliveries(
          id,
          note,
          created_at,
          employee:employees(id,full_name)
        )
      `)
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (deliveryItemsError) {
      return NextResponse.json(
        { error: deliveryItemsError.message },
        { status: 400 }
      );
    }

    const deliveries = ((deliveryItems ?? []) as DeliveryItemRow[]).map((entry) => {
      const rawDelivery = getSingleDelivery(entry.delivery ?? null);
      const rawEmployee = getSingleEmployee(rawDelivery?.employee ?? null);

      return {
        id: rawDelivery?.id ?? entry.id,
        quantity: entry.quantity,
        note: rawDelivery?.note ?? null,
        created_at: rawDelivery?.created_at ?? null,
        employee: rawEmployee
          ? {
              id: rawEmployee.id,
              name: rawEmployee.full_name || "Funcionário",
            }
          : null,
      };
    });

    return NextResponse.json({
      item: product,
      movements: movements ?? [],
      deliveries,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar produto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await req.json();

    const { data, error } = await supabase
      .from("products")
      .update(body)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ item: data });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao salvar produto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir produto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}