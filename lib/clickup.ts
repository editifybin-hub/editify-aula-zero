const LIST_ID = process.env.CLICKUP_LIST_ID;
const TOKEN = process.env.CLICKUP_API_TOKEN;
const BASE = "https://api.clickup.com/api/v2";

// Field IDs do custom fields. NÃO ALTERAR sem revalidar via GET /list/{id}/field
const FIELD = {
  whatsapp: "19b1cd11-3b1b-4145-aed8-59e3b1bbaf0c",
  notas: "060f64fb-f59c-4505-9923-0deb0ef04adf",
  fonte_inicial: "fd31ca61-0f1e-4b6d-aa97-84702c18e0c2",
  fonte_extra: "c6356de1-4e95-4222-b4cc-b0aab384b1b3",
  primeira_captura: "13ff9337-251d-4a0b-80b8-b1c5422e5828",
  ultima_captura: "a3c4ca34-9462-4679-a8d9-41d33f235751",
  squeeze_check: "1dec6cbe-5137-4f83-91d1-f75387e74970",
  popup_az_check: "bf355cc9-0f8d-4763-9a54-c682d154350a",
  assistiu_az: "766dfea8-916c-459c-a67a-4d03da8af70a",
  segmento: "0aaf283e-8179-4ed1-acd3-c62428fa6376",
} as const;

const OPT = {
  fonte_inicial: {
    Squeeze: "4f5e8098-d924-4f25-b454-ec0d147e8541",
    AulaZero: "36cf922d-bff1-4b58-aeba-8f3b0e01e26b",
    Quiz: "408c1a8c-c2ac-4758-afde-211b6f4ea16d",
  },
  fonte_extra: {
    Squeeze: "5e9e172b-1635-45b0-b036-747ae8150aac",
    AulaZero: "b1e176f9-a5d6-47b7-9032-737f7431863c",
    Quiz: "d5bf6d96-0a4d-41d4-bd9b-8da33ea3aca4",
  },
  segmento: {
    QUENTE: "f19af1ec-abb1-47e8-b3ab-f0d2f120a5d9",
    Morno: "b4423942-e872-4387-b4ff-b77edec1218d",
    Frio: "48e6b63e-0de6-40e4-8fe5-d5d49ad00a09",
  },
  assistiu_az: {
    Sim: "a0b7f42a-329e-477d-9050-29f885ed231a",
    Nao_verificado: "b62153c7-f55c-4820-9cad-16d2ca6a0ba4",
  },
} as const;

function dateToMs(d?: Date): number {
  // Meio-dia UTC do dia atual (evita ambiguidade de timezone)
  const target = d ?? new Date();
  const iso = target.toISOString().slice(0, 10);
  return new Date(iso + "T12:00:00Z").getTime();
}

export function normalizePhone(
  raw: string | number | null | undefined
): string | null {
  if (raw == null || raw === "") return null;
  let s = typeof raw === "number" ? raw.toFixed(0) : String(raw).trim();
  if (!s || s.toLowerCase() === "nan") return null;
  s = s.replace(/\.0+$/, "");
  let digits = s.replace(/\D/g, "");
  if (!digits) return null;
  digits = digits.replace(/^0+/, "") || "0";
  // Códigos estrangeiros preservados
  if (/^34\d{8,10}$/.test(digits)) return "+" + digits;
  if (/^81\d{9,10}$/.test(digits)) return "+" + digits;
  if (/^351\d{9,10}$/.test(digits)) return "+" + digits;
  // Padrões BR
  if (digits.startsWith("55")) {
    const rest = digits.slice(2);
    if (rest.length === 11) return "55" + rest;
    if (rest.length === 10) {
      const ddd = rest.slice(0, 2);
      if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) {
        return "55" + ddd + "9" + rest.slice(2);
      }
    }
    return null;
  }
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) return "55" + digits;
  }
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) {
      return "55" + ddd + "9" + digits.slice(2);
    }
  }
  return digits;
}

type Source = "squeeze" | "aulazero";

export interface UpsertInput {
  source: Source;
  nome: string;
  whatsapp: string;
  email?: string;
}

type CustomFieldValue = string | number | boolean;
type CustomFieldUpdate = { id: string; value: CustomFieldValue };

interface ClickUpDropdownOption {
  id: string;
  name?: string;
  orderindex?: number;
}

interface ClickUpTaskField {
  id: string;
  value?: unknown;
  type?: string;
  type_config?: {
    options?: ClickUpDropdownOption[];
  };
}

interface ClickUpTask {
  id: string;
  custom_fields?: ClickUpTaskField[];
}

/**
 * ClickUp dropdown reads return value as orderindex (number) but writes accept
 * UUID. Resolve to UUID via type_config.options for safe equality comparison.
 */
function dropdownValueId(field: ClickUpTaskField | undefined): string | null {
  if (!field) return null;
  const val = field.value;
  if (val == null || val === "") return null;
  if (typeof val === "string") return val;
  if (typeof val === "number") {
    const opt = field.type_config?.options?.find(
      (o) => o.orderindex === val
    );
    return opt?.id ?? null;
  }
  return null;
}

function authHeaders(): HeadersInit {
  return {
    Authorization: TOKEN as string,
    "Content-Type": "application/json",
  };
}

async function findLeadByPhone(phone: string): Promise<string | null> {
  const phoneFormatted = phone.startsWith("+") ? phone : "+" + phone;
  const filter = JSON.stringify([
    {
      field_id: FIELD.whatsapp,
      operator: "=",
      value: phoneFormatted,
    },
  ]);
  const url = `${BASE}/list/${LIST_ID}/task?custom_fields=${encodeURIComponent(
    filter
  )}&include_closed=true`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(
      `ClickUp lookup falhou: ${res.status} ${await res.text()}`
    );
  }
  const data = (await res.json()) as { tasks?: ClickUpTask[] };
  return data.tasks?.[0]?.id ?? null;
}

async function createLead(input: UpsertInput, phone: string): Promise<string> {
  const todayMs = dateToMs();
  const phoneFormatted = "+" + phone;

  const customFields: CustomFieldUpdate[] = [
    { id: FIELD.whatsapp, value: phoneFormatted },
    { id: FIELD.primeira_captura, value: todayMs },
    { id: FIELD.ultima_captura, value: todayMs },
  ];

  const notas: string[] = [];
  if (input.email) notas.push(`Email: ${input.email}`);

  if (input.source === "squeeze") {
    customFields.push({
      id: FIELD.fonte_inicial,
      value: OPT.fonte_inicial.Squeeze,
    });
    customFields.push({ id: FIELD.squeeze_check, value: true });
    customFields.push({ id: FIELD.segmento, value: OPT.segmento.Frio });
    customFields.push({
      id: FIELD.assistiu_az,
      value: OPT.assistiu_az.Nao_verificado,
    });
  } else {
    customFields.push({
      id: FIELD.fonte_inicial,
      value: OPT.fonte_inicial.AulaZero,
    });
    customFields.push({ id: FIELD.popup_az_check, value: true });
    customFields.push({ id: FIELD.segmento, value: OPT.segmento.QUENTE });
    customFields.push({ id: FIELD.assistiu_az, value: OPT.assistiu_az.Sim });
  }

  if (notas.length) {
    customFields.push({ id: FIELD.notas, value: notas.join(" | ") });
  }

  const body = {
    name: input.nome || "(sem nome)",
    status: "não contatado",
    custom_fields: customFields,
  };

  const res = await fetch(`${BASE}/list/${LIST_ID}/task`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      `ClickUp create falhou: ${res.status} ${await res.text()}`
    );
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function updateLead(
  taskId: string,
  input: UpsertInput
): Promise<void> {
  // Buscar task atual pra saber estado dos campos antes de decidir updates
  const taskRes = await fetch(
    `${BASE}/task/${taskId}?include_subtasks=false`,
    { headers: { Authorization: TOKEN as string } }
  );
  if (!taskRes.ok) {
    throw new Error(`ClickUp get falhou: ${taskRes.status}`);
  }
  const task = (await taskRes.json()) as ClickUpTask;

  const todayMs = dateToMs();
  const cf = (id: string) =>
    task.custom_fields?.find((f) => f.id === id);
  const cfValue = (id: string) => cf(id)?.value;

  // Dropdown reads return orderindex; resolve to UUID for comparison.
  const fonteInicialAtual = dropdownValueId(cf(FIELD.fonte_inicial));
  const fonteExtraAtual = dropdownValueId(cf(FIELD.fonte_extra));
  const segmentoAtual = dropdownValueId(cf(FIELD.segmento));

  const updates: CustomFieldUpdate[] = [
    { id: FIELD.ultima_captura, value: todayMs },
  ];

  // Marcar checkbox da fonte específica desta submissão
  if (input.source === "squeeze") {
    updates.push({ id: FIELD.squeeze_check, value: true });
  } else {
    updates.push({ id: FIELD.popup_az_check, value: true });
    updates.push({ id: FIELD.assistiu_az, value: OPT.assistiu_az.Sim });
  }

  // Lógica de Fonte Inicial / Fonte Extra
  const optFonteInicial =
    input.source === "squeeze"
      ? OPT.fonte_inicial.Squeeze
      : OPT.fonte_inicial.AulaZero;
  const optFonteExtra =
    input.source === "squeeze"
      ? OPT.fonte_extra.Squeeze
      : OPT.fonte_extra.AulaZero;

  if (!fonteInicialAtual) {
    updates.push({ id: FIELD.fonte_inicial, value: optFonteInicial });
  } else if (fonteInicialAtual !== optFonteInicial && !fonteExtraAtual) {
    updates.push({ id: FIELD.fonte_extra, value: optFonteExtra });
  }

  // Upgrade de segmento: AulaZero promove pra QUENTE
  if (input.source === "aulazero") {
    if (
      segmentoAtual === OPT.segmento.Morno ||
      segmentoAtual === OPT.segmento.Frio
    ) {
      updates.push({ id: FIELD.segmento, value: OPT.segmento.QUENTE });
    }
  }

  // Email: append em Notas se ainda não estiver lá
  if (input.email) {
    const notasRaw = cfValue(FIELD.notas);
    const notasAtual = typeof notasRaw === "string" ? notasRaw : "";
    if (!notasAtual.includes(input.email)) {
      const novaNota = notasAtual
        ? `${notasAtual} | Email: ${input.email}`
        : `Email: ${input.email}`;
      updates.push({ id: FIELD.notas, value: novaNota });
    }
  }

  // Date fields need value_options.time=false to avoid timezone shifting.
  const dateFieldIds = new Set<string>([
    FIELD.primeira_captura,
    FIELD.ultima_captura,
  ]);

  // ClickUp atualiza custom fields em endpoint separado, um por chamada.
  await Promise.all(
    updates.map((u) => {
      const body = dateFieldIds.has(u.id)
        ? { value: u.value, value_options: { time: false } }
        : { value: u.value };
      return fetch(`${BASE}/task/${taskId}/field/${u.id}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) {
          console.error(
            `Update falhou no campo ${u.id}: ${r.status} ${await r.text()}`
          );
        }
      });
    })
  );
}

export async function upsertLead(
  input: UpsertInput
): Promise<{ taskId: string; created: boolean }> {
  if (!TOKEN || !LIST_ID) {
    throw new Error(
      "ClickUp não configurado (CLICKUP_API_TOKEN ou CLICKUP_LIST_ID faltando)"
    );
  }

  const phone = normalizePhone(input.whatsapp);
  if (!phone) throw new Error(`Telefone inválido: ${input.whatsapp}`);

  const existing = await findLeadByPhone(phone);
  if (existing) {
    await updateLead(existing, input);
    return { taskId: existing, created: false };
  }
  const taskId = await createLead(input, phone);
  return { taskId, created: true };
}
