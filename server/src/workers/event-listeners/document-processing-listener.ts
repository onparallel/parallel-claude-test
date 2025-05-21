import { isNonNullish, isNullish } from "remeda";
import {
  InvalidCredentialsError,
  InvalidRequestError,
} from "../../integrations/helpers/GenericIntegration";
import { PetitionFieldOptions } from "../../services/PetitionFieldService";
import { toBytes } from "../../util/fileSize";
import { listener } from "../helpers/EventProcessor";

export const documentProcessingListener = listener(
  ["REPLY_CREATED", "REPLY_UPDATED"],
  async (event, ctx) => {
    const reply = await ctx.petitions.loadFieldReply(event.data.petition_field_reply_id);
    if (
      !reply ||
      reply.type !== "FILE_UPLOAD" ||
      isNullish(reply.content.file_upload_id) ||
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
    if (isNonNullish(options.documentProcessing)) {
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
        if (isNullish(integration)) {
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

    if (options.processDocument) {
      const hasFeatureFlag = await ctx.featureFlags.orgHasFeatureFlag(
        petition.org_id,
        "DOCUMENT_PROCESSING",
      );
      if (!hasFeatureFlag) {
        return;
      }

      const [anthropicIntegration] = await ctx.integrations.loadIntegrationsByOrgId(
        petition.org_id,
        "AI_COMPLETION",
        "ANTHROPIC",
      );

      if (!anthropicIntegration) {
        return;
      }

      const user = event.data.user_id ? await ctx.users.loadUser(event.data.user_id) : null;
      const access = event.data.petition_access_id
        ? await ctx.petitions.loadAccess(event.data.petition_access_id)
        : null;

      if (!user && !access) {
        return;
      }

      const file = await ctx.files.loadFileUpload(reply.content.file_upload_id);

      if (
        !file ||
        !["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"].includes(
          file.content_type,
        ) ||
        parseInt(file.size) > toBytes(10, "MB")
      ) {
        return;
      }

      await ctx.tasks.createTask(
        {
          name: "DOCUMENT_PROCESSING",
          input: {
            petition_field_reply_id: reply.id,
            file_upload_id: reply.content.file_upload_id,
            integration_id: anthropicIntegration.id,
            model: anthropicIntegration.settings.MODEL,
          },
          user_id: user?.id ?? null,
          petition_access_id: access?.id ?? null,
        },
        ctx.config.instanceName,
      );
    }
  },
);
