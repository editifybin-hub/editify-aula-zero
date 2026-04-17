import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let authClient: InstanceType<typeof google.auth.JWT> | null = null;

function normalizePrivateKey(raw: string | undefined): string {
  if (!raw) return "";
  let key = raw.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  key = key.replace(/\\n/g, "\n");

  // Reconstruct PEM if it was flattened to a single line
  if (!key.includes("\n") && key.includes("BEGIN") && key.includes("END")) {
    const headerMatch = key.match(/-----BEGIN [^-]+-----/);
    const footerMatch = key.match(/-----END [^-]+-----/);
    if (headerMatch && footerMatch) {
      const header = headerMatch[0];
      const footer = footerMatch[0];
      const bodyStart = key.indexOf(header) + header.length;
      const bodyEnd = key.indexOf(footer);
      const rawBody = key.slice(bodyStart, bodyEnd).replace(/\s+/g, "");
      const wrapped = rawBody.match(/.{1,64}/g)?.join("\n") ?? rawBody;
      key = `${header}\n${wrapped}\n${footer}\n`;
    }
  }

  return key;
}

export class GoogleSheetsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleSheetsConfigError";
  }
}

function getAuth() {
  if (authClient) return authClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email) {
    throw new GoogleSheetsConfigError(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL não configurada."
    );
  }
  const key = normalizePrivateKey(rawKey);
  if (!key || !key.includes("BEGIN") || !key.includes("PRIVATE KEY")) {
    throw new GoogleSheetsConfigError(
      "GOOGLE_PRIVATE_KEY ausente ou mal formatada."
    );
  }

  authClient = new google.auth.JWT({
    email,
    key,
    scopes: SCOPES,
  });
  return authClient;
}

export async function appendToSheet(
  sheetName: string,
  values: string[][]
): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new GoogleSheetsConfigError("GOOGLE_SHEET_ID não configurada.");
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}
