import { NextResponse } from "next/server";
import { google } from "googleapis";

/**
 * Diagnostic endpoint. GET /api/health?token=XYZ
 * Returns config status WITHOUT exposing secrets.
 * Set HEALTH_TOKEN env var to protect this endpoint.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expected = process.env.HEALTH_TOKEN;

  if (expected && token !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  checks.env_email = {
    ok: !!email,
    detail: email ? `present (${email.slice(0, 15)}...)` : "missing",
  };
  checks.env_sheet_id = {
    ok: !!sheetId,
    detail: sheetId ? `present (${sheetId.slice(0, 6)}...)` : "missing",
  };
  checks.env_private_key = {
    ok: !!rawKey,
    detail: rawKey ? `present (${rawKey.length} chars)` : "missing",
  };

  let key = "";
  if (rawKey) {
    key = rawKey.trim();
    if (
      (key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))
    ) {
      key = key.slice(1, -1);
    }
    key = key.replace(/\\n/g, "\n");
    const hasHeader = key.includes("BEGIN PRIVATE KEY");
    const hasFooter = key.includes("END PRIVATE KEY");
    const hasNewlines = key.includes("\n");
    checks.private_key_format = {
      ok: hasHeader && hasFooter && hasNewlines,
      detail: `header=${hasHeader} footer=${hasFooter} newlines=${hasNewlines}`,
    };
  }

  if (email && key && sheetId) {
    try {
      const auth = new google.auth.JWT({
        email,
        key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      const sheets = google.sheets({ version: "v4", auth });
      const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const tabs = meta.data.sheets?.map((s) => s.properties?.title) ?? [];
      checks.sheet_access = { ok: true, detail: `tabs: ${tabs.join(", ")}` };
      checks.tab_aulazero = {
        ok: tabs.includes("AulaZero"),
        detail: tabs.includes("AulaZero") ? "exists" : "MISSING",
      };
    } catch (err) {
      checks.sheet_access = {
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json({ ok: allOk, checks }, { status: allOk ? 200 : 500 });
}
