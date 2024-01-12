import { IntlShape } from "react-intl";
import { isDefined, zip } from "remeda";
import { Petition, PetitionFieldType } from "../../db/__types";
import { getFieldsWithIndices } from "../../util/fieldIndices";
import { evaluateFieldLogic } from "../../util/fieldLogic";
import { toGlobalId } from "../../util/globalId";
import { isFileTypeField } from "../../util/isFileTypeField";
import { createLiquid } from "../../util/liquid";
import {
  buildPetitionFieldsLiquidScope,
  buildPetitionVariablesLiquidScope,
} from "../../util/liquidScope";
import { TaskRunner } from "../helpers/TaskRunner";

export class PetitionSummaryRunner extends TaskRunner<"PETITION_SUMMARY"> {
  async run() {
    const { petition_id: petitionId } = this.task.input;

    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }
    const hasAccess = await this.ctx.petitions.userHasAccessToPetitions(this.task.user_id, [
      petitionId,
    ]);
    if (!hasAccess) {
      throw new Error(`User ${this.task.user_id} has no access to petition ${petitionId}`);
    }

    const user = (await this.ctx.users.loadUser(this.task.user_id))!;

    const petition = await this.ctx.petitions.loadPetition(petitionId);

    const summaryConfig = petition?.summary_config;

    if (!isDefined(petition) || petition.is_template || !isDefined(summaryConfig)) {
      throw new Error("Petition not found or summary_config is not defined");
    }

    const integration = await this.ctx.integrations.loadIntegration(summaryConfig.integration_id);

    if (
      !isDefined(integration) ||
      integration.type !== "AI_COMPLETION" ||
      integration.org_id !== user.org_id
    ) {
      throw new Error("Integration not found or type is not AI_COMPLETION");
    }

    const intl = await this.ctx.i18n.getIntl(petition.recipient_locale);

    const scope = await this.buildPetitionSummaryLiquidScope(petition, intl);
    const liquid = createLiquid();

    const summary = await this.ctx.aiCompletion.processAiCompletion(
      {
        type: "PETITION_SUMMARY",
        integration_id: summaryConfig.integration_id,
        model: summaryConfig.model,
        prompt: summaryConfig.prompt.map((message) => ({
          role: message.role,
          content: liquid.parseAndRenderSync(message.content, scope, { globals: { intl } }),
        })),
      },
      `User:${user.id}`,
    );

    await this.ctx.petitions.updatePetitionSummaryAiCompletionLogId(
      petition,
      summary.id,
      `User:${user.id}`,
    );

    return { ai_completion_log_id: summary.id };
  }

  private async buildPetitionSummaryLiquidScope(
    petition: Pick<Petition, "id" | "org_id" | "recipient_locale">,
    intl: IntlShape,
  ) {
    const [composedPetition] = await this.ctx.petitions.getComposedPetitionFieldsAndVariables([
      petition.id,
    ]);
    const organization = await this.ctx.organizations.loadOrg(petition.org_id);

    const fileUploadReferences: {
      fileUploadId?: number;
      filename?: string;
      contentType?: string;
      size?: string;
    }[] = [];

    const petitionFieldsScope = buildPetitionFieldsLiquidScope(
      {
        id: toGlobalId("Petition", petition.id),
        fields: composedPetition.fields.map((f) => ({
          ...f,
          id: toGlobalId("PetitionField", f.id),
          replies: f.replies.map((r) => ({
            ...r,
            children:
              r.children?.map((c) => ({
                ...c,
                field: {
                  ...c.field,
                  id: toGlobalId("PetitionField", c.field.id),
                },
              })) ?? null,
          })),
        })),
      },
      intl,
    );

    function replyContent(type: PetitionFieldType, content: any) {
      if (isFileTypeField(type)) {
        // keep references of file_upload_id to retrieve file uploads later and update this object
        const reference = { fileUploadId: content.file_upload_id };
        fileUploadReferences.push(reference);
        return reference;
      }
      return content;
    }

    const liquid = createLiquid();
    const fieldLogic = evaluateFieldLogic(composedPetition);
    const fieldsInfoScope = zip(getFieldsWithIndices(composedPetition.fields), fieldLogic)
      .filter(([, { isVisible }]) => isVisible)
      .map(([[field, index, childrenFieldIndexes], logic]) => ({
        title: field.title,
        description: field.description
          ? liquid.parseAndRenderSync(
              field.description,
              {
                ...petitionFieldsScope,
                ...buildPetitionVariablesLiquidScope(logic),
              },
              { globals: { intl } },
            )
          : null,
        type: field.type,
        index,
        replies: field.replies.map((reply, groupIndex) => ({
          content: replyContent(field.type, reply.content),
          children: reply.children
            ?.filter?.(
              (_, childReplyIndex) =>
                logic.groupChildrenLogic?.[groupIndex][childReplyIndex].isVisible,
            )
            .map(({ field, replies }, childReplyIndex) => ({
              field: {
                title: field.title,
                description: field.description
                  ? liquid.parseAndRenderSync(
                      field.description,
                      {
                        ...petitionFieldsScope,
                        ...buildPetitionVariablesLiquidScope(
                          logic.groupChildrenLogic![groupIndex][childReplyIndex],
                        ),
                      },
                      { globals: { intl } },
                    )
                  : null,
                type: field.type,
                index: childrenFieldIndexes?.[childReplyIndex],
              },
              replies: replies.map((reply) => ({
                content: replyContent(field.type, reply.content),
              })),
            })),
        })),
      }));

    // load every file upload referenced in petition and modify the object to include the file upload info inside scope
    const fileIds = fileUploadReferences.map((f) => f.fileUploadId!);
    const fileUploads = await this.ctx.files.loadFileUpload(fileIds);

    for (const fileReference of fileUploadReferences) {
      const file = fileUploads.find((f) => f?.id === fileReference.fileUploadId);
      delete fileReference.fileUploadId;
      fileReference.contentType = file?.content_type;
      fileReference.filename = file?.filename;
      fileReference.size = file?.size;
    }

    return {
      ...petitionFieldsScope,
      fields: fieldsInfoScope,
      organization: organization?.name,
      variables: fieldLogic[0].finalVariables,
    };
  }
}
