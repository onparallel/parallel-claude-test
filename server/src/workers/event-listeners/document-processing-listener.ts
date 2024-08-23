import { isDefined } from "remeda";
import { PetitionFieldOptions } from "../../db/helpers/fieldOptions";
import {
  InvalidCredentialsError,
  InvalidRequestError,
} from "../../integrations/helpers/GenericIntegration";
import { listener } from "../helpers/EventProcessor";

export const documentProcessingListener = listener(
  ["REPLY_CREATED", "REPLY_UPDATED"],
  async (event, ctx) => {
    const reply = await ctx.petitions.loadFieldReply(event.data.petition_field_reply_id);
    if (
      !reply ||
      reply.type !== "FILE_UPLOAD" ||
      !isDefined(reply.content.file_upload_id) ||
      Number.isNaN(reply.content.file_upload_id)
    ) {
      return;
    }

    const petition = await ctx.petitions.loadPetition(event.petition_id);
    const field = await ctx.petitions.loadField(reply.petition_field_id);

    if (!petition || !field) {
      return;
    }

    const options = field.options as PetitionFieldOptions["FILE_UPLOAD"];
    if (isDefined(options.documentProcessing)) {
      const integrations = await ctx.integrations.loadIntegrationsByOrgId(
        petition.org_id,
        "DOCUMENT_PROCESSING",
      );

      const integration =
        integrations.find((i) => i.id === options.documentProcessing!.integrationId) ??
        integrations.find((i) => i.is_default) ??
        integrations[0] ??
        null;

      const updatedBy = event.data.user_id
        ? `User:${event.data.user_id}`
        : `PetitionAccess:${event.data.petition_access_id}`;

      try {
        if (!isDefined(integration)) {
          throw new InvalidRequestError("INTEGRATION_NOT_FOUND");
        }

        await ctx.documentProcessing.startDocumentProcessing(
          integration.id,
          reply.content.file_upload_id,
          options.documentProcessing.processDocumentAs,
          { petition_field_reply_id: reply.id },
          updatedBy,
        );
      } catch (error) {
        if (error instanceof InvalidRequestError || error instanceof InvalidCredentialsError) {
          await ctx.petitions.updatePetitionFieldReply(
            reply.id,
            {
              metadata: {
                type: options.documentProcessing.processDocumentAs,
                error: error.code,
              },
            },
            updatedBy,
            true,
          );
        }
      }
    }
  },
);
