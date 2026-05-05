import { NextResponse } from "next/server";
import { appendToSheet, GoogleSheetsConfigError } from "@/lib/google-sheets";
import { upsertLead } from "@/lib/clickup";

function cleanPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length >= 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (err instanceof GoogleSheetsConfigError) throw err;
      if (attempt < maxAttempts) {
        const delay = 400 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

function mapErrorToResponse(err: unknown, requestId: string) {
  if (err instanceof GoogleSheetsConfigError) {
    console.error(`[${requestId}] Config error:`, err.message);
    return NextResponse.json(
      {
        success: false,
        error: "Sistema temporariamente indisponível. Tente em instantes.",
      },
      { status: 503 }
    );
  }

  const errStr = err instanceof Error ? err.message : String(err);
  console.error(`[${requestId}] Sheets error:`, errStr);

  if (/Unable to parse range/i.test(errStr)) {
    return NextResponse.json(
      {
        success: false,
        error: "Erro de configuração da planilha. Avise o suporte.",
      },
      { status: 500 }
    );
  }
  if (/permission|forbidden|403/i.test(errStr)) {
    return NextResponse.json(
      {
        success: false,
        error: "Erro de permissão. Avise o suporte.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, error: "Ocorreu um erro. Tente novamente." },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).slice(2, 10);

  try {
    const body = await request.json();
    const { name, whatsapp, email } = body;

    const errors: string[] = [];
    const cleanName = typeof name === "string" ? name.trim().slice(0, 200) : "";
    if (!cleanName) errors.push("Nome é obrigatório.");
    else if (cleanName.length < 2) errors.push("Nome muito curto.");

    const digits = typeof whatsapp === "string" ? cleanPhone(whatsapp) : "";
    if (digits.length < 10 || digits.length > 11)
      errors.push("WhatsApp inválido. Use DDD + número (ex: 11 99999-9999).");

    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : "";
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail))
      errors.push("E-mail inválido.");

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const timestamp = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    try {
      await withRetry(() =>
        appendToSheet("AulaZero", [[timestamp, cleanName, digits, cleanEmail]])
      );
    } catch (err) {
      return mapErrorToResponse(err, requestId);
    }

    // ClickUp upsert (best-effort — Sheets já garantiu o lead)
    try {
      const cu = await upsertLead({
        source: "aulazero",
        nome: cleanName,
        whatsapp: digits,
        email: cleanEmail,
      });
      console.log(
        `[${requestId}] ClickUp ${cu.created ? "created" : "updated"} task ${cu.taskId}`
      );
    } catch (err) {
      console.error(`[${requestId}] ClickUp falhou (não bloqueia):`, err);
    }

    return NextResponse.json({ success: true, requestId });
  } catch (err) {
    console.error(`[${requestId}] Unexpected error:`, err);
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro. Tente novamente." },
      { status: 500 }
    );
  }
}
