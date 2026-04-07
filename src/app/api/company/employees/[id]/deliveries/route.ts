import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

type Params = {
  params: Promise<{ id: string }>;
};

type EmployeeRow = {
  id: string;
  full_name: string | null;
  company_id: string | null;
  job_title: string | null;
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
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

    const { data: deliveries, error: deliveriesError } = await supabase
      .from("deliveries")
      .select(`
        id,
        company_id,
        note,
        created_at,
        items:delivery_items(
          id,
          quantity,
          product:products(id,name,type,unit)
        )
      `)
      .eq("employee_id", id)
      .order("created_at", { ascending: false });

    if (deliveriesError) {
      return NextResponse.json(
        { error: deliveriesError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.full_name || "Funcionário",
        company_id: employee.company_id,
        job_title: employee.job_title,
      },
      items: deliveries ?? [],
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao listar entregas do funcionário.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}