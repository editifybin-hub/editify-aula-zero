import { NextResponse } from "next/server";
import { appendToSheet } from "@/lib/google-sheets";

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, 500));
    return fn();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, whatsapp, email } = body;

    const errors: string[] = [];
    const cleanName = typeof name === "string" ? name.trim().slice(0, 200) : "";
    if (!cleanName) errors.push("Nome é obrigatório.");

    const digits = typeof whatsapp === "string" ? whatsapp.replace(/\D/g, "") : "";
    if (digits.length < 10 || digits.length > 11) errors.push("WhatsApp inválido.");

    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase().slice(0, 254) : "";
    if (!cleanEmail || !/.+@.+\..+/.test(cleanEmail)) errors.push("E-mail inválido.");

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    const timestamp = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });

    await withRetry(() =>
      appendToSheet("AulaZero", [[timestamp, cleanName, digits, cleanEmail]])
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao salvar lead:", err);
    return NextResponse.json(
      { success: false, error: "Ocorreu um erro. Tente novamente." },
      { status: 500 }
    );
  }
}
