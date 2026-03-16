import { createClient } from "@/src/lib/supabase/server";
import { EmployeeForm } from "@/src/components/employee-form";

type EditarFuncionarioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarFuncionarioPage({
  params,
}: EditarFuncionarioPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: funcionario, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !funcionario) {
    return (
      <div className="bg-white border rounded-xl p-6">
        <p className="text-red-600">Não foi possível carregar o funcionário.</p>
      </div>
    );
  }

  const { data: notes } = await supabase
    .from("employee_notes")
    .select("id, note_text, created_at")
    .eq("employee_id", id)
    .order("created_at", { ascending: false });

  const { data: documents } = await supabase
    .from("employee_documents")
    .select("id, file_name, file_path, mime_type, file_size_bytes, created_at")
    .eq("employee_id", id)
    .order("created_at", { ascending: false });

  return (
    <EmployeeForm
      mode="edit"
      initialEmployee={funcionario}
      initialNotes={notes || []}
      initialDocuments={documents || []}
    />
  );
}