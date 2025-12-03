import { inject, injectable } from "inversify";
import { Drop } from "liquidjs";
import { IntlShape } from "react-intl";
import {
  identity,
  isNonNullish,
  isNullish,
  mapToObj,
  mapValues,
  pick,
  pipe,
  unique,
  zip,
} from "remeda";
import { Config, CONFIG } from "../../../config";
import { Petition, PetitionField, PetitionFieldType } from "../../../db/__types";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { IntegrationRepository } from "../../../db/repositories/IntegrationRepository";
import { OrganizationRepository } from "../../../db/repositories/OrganizationRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import { Task, TaskRepository } from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import {
  DateLiquidValue,
  DateTimeLiquidValue,
  WithLabelLiquidValue,
} from "../../../pdf/utils/liquid/LiquidValue";
import { AI_COMPLETION_SERVICE, IAiCompletionService } from "../../../services/AiCompletionService";
import { I18N_SERVICE, II18nService } from "../../../services/I18nService";
import { ILogger, LOGGER } from "../../../services/Logger";
import { PetitionFieldOptions } from "../../../services/PetitionFieldService";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { zipX } from "../../../util/arrays";
import { getFieldsWithIndices } from "../../../util/fieldIndices";
import { evaluateFieldLogic, FieldLogicResult } from "../../../util/fieldLogic";
import { fullName } from "../../../util/fullName";
import { isFileTypeField } from "../../../util/isFileTypeField";
import { createLiquid } from "../../../util/liquid";
import { UnwrapArray, UnwrapPromise } from "../../../util/types";
import { TaskRunner } from "../../helpers/TaskRunner";

const SUMMARY_FIELD_TYPES = [
  "TEXT",
  "FILE_UPLOAD",
  "HEADING",
  "SELECT",
  "DYNAMIC_SELECT",
  "SHORT_TEXT",
  "CHECKBOX",
  "NUMBER",
  "PHONE",
  "DATE",
  "ES_TAX_DOCUMENTS",
  "DATE_TIME",
  "FIELD_GROUP",
  "ID_VERIFICATION",
] as const;

@injectable()
export class PetitionSummaryRunner extends TaskRunner<"PETITION_SUMMARY"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(IntegrationRepository) private integrations: IntegrationRepository,
    @inject(I18N_SERVICE) private i18n: II18nService,
    @inject(AI_COMPLETION_SERVICE) private aiCompletion: IAiCompletionService,
    @inject(OrganizationRepository) private organizations: OrganizationRepository,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"PETITION_SUMMARY">) {
    const { petition_id: petitionId } = task.input;

    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }
    const hasAccess = await this.petitions.userHasAccessToPetitions(task.user_id, [petitionId]);
    if (!hasAccess) {
      throw new Error(`User ${task.user_id} has no access to petition ${petitionId}`);
    }

    const user = (await this.users.loadUser(task.user_id))!;

    const petition = await this.petitions.loadPetition(petitionId);

    const summaryConfig = petition?.summary_config;

    if (
      isNullish(petition) ||
      petition.is_template ||
      petition.deletion_scheduled_at !== null ||
      isNullish(summaryConfig)
    ) {
      throw new Error("Petition not found or summary_config is not defined");
    }

    const integration = await this.integrations.loadIntegration(summaryConfig.integration_id);

    if (
      isNullish(integration) ||
      integration.type !== "AI_COMPLETION" ||
      integration.org_id !== user.org_id
    ) {
      throw new Error("Integration not found or type is not AI_COMPLETION");
    }

    const intl = await this.i18n.getIntl(petition.recipient_locale);

    const scope = await this.buildPetitionSummaryLiquidScope(petition, intl);
    const liquid = createLiquid();

    const summary = await this.aiCompletion.processAiCompletion(
      {
        type: "PETITION_SUMMARY",
        integrationId: summaryConfig.integration_id,
        apiVersion: summaryConfig.api_version,
        model: summaryConfig.model,
        prompt: summaryConfig.prompt.map((message) => ({
          role: message.role,
          content: liquid.parseAndRenderSync(message.content, scope, {
            globals: { intl },
          }) as string,
        })),
        responseFormat: { type: "text" },
      },
      `User:${user.id}`,
    );

    await this.petitions.updatePetitionSummaryAiCompletionLogId(
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
    const [composedPetition] = await this.petitions.getComposedPetitionFieldsAndVariables([
      petition.id,
    ]);
    const events = await this.petitions.getLastPetitionReplyStatusChangeEvents([petition.id]);
    const userIds = unique(events.map((e) => e.data.user_id).filter(isNonNullish));
    const userDataById = pipe(
      userIds,
      zip(await this.users.loadUserDataByUserId(userIds)),
      mapToObj(identity),
    );
    const eventsByReplyId = mapToObj(events, (e) => [e.data.petition_field_reply_id, e]);
    const reviewedByByReplyId = mapValues(eventsByReplyId, (e) => {
      const user = isNonNullish(e.data.user_id) ? userDataById[e.data.user_id] : null;
      return (
        user && {
          full_name: fullName(user.first_name, user.last_name),
          ...pick(user, ["first_name", "last_name", "email"]),
        }
      );
    });
    const reviewedAtByReplyId = mapValues(eventsByReplyId, (e) => e.created_at);

    const organization = await this.organizations.loadOrg(petition.org_id);

    const fileUploadReferences: {
      fileUploadId?: number;
      filename?: string;
      contentType?: string;
      size?: string;
    }[] = [];

    function replyContent(type: PetitionFieldType, content: any) {
      if (isFileTypeField(type)) {
        // keep references of file_upload_id to retrieve file uploads later and update this object
        const reference = { fileUploadId: content.file_upload_id };
        fileUploadReferences.push(reference);
        return reference;
      }
      return content;
    }

    // ############################
    // # ALIASED FIELDS SCOPE  ####
    // ############################
    const fieldsWithIndices = getFieldsWithIndices(composedPetition.fields);
    const fieldLogic = evaluateFieldLogic(composedPetition);
    const zippedFields = zip(fieldsWithIndices, fieldLogic);

    const petitionFieldsScope: Record<string, any> = { petitionId: petition.id, _: {} };
    for (const [[field, fieldIndex, childrenFieldIndices], logic] of zippedFields) {
      const replies = field.replies;
      let values: any[];
      if (field.type === "FIELD_GROUP") {
        values = replies.map((r) => {
          const reply: Record<string, any> = { _: {} };
          for (const [{ field, replies: _replies }, fieldIndex] of zip(
            r.children!,
            childrenFieldIndices!,
          )) {
            const values = _replies.map((r) => this.getReplyValue(field, r.content, intl));
            petitionFieldsScope._[fieldIndex] = (petitionFieldsScope._[fieldIndex] ?? []).concat(
              values,
            );
            if (isNonNullish(field.alias)) {
              petitionFieldsScope[field.alias] = petitionFieldsScope._[fieldIndex];
            }
            const value = field.multiple ? values : values?.[0];
            if (field.type !== "HEADING" && !isFileTypeField(field.type)) {
              reply._[fieldIndex] = value;
              if (isNonNullish(field.alias)) {
                reply[field.alias] = value;
              }
            }
          }
          return reply;
        });
      } else {
        values = replies.map((r) => this.getReplyValue(field, r.content, intl));
      }
      const value = field.multiple ? values : values?.[0];
      if (field.type !== "HEADING" && !isFileTypeField(field.type)) {
        petitionFieldsScope._[fieldIndex] = value;
        if (isNonNullish(field.alias)) {
          petitionFieldsScope[field.alias] = value;
        }
      }

      if (field.type === "HEADING") {
        petitionFieldsScope._[fieldIndex] = logic.headerNumber;
        if (isNonNullish(field.alias)) {
          petitionFieldsScope[field.alias] = logic.headerNumber;
        }
      }
    }

    // ############################
    // # ARRAY OF FIELDS SCOPE  ###
    // ############################
    const liquid = createLiquid();
    const fieldsInfoScope = zippedFields
      .filter(
        ([[field], { isVisible }]) =>
          // don't include this type fields in summary scope
          isVisible && SUMMARY_FIELD_TYPES.includes(field.type),
      )
      .map(([[field, index, childrenFieldIndexes], logic]) => ({
        title: field.title,
        description: field.description
          ? liquid.parseAndRenderSync(
              field.description,
              {
                ...petitionFieldsScope,
                ...this.buildPetitionVariablesLiquidScope(logic, composedPetition.variables),
              },
              { globals: { intl } },
            )
          : null,
        type: field.type,
        index,
        replies:
          field.type === "FIELD_GROUP"
            ? zip(field.replies, logic.groupChildrenLogic!).map(([reply, childLogic]) => ({
                content: replyContent(field.type, reply.content),
                children: zipX(reply.children!, childLogic, childrenFieldIndexes!)
                  .filter(
                    ([{ field }, logic]) =>
                      logic.isVisible && SUMMARY_FIELD_TYPES.includes(field.type),
                  )
                  .map(([{ field, replies }, logic, childIndex]) => ({
                    field: {
                      title: field.title,
                      description: field.description
                        ? liquid.parseAndRenderSync(
                            field.description,
                            {
                              ...petitionFieldsScope,
                              ...this.buildPetitionVariablesLiquidScope(
                                logic,
                                composedPetition.variables,
                              ),
                            },
                            { globals: { intl } },
                          )
                        : null,
                      type: field.type,
                      index: childIndex,
                    },
                    replies: replies.map((reply) => ({
                      content: replyContent(field.type, reply.content),
                      status: reply.status,
                      reviewed_by: reviewedByByReplyId[reply.id as any],
                      reviewed_at: reviewedAtByReplyId[reply.id as any],
                    })),
                    variables: Object.fromEntries(
                      Object.keys(logic.finalVariables).map((key) => [
                        key,
                        {
                          after: logic.currentVariables[key],
                          before: logic.previousVariables[key],
                        },
                      ]),
                    ),
                  })),
              }))
            : field.replies.map((reply) => ({
                content: replyContent(field.type, reply.content),
                status: reply.status,
                reviewed_by: reviewedByByReplyId[reply.id as any],
                reviewed_at: reviewedAtByReplyId[reply.id as any],
              })),
        variables: Object.fromEntries(
          Object.keys(logic.finalVariables).map((key) => [
            key,
            {
              after: logic.currentVariables[key],
              before: logic.previousVariables[key],
            },
          ]),
        ),
      }));

    // load every file upload referenced in petition and modify the object to include the file upload info inside scope
    const fileIds = fileUploadReferences.map((f) => f.fileUploadId!);
    const fileUploads = await this.files.loadFileUpload(fileIds);

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

  private getReplyValue(
    field: Pick<PetitionField, "type" | "options">,
    content: any,
    intl: IntlShape,
  ) {
    switch (field.type) {
      case "DATE":
        return new DateLiquidValue(intl, content);
      case "DATE_TIME":
        return new DateTimeLiquidValue(intl, content);
      case "SELECT":
        // in case of standard SELECT lists, this options will already have it correctly filled, as it comes from a graphql query
        const options = field.options as PetitionFieldOptions["SELECT"];
        if (isNonNullish(options.labels)) {
          const label =
            zip(options.labels!, options.values).find(([, v]) => v === content.value)?.[0] ?? "";
          return new WithLabelLiquidValue(intl, content, label);
        } else {
          return content.value;
        }
      case "CHECKBOX": {
        const options = field.options as PetitionFieldOptions["CHECKBOX"];
        if (isNonNullish(options.labels)) {
          return (content.value ?? []).map((value: string) => {
            const label =
              zip(options.labels!, options.values).find(([, v]) => v === value)?.[0] ?? "";
            return new WithLabelLiquidValue(intl, { value }, label);
          });
        } else {
          return content.value;
        }
      }
      default:
        return content.value;
    }
  }

  private buildPetitionVariablesLiquidScope(
    logic: FieldLogicResult,
    variables: UnwrapArray<
      UnwrapPromise<ReturnType<typeof this.petitions.getComposedPetitionFieldsAndVariables>>
    >["variables"],
  ) {
    const valueLabels = Object.fromEntries(
      variables.map((v) => [
        v.name,
        Object.fromEntries(v.valueLabels.map((l) => [l.value, l.label])),
      ]),
    );
    return Object.fromEntries(
      Object.keys(logic.finalVariables).map((key) => [
        key,
        new PetitionVariableDrop(
          logic.finalVariables[key],
          logic.currentVariables[key],
          logic.previousVariables[key],
          valueLabels[key]?.[logic.finalVariables[key]] ?? null,
        ),
      ]),
    );
  }
}

class PetitionVariableDrop extends Drop {
  constructor(
    public final: number | string,
    public after: number | string,
    public before: number | string,
    public label: string | null,
  ) {
    super();
  }

  public override valueOf() {
    return this.final;
  }
}
