import { SignatureEvents } from "signaturit-sdk";
import { ApiContext } from "../../context";

export type SignaturItEventBody = {
  document: {
    created_at: string;
    file: { name: string; pages: string; size: string };
    id: string;
    events: { created_at: string; type: SignatureEvents }[];
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
  email_delivered: emailDelivered,
  email_bounced: emailBounced,
  email_deferred: emailDeferred,
  document_canceled: documentCanceled,
  document_declined: documentDeclined,
  document_expired: documentExpired,
  document_signed: documentSigned,
  document_completed: documentCompleted,
  audit_trail_completed: auditTrailCompleted,
};

async function emailDelivered(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  await ctx.petitions.updatePetitionSignature(petitionId, {
    status: "EMAIL_DELIVERED",
    data,
  });
}

async function emailBounced(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  await ctx.petitions.updatePetitionSignature(petitionId, {
    status: "EMAIL_BOUNCED",
    data,
  });
}

async function emailDeferred(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  await ctx.petitions.updatePetitionSignature(petitionId, {
    status: "EMAIL_DEFERRED",
    data,
  });
}

/** signature process wass canceled */
async function documentCanceled(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  await ctx.petitions.updatePetitionSignature(petitionId, {
    status: "DOCUMENT_CANCELED",
    data,
  });
}

/** recipient declined the document */
async function documentDeclined(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  await ctx.petitions.updatePetitionSignature(petitionId, {
    status: "DOCUMENT_DECLINED",
    data,
  });
}

/** document expired */
async function documentExpired(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  await ctx.petitions.updatePetitionSignature(petitionId, {
    status: "DOCUMENT_EXPIRED",
    data,
  });
}

/** recipient signed the document */
async function documentSigned(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  await ctx.petitions.updatePetitionSignature(petitionId, {
    status: "DOCUMENT_SIGNED",
    data,
  });
}

/** audit trail is ready to be downloaded */
async function auditTrailCompleted(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  // TODO: download and store audit trail
}

/** document has been completed and is ready to be downloaded */
async function documentCompleted(
  petitionId: number,
  data: SignaturItEventBody,
  ctx: ApiContext
) {
  // TODO: download and store document
  await ctx.petitions.updatePetitionSignature(petitionId, {
    status: "DOCUMENT_COMPLETED",
    data,
  });
}
