import { NextFunction, Request, Response } from "express";
import { SignatureEvents } from "signaturit-sdk";
import { ApiContext } from "../../context";

export async function validateSignaturitRequest(
  req: Request & { context: ApiContext },
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body as SignaturItEventBody;
    const signature = await req.context.petitions.loadPetitionSignatureByExternalId(
      body.document.signature.id
    );

    if (signature && signature.status !== "CANCELLED") {
      next();
    } else {
      // status 200 to kill request but avoid sending an error to signaturit
      res.sendStatus(200).end();
    }
  } catch {
    res.sendStatus(200).end();
  }
}

export type SignaturItEventBody = {
  document: {
    created_at: string;
    decline_reason?: string; // only for document_declined event type
    file: { name: string; pages: string; size: string };
    id: string;
    events: {
      created_at: string;
      type: SignatureEvents;
      decline_reason?: string;
    }[];
    signature: { id: string };
    email: string;
    name: string;
    status: string;
  };
  created_at: string;
  type: SignatureEvents;
};

export const signaturItEventHandler: Record<
  string,
  (
    petitionId: number,
    data: SignaturItEventBody,
    context: ApiContext
  ) => Promise<void>
> = {
  document_canceled: documentCanceled,
  document_declined: documentDeclined,
  document_completed: documentCompleted,
};

/** signature process was canceled, need to update petition_signature_request table */
async function documentCanceled(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  const externalId = data.document.signature.id;
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    externalId
  );

  if (!signature) {
    throw new Error(
      `Petition signature request with externalId: ${externalId} not found.`
    );
  }

  await ctx.petitions.updatePetitionSignature(signature.id, {
    status: "CANCELLED",
    data,
    event_logs: JSON.stringify(
      data.document.events.concat({
        created_at: data.created_at,
        type: data.type,
      })
    ),
  });
}

/** signer declined the document. Whole signature process will be cancelled */
async function documentDeclined(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  const externalId = data.document.signature.id;
  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    externalId
  );

  if (!signature) {
    throw new Error(
      `Petition signature request with externalId: ${externalId} not found.`
    );
  }
  // when a document is declined, the signature request is automatically cancelled for all recipients
  await ctx.petitions.updatePetitionSignature(signature.id, {
    status: "CANCELLED",
    data,
    event_logs: JSON.stringify(
      data.document.events.concat({
        created_at: data.created_at,
        type: data.type,
        decline_reason: data.document.decline_reason,
      })
    ),
  });
}

/** document has been completed and is ready to be downloaded */
async function documentCompleted(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  const client = ctx.signature.getClient("signaturit");

  const {
    id: documentId,
    signature: { id: externalId },
  } = data.document;

  const signature = await ctx.petitions.loadPetitionSignatureByExternalId(
    externalId
  );

  if (!signature) {
    throw new Error(
      `Petition signature request with externalId: ${externalId} not found.`
    );
  }

  if (signature.status === "CANCELLED") {
    throw new Error(
      `Requested petition signature with externalId: ${externalId} was previously cancelled`
    );
  }

  const petition = await ctx.petitions.loadPetition(petitionId);

  if (!petition) {
    throw new Error(`petition with id ${petitionId} not found.`);
  }

  const buffer = await client.downloadSignedDocument(
    `${externalId}/${documentId}`
  );

  const filename = `${petition.name ?? petitionId}_signed.pdf`;
  const key = `${externalId}/${documentId}/${filename}`;
  await ctx.aws.uploadFile(key, buffer, "application/pdf");
  const file = await ctx.files.createFileUpload(
    {
      content_type: "application/pdf",
      filename,
      path: key,
      size: Buffer.byteLength(buffer),
      upload_complete: true,
    },
    "signaturit"
  );

  await ctx.petitions.updatePetitionSignature(signature.id, {
    status: "COMPLETED",
    file_upload_id: file.id,
    data,
    event_logs: JSON.stringify(
      data.document.events.concat({
        created_at: data.created_at,
        type: data.type,
      })
    ),
  });
}
