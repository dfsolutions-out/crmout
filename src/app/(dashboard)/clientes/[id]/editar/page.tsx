import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";

type EditarClientePageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function atualizarCliente(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const companyName = String(formData.get("company_name") || "");
  const personName = String(formData.get("person_name") || "");
  const responsible1 = String(formData.get("responsible_1") || "");
  const responsible2 = String(formData.get("responsible_2") || "");
  const email1 = String(formData.get("email_1") || "");
  const email2 = String(formData.get("email_2") || "");
  const phone1 = String(formData.get("phone_1") || "");
  const phone2 = String(formData.get("phone_2") || "");
  const cnpj = String(formData.get("cnpj") || "");
  const cpf = String(formData.get("cpf") || "");
  const zipCode = String(formData.get("zip_code") || "");
  const street = String(formData.get("street") || "");
  const number = String(formData.get("number") || "");
  const complement = String(formData.get("complement") || "");
  const district = String(formData.get("district") || "");
  const city = String(formData.get("city") || "");
  const state = String(formData.get("state") || "");
  const registrationDate = String(formData.get("registration_date") || "");
  const observations = String(formData.get("observations") || "");
  const passwordMain = String(formData.get("password_main") || "");
  const passwordCounter = String(formData.get("password_counter") || "");
  const passwordPanic = String(formData.get("password_panic") || "");
  const isActive = String(formData.get("is_active") || "") === "true";

  const { error } = await supabase
    .from("clients")
    .update({
      company_name: companyName || null,
      person_name: personName || null,
      responsible_1: responsible1 || null,
      responsible_2: responsible2 || null,
      email_1: email1 || null,
      email_2: email2 || null,
      phone_1: phone1 || null,
      phone_2: phone2 || null,
      cnpj: cnpj || null,
      cpf: cpf || null,
      zip_code: zipCode || null,
      street: street || null,
      number: number || null,
      complement: complement || null,
      district: district || null,
      city: city || null,
      state: state || null,
      registration_date: registrationDate || null,
      observations: observations || null,
      password_main: passwordMain || null,
      password_counter: passwordCounter || null,
      password_panic: passwordPanic || null,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/clientes/${id}`);
}

export default async function EditarClientePage({
  params,
}: EditarClientePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !cliente) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Editar Cliente</h1>
        <div className="bg-white border rounded-xl p-6">
          <p className="text-red-600">Não foi possível carregar o cliente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Editar Cliente</h1>
        <p className="text-slate-600 mt-2">
          Atualize os dados do cliente.
        </p>
      </div>

      <form action={atualizarCliente} className="bg-white border rounded-2xl p-6 space-y-8">
        <input type="hidden" name="id" defaultValue={cliente.id} />

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="company_name"
            defaultValue={cliente.company_name || ""}
            placeholder="Nome da empresa"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="person_name"
            defaultValue={cliente.person_name || ""}
            placeholder="Contato / nome"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="cnpj"
            defaultValue={cliente.cnpj || ""}
            placeholder="CNPJ"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="cpf"
            defaultValue={cliente.cpf || ""}
            placeholder="CPF"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="responsible_1"
            defaultValue={cliente.responsible_1 || ""}
            placeholder="Responsável 1"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="responsible_2"
            defaultValue={cliente.responsible_2 || ""}
            placeholder="Responsável 2"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="email_1"
            defaultValue={cliente.email_1 || ""}
            placeholder="Email 1"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="email_2"
            defaultValue={cliente.email_2 || ""}
            placeholder="Email 2"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="phone_1"
            defaultValue={cliente.phone_1 || ""}
            placeholder="Telefone 1"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="phone_2"
            defaultValue={cliente.phone_2 || ""}
            placeholder="Telefone 2"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="zip_code"
            defaultValue={cliente.zip_code || ""}
            placeholder="CEP"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="street"
            defaultValue={cliente.street || ""}
            placeholder="Logradouro"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="number"
            defaultValue={cliente.number || ""}
            placeholder="Número"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="complement"
            defaultValue={cliente.complement || ""}
            placeholder="Complemento"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="district"
            defaultValue={cliente.district || ""}
            placeholder="Bairro"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="city"
            defaultValue={cliente.city || ""}
            placeholder="Cidade"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="state"
            defaultValue={cliente.state || ""}
            placeholder="Estado"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            type="date"
            name="registration_date"
            defaultValue={cliente.registration_date || ""}
            className="w-full border rounded-xl px-4 py-3"
          />
          <select
            name="is_active"
            defaultValue={cliente.is_active ? "true" : "false"}
            className="w-full border rounded-xl px-4 py-3"
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
          <input
            name="password_main"
            defaultValue={cliente.password_main || ""}
            placeholder="Senha boa"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="password_counter"
            defaultValue={cliente.password_counter || ""}
            placeholder="Contra-senha"
            className="w-full border rounded-xl px-4 py-3"
          />
          <input
            name="password_panic"
            defaultValue={cliente.password_panic || ""}
            placeholder="Senha pânico"
            className="w-full border rounded-xl px-4 py-3"
          />
        </div>

        <textarea
          name="observations"
          defaultValue={cliente.observations || ""}
          placeholder="Observações"
          className="w-full border rounded-xl px-4 py-3 min-h-32"
        />

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-slate-900 text-white px-6 py-3 rounded-xl"
          >
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  );
}