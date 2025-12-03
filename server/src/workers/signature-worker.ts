import "reflect-metadata";
// keep this space to prevent import sorting, removing init from top
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { createQueueWorker } from "./helpers/createQueueWorker";
import { SignatureWorker } from "./queues/SignatureWorkerQueue";

createQueueWorker("signature-worker", SignatureWorker, {
  forkHandlers: true,
  async onForkError(signal, message, container) {
    if (message.type === "start-signature-process") {
      await container
        .get<PetitionRepository>(PetitionRepository)
        .updatePetitionSignatureRequestAsCancelled(message.payload.petitionSignatureRequestId, {
          cancel_reason: "REQUEST_ERROR",
          cancel_data: {
            error: "fork process error",
            error_code: signal,
          },
        });
    }
  },
});
