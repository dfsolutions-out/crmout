import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type Params = {
  params: Promise<{ id: string; deliveryId: string }>;
};

type EmployeeRow = {
  id: string;
  full_name: string | null;
  company_id: string | null;
  job_title: string | null;
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id, deliveryId } = await params;
    const supabase = await createClient();

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, full_name, company_id, job_title")
      .eq("id", id)
      .single<EmployeeRow>();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    const { data: delivery, error: deliveryError } = await supabase
      .from("deliveries")
      .select(`
        id,
        company_id,
        quantity,
        note,
        created_at,
        product:products(id,name,type,unit)
      `)
      .eq("id", deliveryId)
      .eq("employee_id", id)
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.full_name || "Funcionário",
        company_id: employee.company_id,
        job_title: employee.job_title,
      },
      delivery,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar entrega.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}