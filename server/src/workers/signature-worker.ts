import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { createQueueWorker } from "./helpers/createQueueWorker";
import { SignatureWorker, SignatureWorkerPayload } from "./queues/SignatureWorkerQueue";

createQueueWorker("signature-worker", SignatureWorker, {
  forkHandlers: true,
  async onForkError(signal, message: SignatureWorkerPayload, context) {
    if (message.type === "start-signature-process") {
      await context.petitions.updatePetitionSignatureRequestAsCancelled(
        message.payload.petitionSignatureRequestId,
        {
          cancel_reason: "REQUEST_ERROR",
          cancel_data: {
            error: "fork process error",
            error_code: signal,
          },
        },
      );
    }
  },
});
