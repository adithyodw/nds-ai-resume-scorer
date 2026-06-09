/* ============================================================
   NDS TalentScore — résumé parsing
   PDF (unpdf), DOCX (mammoth), and ZIP expansion (jszip).
   Returns one ParsedDoc per résumé; ZIPs expand to many.
   ============================================================ */

export interface ParsedDoc {
  fileName: string;
  text: string;
  bytes: number;
  error?: string;
}

const PDF_RE = /\.pdf$/i;
const DOCX_RE = /\.docx?$/i;
const ZIP_RE = /\.zip$/i;

export function isSupported(name: string): boolean {
  return PDF_RE.test(name) || DOCX_RE.test(name) || ZIP_RE.test(name);
}

async function parsePdf(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : text;
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

async function parseOne(fileName: string, buffer: Buffer): Promise<string> {
  if (PDF_RE.test(fileName)) return parsePdf(buffer);
  if (DOCX_RE.test(fileName)) return parseDocx(buffer);
  throw new Error(`Unsupported file type: ${fileName}`);
}

async function expandZip(buffer: Buffer): Promise<ParsedDoc[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files).filter(
    (f) => !f.dir && (PDF_RE.test(f.name) || DOCX_RE.test(f.name)) && !f.name.startsWith("__MACOSX")
  );
  const docs: ParsedDoc[] = [];
  for (const entry of entries) {
    const baseName = entry.name.split("/").pop() || entry.name;
    try {
      const data = Buffer.from(await entry.async("arraybuffer"));
      const text = await parseOne(baseName, data);
      docs.push({ fileName: baseName, text, bytes: data.byteLength });
    } catch (e) {
      docs.push({
        fileName: baseName,
        text: "",
        bytes: 0,
        error: e instanceof Error ? e.message : "Failed to parse",
      });
    }
  }
  return docs;
}

/**
 * Parse an uploaded file into one or more ParsedDocs.
 * ZIP archives expand into one entry per contained résumé.
 */
export async function parseUpload(fileName: string, buffer: Buffer): Promise<ParsedDoc[]> {
  try {
    if (ZIP_RE.test(fileName)) return await expandZip(buffer);
    const text = await parseOne(fileName, buffer);
    return [{ fileName, text, bytes: buffer.byteLength }];
  } catch (e) {
    return [
      {
        fileName,
        text: "",
        bytes: buffer.byteLength,
        error: e instanceof Error ? e.message : "Failed to parse",
      },
    ];
  }
}
