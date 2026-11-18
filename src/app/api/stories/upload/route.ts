import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireUser, suspendedError } from "@/lib/auth";

// Le stories vanno direttamente dal browser all'archivio Blob (niente limite di 4,5 MB del server).
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const { user } = await requireUser();
        if (!user) throw new Error("Devi accedere per pubblicare una storia");
        if (suspendedError(user)) throw new Error("Sei sospeso: non puoi pubblicare");
        return {
          allowedContentTypes: ["image/*", "video/*"],
          maximumSizeInBytes: 300 * 1024 * 1024,
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
