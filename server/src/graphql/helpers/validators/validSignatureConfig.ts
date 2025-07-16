import { fromStream } from "file-type";
import { isNonNullish, isNullish } from "remeda";
import { fromGlobalId } from "../../../util/globalId";
import { isValidTimezone } from "../../../util/time";
import { NexusGenInputs } from "../../__types";
import { ArgWithPath, getArgWithPath } from "../authorize";
import { ArgValidationError } from "../errors";
import { FieldValidateArgsResolver } from "../validateArgsPlugin";
import { exceedsMaxSize } from "./maxFileSize";
import { isValidEmail } from "./validEmail";

export function validSignatureConfig<TypeName extends string, FieldName extends string>(
  petitionIdProp: ArgWithPath<TypeName, FieldName, number>,
  signatureConfigProp: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["SignatureConfigInput"] | null | undefined
  >,
  approvalFlowConfigProp: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["ApprovalFlowConfigInput"][] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [petitionId] = getArgWithPath(args, petitionIdProp);
    const [approvalFlowConfigInput] = getArgWithPath(args, approvalFlowConfigProp);

    const [signatureConfigInput, argName] = getArgWithPath(args, signatureConfigProp);
    if (signatureConfigInput) {
      const {
        orgIntegrationId,
        signersInfo,
        timezone,
        instructions,
        review,
        useCustomDocument,
        reviewAfterApproval,
        minSigners,
      } = signatureConfigInput;

      if (minSigners < 1) {
        throw new ArgValidationError(
          info,
          `${argName}.minSigners`,
          `Min signers must be at least 1.`,
        );
      }

      const embeddedSignatureImages = signersInfo.filter(
        (s) =>
          isNonNullish(s.signWithEmbeddedImage) ||
          isNonNullish(s.signWithEmbeddedImageFileUploadId),
      ).length;

      if (embeddedSignatureImages >= minSigners) {
        throw new ArgValidationError(
          info,
          `${argName}.minSigners`,
          `Min signers must be greater than the number of embedded signature images.`,
        );
      }

      const integration = await ctx.integrations.loadIntegration(orgIntegrationId);
      if (
        isNullish(integration) ||
        integration.type !== "SIGNATURE" ||
        !integration.is_enabled ||
        integration.org_id !== ctx.user!.org_id
      ) {
        throw new ArgValidationError(
          info,
          `${argName}.orgIntegrationId`,
          `Invalid signature provider.`,
        );
      }

      for (const [index, signer] of signersInfo.entries()) {
        if (isNullish(signer.email)) {
          if (!signer.signWithEmbeddedImage && !signer.signWithEmbeddedImageFileUploadId) {
            throw new ArgValidationError(
              info,
              `${argName}.signersInfo[${index}].email`,
              `Email is required when signWithEmbeddedImage is not provided.`,
            );
          }
        } else {
          if (!isValidEmail(signer.email)) {
            throw new ArgValidationError(
              info,
              `${argName}.signersInfo[${index}].email`,
              `Invalid email.`,
              {
                error_code: "INVALID_EMAIL_ERROR",
              },
            );
          }
        }

        if (
          signer.signWithDigitalCertificate &&
          (signer.signWithEmbeddedImage || signer.signWithEmbeddedImageFileUploadId)
        ) {
          throw new ArgValidationError(
            info,
            `${argName}.signersInfo[${index}].signWithEmbeddedImage`,
            `signWithEmbeddedImage cannot be used when signWithDigitalCertificate is enabled.`,
          );
        }

        if (signer.signWithEmbeddedImage) {
          const image = await signer.signWithEmbeddedImage;
          const result = await fromStream(image.createReadStream());
          if (result && result.mime !== "image/png") {
            throw new ArgValidationError(
              info,
              `${argName}.signersInfo[${index}].signWithEmbeddedImage`,
              `Expected image/png, got ${result.mime}`,
            );
          }

          if (await exceedsMaxSize(image, 1024 * 1024 * 1)) {
            throw new ArgValidationError(
              info,
              `${argName}.signersInfo[${index}].signWithEmbeddedImage`,
              `File exceeded max size of 1MB`,
            );
          }
        } else if (signer.signWithEmbeddedImageFileUploadId) {
          try {
            const payload = await ctx.jwt.verify<{ signWithEmbeddedImageFileUploadId: string }>(
              signer.signWithEmbeddedImageFileUploadId,
            );

            const publicFileId = fromGlobalId(
              payload.signWithEmbeddedImageFileUploadId,
              "PublicFileUpload",
            ).id;

            const file = await ctx.files.loadPublicFile(publicFileId);
            if (!file) {
              throw new Error(`File not found.`);
            }
          } catch (error) {
            if (error instanceof Error) {
              throw new ArgValidationError(
                info,
                `${argName}.signersInfo[${index}].signWithEmbeddedImageFileUploadId`,
                error.message,
              );
            }

            throw error;
          }
        }
      }

      if (!isValidTimezone(timezone)) {
        throw new ArgValidationError(
          info,
          `${argName}.timezone`,
          `Value must be a valid timezone.`,
        );
      }

      if (isNonNullish(instructions) && instructions.length > 300) {
        throw new ArgValidationError(
          info,
          `${argName}.instructions`,
          `Instructions must be equal or less than 300 characters.`,
        );
      }

      if (useCustomDocument && !review) {
        throw new ArgValidationError(
          info,
          `${argName}.review`,
          `Review is required when using a custom document.`,
        );
      }

      if (isNonNullish(reviewAfterApproval) && !review) {
        throw new ArgValidationError(
          info,
          `${argName}.reviewAfterApproval`,
          `review must be enabled to use reviewAfterApproval.`,
        );
      }

      if (isNonNullish(reviewAfterApproval)) {
        // prioritize the input value over the petition value
        if (!approvalFlowConfigInput) {
          const petition = await ctx.petitions.loadPetition(petitionId);
          const approvalConfig = petition?.approval_flow_config;
          if (!approvalConfig) {
            throw new ArgValidationError(
              info,
              `${argName}.reviewAfterApproval`,
              `petition must have a configured approval request.`,
            );
          }
        }
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}

export function validPetitionSignerData<TypeName extends string, FieldName extends string>(
  signersInfoProp: ArgWithPath<
    TypeName,
    FieldName,
    NexusGenInputs["PublicPetitionSignerDataInput"][] | null | undefined
  >,
) {
  return (async (_, args, ctx, info) => {
    const [signersInfo] = getArgWithPath(args, signersInfoProp);
    if (!signersInfo) {
      return;
    }
    for (const [index, signer] of signersInfo.entries()) {
      if (!isValidEmail(signer.email)) {
        throw new ArgValidationError(info, `${signersInfoProp}[${index}].email`, `Invalid email.`, {
          error_code: "INVALID_EMAIL_ERROR",
        });
      }
    }
  }) as FieldValidateArgsResolver<TypeName, FieldName>;
}
