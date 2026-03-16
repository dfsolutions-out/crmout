"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

type EmployeeMode = "create" | "edit";

type EmployeeRow = {
  id: string;
  company_id: string;
  photo_path: string | null;
  full_name: string | null;
  cpf: string | null;
  birth_date: string | null;
  rg: string | null;
  email: string | null;
  phone_1: string | null;
  phone_2: string | null;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  job_title: string | null;
  workplace: string | null;
  work_days: string[] | null;
  entry_time: string | null;
  lunch_start_time: string | null;
  lunch_end_time: string | null;
  exit_time: string | null;
  start_date: string | null;
  is_active: boolean;
  receives_insalubrity: boolean;
  receives_danger_pay: boolean;
  gross_salary: number | null;
  net_salary: number | null;
  inss_value: number | null;
  fgts_value: number | null;
  food_allowance: number | null;
  transport_allowance: number | null;
  ctps: string | null;
  pis_nis: string | null;
  cnh: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  pix_key: string | null;
  marital_status: string | null;
  education_level: string | null;
};

type NoteRow = {
  id: string;
  note_text: string;
  created_at: string;
};

type DocumentRow = {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  created_at: string;
};

type EmployeeFormProps = {
  mode: EmployeeMode;
  initialEmployee?: EmployeeRow;
  initialNotes?: NoteRow[];
  initialDocuments?: DocumentRow[];
};

type EditableNote = {
  id?: string;
  note_text: string;
  created_at?: string;
  isNew?: boolean;
  removed?: boolean;
};

const DAYS = [
  { value: "SEG", label: "Seg" },
  { value: "TER", label: "Ter" },
  { value: "QUA", label: "Qua" },
  { value: "QUI", label: "Qui" },
  { value: "SEX", label: "Sex" },
  { value: "SAB", label: "Sáb" },
  { value: "DOM", label: "Dom" },
];

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCPF(value: string) {
  const v = onlyDigits(value).slice(0, 11);
  if (v.length <= 3) return v;
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`;
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9, 11)}`;
}

function maskPhone(value: string) {
  const v = onlyDigits(value).slice(0, 11);
  if (v.length <= 2) return v;
  if (v.length <= 6) return `(${v.slice(0, 2)})${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0, 2)})${v.slice(2, 6)}-${v.slice(6)}`;
  return `(${v.slice(0, 2)})${v.slice(2, 7)}-${v.slice(7, 11)}`;
}

function maskCEP(value: string) {
  const v = onlyDigits(value).slice(0, 8);
  if (v.length <= 5) return v;
  return `${v.slice(0, 5)}-${v.slice(5, 8)}`;
}

function maskUF(value: string) {
  return value
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2);
}

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function EmployeeForm({
  mode,
  initialEmployee,
  initialNotes = [],
  initialDocuments = [],
}: EmployeeFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState(initialEmployee?.full_name || "");
  const [cpf, setCpf] = useState(initialEmployee?.cpf || "");
  const [birthDate, setBirthDate] = useState(initialEmployee?.birth_date || "");
  const [rg, setRg] = useState(initialEmployee?.rg || "");
  const [email, setEmail] = useState(initialEmployee?.email || "");
  const [phone1, setPhone1] = useState(initialEmployee?.phone_1 || "");
  const [phone2, setPhone2] = useState(initialEmployee?.phone_2 || "");

  const [zipCode, setZipCode] = useState(initialEmployee?.zip_code || "");
  const [street, setStreet] = useState(initialEmployee?.street || "");
  const [number, setNumber] = useState(initialEmployee?.number || "");
  const [complement, setComplement] = useState(
    initialEmployee?.complement || "",
  );
  const [district, setDistrict] = useState(initialEmployee?.district || "");
  const [city, setCity] = useState(initialEmployee?.city || "");
  const [state, setState] = useState(initialEmployee?.state || "");

  const [jobTitle, setJobTitle] = useState(initialEmployee?.job_title || "");
  const [workplace, setWorkplace] = useState(initialEmployee?.workplace || "");
  const [startDate, setStartDate] = useState(initialEmployee?.start_date || "");

  const [workDays, setWorkDays] = useState<string[]>(
    initialEmployee?.work_days || [],
  );
  const [entryTime, setEntryTime] = useState(initialEmployee?.entry_time || "");
  const [lunchStartTime, setLunchStartTime] = useState(
    initialEmployee?.lunch_start_time || "",
  );
  const [lunchEndTime, setLunchEndTime] = useState(
    initialEmployee?.lunch_end_time || "",
  );
  const [exitTime, setExitTime] = useState(initialEmployee?.exit_time || "");

  const [grossSalary, setGrossSalary] = useState(
    String(initialEmployee?.gross_salary ?? ""),
  );
  const [netSalary, setNetSalary] = useState(
    String(initialEmployee?.net_salary ?? ""),
  );
  const [inssValue, setInssValue] = useState(
    String(initialEmployee?.inss_value ?? ""),
  );
  const [fgtsValue, setFgtsValue] = useState(
    String(initialEmployee?.fgts_value ?? ""),
  );
  const [foodAllowance, setFoodAllowance] = useState(
    String(initialEmployee?.food_allowance ?? ""),
  );
  const [transportAllowance, setTransportAllowance] = useState(
    String(initialEmployee?.transport_allowance ?? ""),
  );

  const [ctps, setCtps] = useState(initialEmployee?.ctps || "");
  const [pisNis, setPisNis] = useState(initialEmployee?.pis_nis || "");
  const [cnh, setCnh] = useState(initialEmployee?.cnh || "");
  const [bankName, setBankName] = useState(initialEmployee?.bank_name || "");
  const [bankAgency, setBankAgency] = useState(
    initialEmployee?.bank_agency || "",
  );
  const [bankAccount, setBankAccount] = useState(
    initialEmployee?.bank_account || "",
  );
  const [pixKey, setPixKey] = useState(initialEmployee?.pix_key || "");
  const [maritalStatus, setMaritalStatus] = useState(
    initialEmployee?.marital_status || "",
  );
  const [educationLevel, setEducationLevel] = useState(
    initialEmployee?.education_level || "",
  );

  const [isActive, setIsActive] = useState(initialEmployee?.is_active ?? true);
  const [receivesInsalubrity, setReceivesInsalubrity] = useState(
    initialEmployee?.receives_insalubrity ?? false,
  );
  const [receivesDangerPay, setReceivesDangerPay] = useState(
    initialEmployee?.receives_danger_pay ?? false,
  );

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const [newDocuments, setNewDocuments] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] =
    useState<DocumentRow[]>(initialDocuments);
  const [documentsToDelete, setDocumentsToDelete] = useState<string[]>([]);

  const [notes, setNotes] = useState<EditableNote[]>(
    initialNotes.map((note) => ({
      id: note.id,
      note_text: note.note_text,
      created_at: note.created_at,
      isNew: false,
      removed: false,
    })),
  );
  const [noteDraft, setNoteDraft] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);

  useEffect(() => {
    let localUrl = "";
    if (photoFile) {
      localUrl = URL.createObjectURL(photoFile);
      setPhotoPreview(localUrl);
      return () => {
        URL.revokeObjectURL(localUrl);
      };
    }
  }, [photoFile]);

  useEffect(() => {
    async function loadExistingPhoto() {
      if (!initialEmployee?.photo_path || photoFile || removeCurrentPhoto)
        return;

      const { data, error } = await supabase.storage
        .from("employee-photos")
        .createSignedUrl(initialEmployee.photo_path, 3600);

      if (!error && data?.signedUrl) {
        setPhotoPreview(data.signedUrl);
      }
    }

    loadExistingPhoto();
  }, [initialEmployee?.photo_path, photoFile, removeCurrentPhoto, supabase]);

  const selectedDaysText = useMemo(() => {
    if (workDays.length === 0) return "—";
    return workDays.join(", ");
  }, [workDays]);

  function toggleWorkDay(day: string) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day],
    );
  }

  async function handleCepBlur() {
    const cepDigits = onlyDigits(zipCode);
    if (cepDigits.length !== 8) return;

    try {
      setSearchingCep(true);
      const response = await fetch(
        `https://viacep.com.br/ws/${cepDigits}/json/`,
      );
      const data = await response.json();

      if (data.erro) return;

      setStreet(data.logradouro || "");
      setDistrict(data.bairro || "");
      setCity(data.localidade || "");
      setState((data.uf || "").toUpperCase());
      setComplement(data.complemento || "");
    } catch {
      // sem ação
    } finally {
      setSearchingCep(false);
    }
  }

  function addNote() {
    const text = noteDraft.trim();
    if (!text) return;

    setNotes((prev) => [
      {
        note_text: text,
        isNew: true,
        removed: false,
      },
      ...prev,
    ]);
    setNoteDraft("");
  }

  function updateNote(index: number, value: string) {
    setNotes((prev) =>
      prev.map((note, i) =>
        i === index ? { ...note, note_text: value } : note,
      ),
    );
  }

  function removeNote(index: number) {
    setNotes((prev) =>
      prev.map((note, i) =>
        i === index
          ? note.id
            ? { ...note, removed: true }
            : { ...note, removed: true }
          : note,
      ),
    );
  }

  function restoreNote(index: number) {
    setNotes((prev) =>
      prev.map((note, i) => (i === index ? { ...note, removed: false } : note)),
    );
  }

  function handleDocumentsChange(files: FileList | null) {
    if (!files) return;
    setNewDocuments((prev) => [...prev, ...Array.from(files)]);
  }

  function removeNewDocument(index: number) {
    setNewDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  function markExistingDocumentForDelete(docId: string) {
    setDocumentsToDelete((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId],
    );
  }

  async function saveEmployee() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado.");

      const { data: membership, error: membershipError } = await supabase
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (membershipError || !membership) {
        throw new Error("Empresa do usuário não encontrada.");
      }

      const companyId = membership.company_id;

      const payload = {
        company_id: companyId,
        full_name: fullName.trim() || null,
        cpf: cpf || null,
        birth_date: birthDate || null,
        rg: rg.trim() || null,
        email: email.trim() || null,
        phone_1: phone1 || null,
        phone_2: phone2 || null,
        zip_code: zipCode || null,
        street: street.trim() || null,
        number: number.trim() || null,
        complement: complement.trim() || null,
        district: district.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        job_title: jobTitle.trim() || null,
        workplace: workplace.trim() || null,
        work_days: workDays,
        entry_time: entryTime || null,
        lunch_start_time: lunchStartTime || null,
        lunch_end_time: lunchEndTime || null,
        exit_time: exitTime || null,
        start_date: startDate || null,
        is_active: isActive,
        receives_insalubrity: receivesInsalubrity,
        receives_danger_pay: receivesDangerPay,
        gross_salary: grossSalary ? Number(grossSalary) : 0,
        net_salary: netSalary ? Number(netSalary) : 0,
        inss_value: inssValue ? Number(inssValue) : 0,
        fgts_value: fgtsValue ? Number(fgtsValue) : 0,
        food_allowance: foodAllowance ? Number(foodAllowance) : 0,
        transport_allowance: transportAllowance
          ? Number(transportAllowance)
          : 0,
        ctps: ctps.trim() || null,
        pis_nis: pisNis.trim() || null,
        cnh: cnh.trim() || null,
        bank_name: bankName.trim() || null,
        bank_agency: bankAgency.trim() || null,
        bank_account: bankAccount.trim() || null,
        pix_key: pixKey.trim() || null,
        marital_status: maritalStatus.trim() || null,
        education_level: educationLevel.trim() || null,
        created_by: user.id,
      };

      let employeeId = initialEmployee?.id || "";
      let currentPhotoPath = initialEmployee?.photo_path || null;

      if (mode === "create") {
        const { data, error: insertError } = await supabase
          .from("employees")
          .insert(payload)
          .select("id")
          .single();

        if (insertError || !data) {
          throw new Error(
            insertError?.message || "Não foi possível criar o funcionário.",
          );
        }

        employeeId = data.id;
      } else {
        const { error: updateError } = await supabase
          .from("employees")
          .update(payload)
          .eq("id", employeeId)
          .eq("company_id", companyId);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      if (!employeeId) {
        throw new Error("Funcionário inválido.");
      }

      if (mode === "edit" && removeCurrentPhoto && currentPhotoPath) {
        await supabase.storage
          .from("employee-photos")
          .remove([currentPhotoPath]);
        const { error: clearPhotoError } = await supabase
          .from("employees")
          .update({ photo_path: null })
          .eq("id", employeeId)
          .eq("company_id", companyId);

        if (clearPhotoError) throw new Error(clearPhotoError.message);
        currentPhotoPath = null;
      }

      if (photoFile) {
        if (currentPhotoPath) {
          await supabase.storage
            .from("employee-photos")
            .remove([currentPhotoPath]);
        }

        const photoPath = `${companyId}/${employeeId}/photo-${Date.now()}-${sanitizeFileName(photoFile.name)}`;
        const { error: uploadPhotoError } = await supabase.storage
          .from("employee-photos")
          .upload(photoPath, photoFile, {
            upsert: true,
          });

        if (uploadPhotoError) throw new Error(uploadPhotoError.message);

        const { error: photoUpdateError } = await supabase
          .from("employees")
          .update({ photo_path: photoPath })
          .eq("id", employeeId)
          .eq("company_id", companyId);

        if (photoUpdateError) throw new Error(photoUpdateError.message);
      }

      if (documentsToDelete.length > 0) {
        const docsToDelete = existingDocuments.filter((doc) =>
          documentsToDelete.includes(doc.id),
        );

        if (docsToDelete.length > 0) {
          await supabase.storage
            .from("employee-documents")
            .remove(docsToDelete.map((doc) => doc.file_path));

          const { error: deleteDocsError } = await supabase
            .from("employee_documents")
            .delete()
            .in(
              "id",
              docsToDelete.map((doc) => doc.id),
            )
            .eq("employee_id", employeeId)
            .eq("company_id", companyId);

          if (deleteDocsError) throw new Error(deleteDocsError.message);
        }
      }

      if (newDocuments.length > 0) {
        for (const file of newDocuments) {
          const docPath = `${companyId}/${employeeId}/doc-${Date.now()}-${sanitizeFileName(file.name)}`;
          const { error: uploadDocError } = await supabase.storage
            .from("employee-documents")
            .upload(docPath, file, { upsert: false });

          if (uploadDocError) throw new Error(uploadDocError.message);

          const { error: docInsertError } = await supabase
            .from("employee_documents")
            .insert({
              company_id: companyId,
              employee_id: employeeId,
              file_name: file.name,
              file_path: docPath,
              mime_type: file.type || null,
              file_size_bytes: file.size,
              uploaded_by: user.id,
            });

          if (docInsertError) throw new Error(docInsertError.message);
        }
      }

      const notesToDelete = notes.filter((note) => note.id && note.removed);
      const notesToUpdate = notes.filter(
        (note) => note.id && !note.removed && !note.isNew,
      );
      const notesToCreate = notes.filter(
        (note) => !note.id && !note.removed && note.note_text.trim(),
      );

      for (const note of notesToDelete) {
        const { error: deleteNoteError } = await supabase
          .from("employee_notes")
          .delete()
          .eq("id", note.id!)
          .eq("employee_id", employeeId)
          .eq("company_id", companyId);

        if (deleteNoteError) throw new Error(deleteNoteError.message);
      }

      for (const note of notesToUpdate) {
        const { error: updateNoteError } = await supabase
          .from("employee_notes")
          .update({ note_text: note.note_text.trim() })
          .eq("id", note.id!)
          .eq("employee_id", employeeId)
          .eq("company_id", companyId);

        if (updateNoteError) throw new Error(updateNoteError.message);
      }

      if (notesToCreate.length > 0) {
        const { error: createNotesError } = await supabase
          .from("employee_notes")
          .insert(
            notesToCreate.map((note) => ({
              company_id: companyId,
              employee_id: employeeId,
              note_text: note.note_text.trim(),
              created_by: user.id,
            })),
          );

        if (createNotesError) throw new Error(createNotesError.message);
      }

      router.push(`/funcionarios/${employeeId}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar funcionário.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {mode === "create" ? "Novo Funcionário" : "Editar Funcionário"}
        </h1>
        <p className="text-slate-600 mt-2">
          {mode === "create"
            ? "Cadastre um novo funcionário no sistema."
            : "Atualize os dados do funcionário."}
        </p>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Foto do funcionário</h2>

          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="h-36 w-36 rounded-2xl border overflow-hidden bg-slate-50 flex items-center justify-center">
              {photoPreview && !removeCurrentPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Foto do funcionário"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-slate-500 text-center px-3">
                  Sem foto
                </span>
              )}
            </div>

            <div className="space-y-3">
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 hover:bg-slate-50">
                <span className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                  Escolher foto
                </span>
                <span className="text-sm text-slate-600">
                  {photoFile ? photoFile.name : "Nenhum arquivo escolhido"}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {photoFile ? (
                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remover foto selecionada
                </button>
              ) : null}

              {mode === "edit" && initialEmployee?.photo_path ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={removeCurrentPhoto}
                    onChange={(e) => setRemoveCurrentPhoto(e.target.checked)}
                  />
                  Remover foto atual
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Dados pessoais</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="CPF"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              inputMode="numeric"
            />

            <div className="space-y-2">
              <label className="text-sm text-slate-700">
                Data de nascimento
              </label>
              <input
                type="date"
                className="border rounded-xl px-4 py-3 w-full"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="RG"
              value={rg}
              onChange={(e) => setRg(e.target.value)}
            />

            <input
              type="email"
              className="border rounded-xl px-4 py-3"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Telefone 1"
              value={phone1}
              onChange={(e) => setPhone1(maskPhone(e.target.value))}
              inputMode="numeric"
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Telefone 2"
              value={phone2}
              onChange={(e) => setPhone2(maskPhone(e.target.value))}
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Endereço</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-700">CEP</label>
              <input
                className="border rounded-xl px-4 py-3 w-full"
                placeholder="00000-000"
                value={zipCode}
                onChange={(e) => setZipCode(maskCEP(e.target.value))}
                onBlur={handleCepBlur}
                inputMode="numeric"
              />
              {searchingCep ? (
                <p className="text-xs text-slate-500">
                  Buscando endereço pelo CEP...
                </p>
              ) : null}
            </div>

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Logradouro"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Número"
              value={number}
              onChange={(e) =>
                setNumber(onlyDigits(e.target.value).slice(0, 10))
              }
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Complemento"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Bairro"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Cidade"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="UF"
              value={state}
              onChange={(e) => setState(maskUF(e.target.value))}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Trabalho</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Função de trabalho"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />

            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Local de trabalho"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
            />

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Data de admissão</label>
              <input
                type="date"
                className="border rounded-xl px-4 py-3 w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-700">Status</label>
              <select
                className="border rounded-xl px-4 py-3 w-full"
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Dias de trabalho</h3>

            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const active = workDays.includes(day.value);

                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWorkDay(day.value)}
                    className={`rounded-xl border px-4 py-2 font-medium ${
                      active
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-900"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-slate-500">
              Selecionado: {selectedDaysText}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-4">Horário</h3>

            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-700">Entrada</label>
                <input
                  type="time"
                  className="border rounded-xl px-4 py-3 w-full"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-700">Saída almoço</label>
                <input
                  type="time"
                  className="border rounded-xl px-4 py-3 w-full"
                  value={lunchStartTime}
                  onChange={(e) => setLunchStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-700">Retorno almoço</label>
                <input
                  type="time"
                  className="border rounded-xl px-4 py-3 w-full"
                  value={lunchEndTime}
                  onChange={(e) => setLunchEndTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-700">Saída</label>
                <input
                  type="time"
                  className="border rounded-xl px-4 py-3 w-full"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-6 mt-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={receivesInsalubrity}
                onChange={(e) => setReceivesInsalubrity(e.target.checked)}
              />
              Recebe insalubridade
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={receivesDangerPay}
                onChange={(e) => setReceivesDangerPay(e.target.checked)}
              />
              Recebe periculosidade
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Valores</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Salário bruto"
              value={grossSalary}
              onChange={(e) => setGrossSalary(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Salário líquido"
              value={netSalary}
              onChange={(e) => setNetSalary(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="INSS"
              value={inssValue}
              onChange={(e) => setInssValue(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="FGTS"
              value={fgtsValue}
              onChange={(e) => setFgtsValue(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Vale alimentação"
              value={foodAllowance}
              onChange={(e) => setFoodAllowance(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Vale transporte"
              value={transportAllowance}
              onChange={(e) => setTransportAllowance(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Documentos e banco</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="CTPS"
              value={ctps}
              onChange={(e) => setCtps(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="PIS / NIS"
              value={pisNis}
              onChange={(e) => setPisNis(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="CNH"
              value={cnh}
              onChange={(e) => setCnh(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Banco"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Agência"
              value={bankAgency}
              onChange={(e) => setBankAgency(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Conta"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="PIX"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Estado civil"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
            />
            <input
              className="border rounded-xl px-4 py-3"
              placeholder="Escolaridade"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Upload de documentos</h2>

          <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 hover:bg-slate-50">
            <span className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Adicionar documentos
            </span>
            <span className="text-sm text-slate-600">
              {newDocuments.length > 0
                ? `${newDocuments.length} arquivo(s) selecionado(s)`
                : "Nenhum arquivo escolhido"}
            </span>

            <input
              type="file"
              multiple
              onChange={(e) => handleDocumentsChange(e.target.files)}
              className="hidden"
            />
          </label>

          {newDocuments.length > 0 ? (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">Novos arquivos</h3>
              {newDocuments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="border rounded-xl p-3 flex items-center justify-between"
                >
                  <span className="text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeNewDocument(index)}
                    className="text-red-600"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {mode === "edit" && existingDocuments.length > 0 ? (
            <div className="mt-6 space-y-2">
              <h3 className="font-medium">Documentos já enviados</h3>
              {existingDocuments.map((doc) => {
                const marked = documentsToDelete.includes(doc.id);

                return (
                  <div
                    key={doc.id}
                    className={`border rounded-xl p-3 flex items-center justify-between ${
                      marked ? "bg-red-50 border-red-200" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(doc.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => markExistingDocumentForDelete(doc.id)}
                      className={marked ? "text-slate-700" : "text-red-600"}
                    >
                      {marked ? "Desfazer" : "Excluir"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Observações</h2>

          <div className="flex gap-3 items-start">
            <textarea
              className="w-full border rounded-xl px-4 py-3 min-h-20"
              placeholder="Escreva uma observação..."
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <button
              type="button"
              onClick={addNote}
              className="border rounded-xl px-4 py-3 whitespace-nowrap"
            >
              + Adicionar
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {notes.filter((note) => !note.removed).length > 0 ? (
              notes.map((note, index) =>
                note.removed ? null : (
                  <div
                    key={note.id || `new-${index}`}
                    className="border rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-full space-y-2">
                        <p className="font-semibold">Obs</p>
                        <textarea
                          className="w-full border rounded-xl px-4 py-3 min-h-20"
                          value={note.note_text}
                          onChange={(e) => updateNote(index, e.target.value)}
                        />
                        {note.created_at ? (
                          <p className="text-xs text-slate-500">
                            {new Date(note.created_at).toLocaleString("pt-BR")}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeNote(index)}
                        className="border rounded-xl px-4 py-2"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ),
              )
            ) : (
              <div className="border rounded-xl p-4 text-slate-500">
                Nenhuma observação adicionada.
              </div>
            )}

            {notes.some((note) => note.removed) ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Observações removidas nesta edição
                </p>
                {notes.map((note, index) =>
                  note.removed ? (
                    <div
                      key={`removed-${note.id || index}`}
                      className="border rounded-xl p-3 flex items-center justify-between bg-slate-50"
                    >
                      <span className="text-sm line-through">
                        {note.note_text || "Observação vazia"}
                      </span>
                      <button
                        type="button"
                        onClick={() => restoreNote(index)}
                        className="text-blue-600"
                      >
                        Restaurar
                      </button>
                    </div>
                  ) : null,
                )}
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={saveEmployee}
            disabled={loading}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl disabled:opacity-60"
          >
            {loading
              ? "Salvando..."
              : mode === "create"
                ? "Criar Funcionário"
                : "Salvar alterações"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/funcionarios")}
            className="border px-6 py-3 rounded-xl"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
