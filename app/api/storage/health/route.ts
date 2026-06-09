import { NextResponse } from "next/server";
import { getStorageInfo, listCandidates } from "@/lib/store";
import { hasBlobCredentials, isVercelRuntime } from "@/lib/persistence";

export const runtime = "nodejs";

export async function GET() {
  const info = getStorageInfo();
  let candidateCount = 0;
  let loadError: string | null = null;

  try {
    candidateCount = (await listCandidates()).length;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "load failed";
  }

  return NextResponse.json({
    vercel: isVercelRuntime(),
    blobConfigured: hasBlobCredentials(),
    hasReadWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    hasStoreId: Boolean(process.env.BLOB_STORE_ID?.trim()),
    ...info,
    candidateCount,
    loadError,
  });
}
