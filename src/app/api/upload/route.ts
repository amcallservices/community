import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireUser } from "@/lib/auth";

// Limite per singolo PDF (500 MB). Il file va direttamente dal browser all'archivio Vercel Blob,
// senza passare dal server, quindi non c'e' il limite di 4,5 MB delle funzioni.
const MAX_PDF_BYTES = 500 * 1024 * 1024;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const { user } = await requireUser();
        if (!user) throw new Error("Devi accedere per caricare un file");
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_PDF_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Caricamento non riuscito" }, { status: 400 });
  }
}
