import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type DeliveryInputItem = {
  product_id: string;
  quantity: number;
};

type DeliveryBody = {
  employee_id: string;
  note?: string | null;
  items?: DeliveryInputItem[];
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

type DeliveryListItemRow = {
  id: string;
  quantity: number;
  product:
    | {
        id: string;
        name: string;
        type: string;
        unit: string | null;
      }
    | {
        id: string;
        name: string;
        type: string;
        unit: string | null;
      }[]
    | null;
};

type DeliveryListRow = {
  id: string;
  company_id: string | null;
  employee_id: string;
  note: string | null;
  created_at: string;
  employee:
    | {
        id: string;
        full_name: string | null;
      }
    | {
        id: string;
        full_name: string | null;
      }[]
    | null;
  items: DeliveryListItemRow[] | null;
};

function normalizeItems(items?: DeliveryInputItem[]) {
  const grouped = new Map<string, number>();

  for (const item of items ?? []) {
    const productId = String(item.product_id || "").trim();
    const quantity = Number(item.quantity);

    if (!productId) continue;
    if (!Number.isFinite(quantity) || quantity <= 0) continue;

    grouped.set(productId, (grouped.get(productId) ?? 0) + quantity);
  }

  return Array.from(grouped.entries()).map(([product_id, quantity]) => ({
    product_id,
    quantity,
  }));
}

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
        note,
        created_at,
        employee:employees(id,full_name),
        items:delivery_items(
          id,
          quantity,
          product:products(id,name,type,unit)
        )
      `)
      .order("created_at", { ascending: false });

    if (employeeId) {
      query = query.eq("employee_id", employeeId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const deliveries = ((data ?? []) as DeliveryListRow[]).filter((delivery) => {
      if (!productId) return true;

      return (delivery.items ?? []).some((item) => {
        const product = Array.isArray(item.product) ? item.product[0] : item.product;
        return product?.id === productId;
      });
    });

    return NextResponse.json({ items: deliveries });
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

    if (!body.employee_id) {
      return NextResponse.json(
        { error: "Funcionário é obrigatório." },
        { status: 400 }
      );
    }

    const normalizedItems = normalizeItems(body.items);

    if (normalizedItems.length === 0) {
      return NextResponse.json(
        { error: "Adicione pelo menos um item na entrega." },
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

    const productIds = normalizedItems.map((item) => item.product_id);

    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select("id, company_id, name, stock, unit")
      .in("id", productIds);

    if (productsError) {
      return NextResponse.json(
        { error: productsError.message },
        { status: 400 }
      );
    }

    const products = (productsData ?? []) as ProductRow[];
    const productsMap = new Map(products.map((product) => [product.id, product]));

    for (const item of normalizedItems) {
      const product = productsMap.get(item.product_id);

      if (!product) {
        return NextResponse.json(
          { error: "Um dos produtos informados não foi encontrado." },
          { status: 404 }
        );
      }

      if (!product.company_id) {
        return NextResponse.json(
          { error: `O produto "${product.name}" está sem company_id.` },
          { status: 400 }
        );
      }

      if (product.company_id !== employee.company_id) {
        return NextResponse.json(
          { error: `O produto "${product.name}" pertence a outra empresa.` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}.`,
          },
          { status: 400 }
        );
      }
    }

    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .insert({
        company_id: employee.company_id,
        employee_id: body.employee_id,
        note: body.note?.trim() || null,
      })
      .select("id, company_id, employee_id, note, created_at")
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: deliveryError?.message || "Erro ao criar entrega." },
        { status: 400 }
      );
    }

    const employeeName = employee.full_name || "Funcionário";

    const deliveryItemsPayload = normalizedItems.map((item) => ({
      company_id: employee.company_id as string,
      delivery_id: delivery.id as string,
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    const stockMovementsPayload = normalizedItems.map((item) => ({
      company_id: employee.company_id as string,
      product_id: item.product_id,
      movement_type: "OUT",
      quantity: item.quantity,
      note: `Entrega para ${employeeName}${
        body.note?.trim() ? ` - ${body.note.trim()}` : ""
      }`,
    }));

    const { error: deliveryItemsError } = await supabase
      .from("delivery_items")
      .insert(deliveryItemsPayload);

    if (deliveryItemsError) {
      await supabase.from("deliveries").delete().eq("id", delivery.id);

      return NextResponse.json(
        {
          error: `Falha ao registrar itens da entrega: ${deliveryItemsError.message}`,
        },
        { status: 400 }
      );
    }

    const { error: movementError } = await supabase
      .from("stock_movements")
      .insert(stockMovementsPayload);

    if (movementError) {
      await supabase.from("delivery_items").delete().eq("delivery_id", delivery.id);
      await supabase.from("deliveries").delete().eq("id", delivery.id);

      return NextResponse.json(
        {
          error: `Falha ao registrar movimentação de estoque: ${movementError.message}`,
        },
        { status: 400 }
      );
    }

    for (const item of normalizedItems) {
      const product = productsMap.get(item.product_id);

      if (!product) {
        return NextResponse.json(
          { error: "Produto não encontrado ao atualizar estoque." },
          { status: 400 }
        );
      }

      const newStock = product.stock - item.quantity;

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", product.id);

      if (updateError) {
        return NextResponse.json(
          {
            error: `Erro ao baixar estoque do produto "${product.name}": ${updateError.message}`,
          },
          { status: 400 }
        );
      }
    }

    const { data: createdDelivery, error: createdDeliveryError } = await supabase
      .from("deliveries")
      .select(`
        id,
        company_id,
        employee_id,
        note,
        created_at,
        employee:employees(id,full_name),
        items:delivery_items(
          id,
          quantity,
          product:products(id,name,type,unit)
        )
      `)
      .eq("id", delivery.id)
      .single();

    if (createdDeliveryError || !createdDelivery) {
      return NextResponse.json(
        {
          error:
            createdDeliveryError?.message ||
            "Entrega registrada, mas houve erro ao retornar os dados.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ item: createdDelivery }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar entrega.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}