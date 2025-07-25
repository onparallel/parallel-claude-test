import { inject, injectable } from "inversify";
import { extension } from "mime-types";
import pMap from "p-map";
import { isDeepEqual, isNonNullish, isNullish, omit, omitBy, pick, unique, zip } from "remeda";
import { assert } from "ts-essentials";
import {
  CreatePetitionFieldReply,
  PetitionFieldReply,
  PetitionFieldType,
  ProfileFieldValue,
  ProfileTypeFieldType,
  ProfileTypeFieldTypeValues,
  User,
} from "../db/__types";
import { FileRepository } from "../db/repositories/FileRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { ProfileRepository } from "../db/repositories/ProfileRepository";
import { ApolloError, ForbiddenError } from "../graphql/helpers/errors";
import { toGlobalId } from "../util/globalId";
import { includesSameElements } from "../util/includesSameElements";
import { isFileTypeField } from "../util/isFileTypeField";
import { isAtLeast } from "../util/profileTypeFieldPermission";
import { UnwrapPromise } from "../util/types";
import { validateShortTextFormat } from "../util/validateShortTextFormat";
import {
  ADVERSE_MEDIA_SEARCH_SERVICE,
  AdverseMediaSearchContent,
  IAdverseMediaSearchService,
} from "./AdverseMediaSearchService";
import {
  BACKGROUND_CHECK_SERVICE,
  BackgroundCheckContent,
  IBackgroundCheckService,
} from "./BackgroundCheckService";
import { ENCRYPTION_SERVICE, IEncryptionService } from "./EncryptionService";
import {
  IOrganizationCreditsService,
  ORGANIZATION_CREDITS_SERVICE,
} from "./OrganizationCreditsService";
import { PetitionFieldOptions } from "./PetitionFieldService";

export const PETITIONS_HELPER_SERVICE = Symbol.for("PETITIONS_HELPER_SERVICE");

@injectable()
export class PetitionsHelperService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ProfileRepository) private profiles: ProfileRepository,
    @inject(FileRepository) private files: FileRepository,
    @inject(ORGANIZATION_CREDITS_SERVICE) private orgCredits: IOrganizationCreditsService,
    @inject(ENCRYPTION_SERVICE) private encryption: IEncryptionService,
    @inject(ADVERSE_MEDIA_SEARCH_SERVICE) private adverseMedia: IAdverseMediaSearchService,
    @inject(BACKGROUND_CHECK_SERVICE) private backgroundCheck: IBackgroundCheckService,
  ) {}

  async userCanWriteOnPetitionField(
    petitionId: number,
    fieldId: number,
    parentReplyId: number | null,
    overwriteReplyId: number | null,
    userId: number,
  ) {
    const petition = await this.petitions.loadPetition(petitionId);
    assert(petition, "Petition not found");

    if (!petition || petition.status === "CLOSED") {
      throw new ForbiddenError(`Petition is closed and does not accept new replies`);
    }

    const fieldReplyCheck = await this.petitions.fieldsCanBeReplied(
      [{ id: fieldId, parentReplyId }],
      isNonNullish(overwriteReplyId),
    );

    if (fieldReplyCheck === "FIELD_ALREADY_REPLIED") {
      throw new ApolloError(
        "The field is already replied and does not accept multiple replies",
        "FIELD_ALREADY_REPLIED_ERROR",
      );
    }

    if (fieldReplyCheck === "REPLY_ONLY_FROM_PROFILE") {
      throw new ApolloError(
        "The field can only be replied to from a profile",
        "REPLY_ONLY_FROM_PROFILE_ERROR",
      );
    }

    const [process] = await this.petitions.getPetitionStartedProcesses(petitionId);
    if (isNonNullish(process)) {
      throw new ApolloError(
        `Petition has an ongoing ${process.toLowerCase()} process`,
        `ONGOING_${process}_REQUEST_ERROR`,
      );
    }
    if (isNonNullish(overwriteReplyId)) {
      const updateCheck = await this.petitions.repliesCanBeUpdated([overwriteReplyId]);
      if (updateCheck === "REPLY_ALREADY_APPROVED") {
        throw new ApolloError(
          `The reply has been approved and cannot be updated.`,
          "REPLY_ALREADY_APPROVED_ERROR",
        );
      } else if (updateCheck === "REPLY_NOT_FOUND") {
        throw new ForbiddenError("FORBIDDEN");
      }
    } else if (!petition.is_template) {
      await this.orgCredits.ensurePetitionHasConsumedCredit(petitionId, `User:${userId}`);
    }
  }

  async mapReplyContentFromDatabase(
    reply: Pick<PetitionFieldReply, "type" | "content" | "anonymized_at"> & { id?: number },
  ) {
    if (isFileTypeField(reply.type)) {
      const file = isNonNullish(reply.content.file_upload_id)
        ? await this.files.loadFileUpload(reply.content.file_upload_id)
        : null;
      const password = isNonNullish(file?.password)
        ? this.encryption.decrypt(Buffer.from(file.password, "hex"), "utf8")
        : null;
      return file
        ? {
            id: toGlobalId("FileUpload", file.id),
            filename: file.filename,
            size: file.size,
            contentType: file.content_type,
            extension: extension(file.content_type) || null,
            uploadComplete: file.upload_complete,
            ...(reply.type === "FILE_UPLOAD" && isNonNullish(password) ? { password } : {}),
            ...(reply.type === "DOW_JONES_KYC" ? { entity: reply.content.entity } : {}),
            ...(["ES_TAX_DOCUMENTS", "ID_VERIFICATION"].includes(reply.type)
              ? pick(reply.content, ["warning", "type"])
              : {}),
          }
        : reply.anonymized_at
          ? {}
          : {
              ...(["ES_TAX_DOCUMENTS", "ID_VERIFICATION"].includes(reply.type)
                ? // file_upload_id is null but reply is not anonymized: there was an error when requesting documents
                  pick(reply.content, ["type", "request", "error"])
                : {}),
            };
    } else if (reply.type === "BACKGROUND_CHECK") {
      const content = reply.content as BackgroundCheckContent;
      return {
        query: content.query,
        search: {
          falsePositivesCount: (content.falsePositives ?? []).length,
          totalCount: content.search.totalCount,
        },
        entity: isNonNullish(content.entity)
          ? {
              ...pick(content.entity, ["id", "type", "name"]),
              properties: pick(content.entity.properties, ["topics"]),
            }
          : null,
      };
    } else if (reply.type === "PROFILE_SEARCH") {
      assert(isNonNullish(reply.id), "Reply ID is required");
      const field = await this.petitions.loadFieldForReply(reply.id);
      assert(field?.type === "PROFILE_SEARCH", "Field not found for reply");
      const { searchIn } = field.options as PetitionFieldOptions["PROFILE_SEARCH"];

      const profileTypeIds = unique(searchIn.map((s) => s.profileTypeId));
      const profileTypeFieldIds = unique(searchIn.flatMap((s) => s.profileTypeFieldIds));
      const profileIds = unique(reply.content.value as number[]);

      const profileTypes = (await this.profiles.loadProfileType(profileTypeIds)).filter(
        isNonNullish,
      );
      const profiles = await this.profiles.loadProfile(profileIds);

      const profileTypeFields = await this.profiles.loadProfileTypeField(profileTypeFieldIds);
      const profileValues = await this.profiles.loadProfileFieldValuesByProfileId(profileIds);

      return {
        search: reply.content.search,
        totalResults: reply.content.totalResults,
        profileTypes: profileTypes.map((pt) => ({
          id: toGlobalId("ProfileType", pt.id),
          name: pt.name,
        })),
        value: zip(profiles, profileValues).map(([p, values]) => {
          if (!p) {
            return null;
          }
          const fieldIds =
            searchIn.find((s) => s.profileTypeId === p.profile_type_id)?.profileTypeFieldIds ?? [];

          const profileType = profileTypes.find((pt) => pt.id === p.profile_type_id)!;

          return {
            id: toGlobalId("Profile", p.id),
            name: p.localizable_name,
            profileType: {
              id: toGlobalId("ProfileType", profileType.id),
              standardType: profileType.standard_type,
            },
            fields: fieldIds.map((ptfId) => ({
              id: toGlobalId("ProfileTypeField", ptfId),
              name: profileTypeFields.find((ptf) => ptf?.id === ptfId)!.name,
              value: values.find((v) => v.profile_type_field_id === ptfId)?.content?.value ?? null,
            })),
          };
        }),
      };
    } else if (reply.type === "ADVERSE_MEDIA_SEARCH") {
      const content = reply.content as AdverseMediaSearchContent;
      return {
        search: content.search,
        articles: {
          totalCount: content.articles.totalCount,
          items: content.articles.items.map((article) =>
            this.adverseMedia.addRelevanceToArticle(article, content),
          ),
          createdAt: content.articles.createdAt,
        },
      };
    } else {
      return reply.content ?? {};
    }
  }

  async mapPublicReplyContentFromDatabase(
    reply: Pick<PetitionFieldReply, "type" | "content" | "anonymized_at">,
  ) {
    if (isFileTypeField(reply.type)) {
      const file = isNonNullish(reply.content.file_upload_id)
        ? await this.files.loadFileUpload(reply.content.file_upload_id)
        : null;
      return file
        ? {
            filename: file.filename,
            size: file.size,
            contentType: file.content_type,
            extension: extension(file.content_type) || null,
            uploadComplete: file.upload_complete,
            ...(["ES_TAX_DOCUMENTS", "ID_VERIFICATION"].includes(reply.type)
              ? pick(reply.content, ["warning", "type"])
              : {}),
          }
        : reply.anonymized_at
          ? {}
          : {
              ...(["ES_TAX_DOCUMENTS", "ID_VERIFICATION"].includes(reply.type)
                ? // file_upload_id is null but reply is not anonymized: there was an error when requesting documents
                  pick(reply.content, ["type", "request", "error"])
                : {}),
            };
    } else if (reply.type === "BACKGROUND_CHECK" || reply.type === "ADVERSE_MEDIA_SEARCH") {
      // make sure to not expose this field in public context
      return {};
    } else if (reply.type === "PROFILE_SEARCH") {
      return {
        // evaluateFieldLogic on PROFILE_SEARCH fields looks for value.length
        // se we need to expose an array with the same length, values are not important
        // so, we just expose this for the field logic to be calculated correctly
        value: reply.content.value.map((v: unknown) => "x"),
      };
    } else {
      return reply.content ?? {};
    }
  }

  mapPetitionFieldReplyToProfileFieldValue(
    reply: Pick<PetitionFieldReply, "type" | "content"> & { id?: number },
  ): { type: ProfileTypeFieldType; content: any; petitionFieldReplyId: number | null } {
    return {
      type: this.mapPetitionFieldTypeToProfileTypeFieldType(reply.type),
      content: reply.content,
      petitionFieldReplyId: reply.id ?? null,
    };
  }

  private mapPetitionFieldTypeToProfileTypeFieldType(
    type: PetitionFieldType,
  ): ProfileTypeFieldType {
    if (type === "FILE_UPLOAD") {
      return "FILE";
    }
    if (!ProfileTypeFieldTypeValues.includes(type)) {
      throw new Error(`Can't convert type ${type} to ProfileTypeFieldType`);
    }

    return type as ProfileTypeFieldType;
  }

  contentsAreEqual(
    a: Pick<PetitionFieldReply, "content" | "type">,
    b: Pick<ProfileFieldValue, "content" | "type">,
  ) {
    if (a.type !== b.type) {
      return false;
    }

    if (a.type === "BACKGROUND_CHECK") {
      const aContent = a.content as BackgroundCheckContent | undefined;
      const bContent = b.content as BackgroundCheckContent | undefined;

      const queryIsEqual =
        (aContent?.query?.name ?? null) === (bContent?.query?.name ?? null) &&
        (aContent?.query?.date ?? null) === (bContent?.query?.date ?? null) &&
        (aContent?.query?.type ?? null) === (bContent?.query?.type ?? null) &&
        (aContent?.query?.country ?? null) === (bContent?.query?.country ?? null) &&
        (aContent?.query?.birthCountry ?? null) === (bContent?.query?.birthCountry ?? null);

      const searchIsEqual =
        aContent?.search.totalCount === bContent?.search.totalCount &&
        aContent?.search.items.length === bContent?.search.items.length &&
        aContent?.search.items.every((item) =>
          bContent?.search.items.some((bItem) => bItem.id === item.id),
        );

      const entityIsEqual =
        (isNullish(aContent?.entity) && isNullish(bContent?.entity)) ||
        (isNonNullish(aContent?.entity) &&
          isNonNullish(bContent?.entity) &&
          isDeepEqual(
            omit(aContent.entity, ["properties", "createdAt"]),
            omit(bContent.entity, ["properties", "createdAt"]),
          ) &&
          isDeepEqual(
            omitBy(
              aContent.entity.properties,
              (value, key) => isNullish(value) || key === "relationships" || key === "sanctions",
            ),
            omitBy(
              bContent.entity.properties,
              (value, key) => isNullish(value) || key === "relationships" || key === "sanctions",
            ),
          ) &&
          includesSameElements(
            aContent.entity.properties.relationships,
            bContent.entity.properties.relationships,
            (a, b) => a.id === b.id,
          ) &&
          includesSameElements(
            aContent.entity.properties.sanctions,
            bContent.entity.properties.sanctions,
            (a, b) => a.id === b.id,
          ));

      const aFalsePositives = aContent?.falsePositives ?? [];
      const bFalsePositives = bContent?.falsePositives ?? [];
      const falsePositivesAreEqual =
        aFalsePositives.length === bFalsePositives.length &&
        aFalsePositives.every((item) => bFalsePositives.some((bItem) => bItem.id === item.id));

      return queryIsEqual && !!searchIsEqual && entityIsEqual && falsePositivesAreEqual;
    } else if (a.type === "CHECKBOX") {
      // contents are equal if both arrays contain exactly the same elements in any order
      return includesSameElements<string>(a.content?.value, b.content?.value, (a, b) => a === b);
    } else if (a.type === "ADVERSE_MEDIA_SEARCH") {
      const aContent = a.content as AdverseMediaSearchContent | undefined;
      const bContent = b.content as AdverseMediaSearchContent | undefined;
      return (
        includesSameElements(
          aContent?.search,
          bContent?.search,
          (a, b) =>
            (!!a.entityId && !!b.entityId && a.entityId === b.entityId) ||
            (!!a.wikiDataId && !!b.wikiDataId && a.wikiDataId === b.wikiDataId) ||
            (!!a.term && !!b.term && a.term === b.term),
        ) &&
        includesSameElements(
          aContent?.articles.items,
          bContent?.articles.items,
          (a, b) => a.id === b.id,
        ) &&
        includesSameElements(
          aContent?.relevant_articles,
          bContent?.relevant_articles,
          (a, b) => a.id === b.id,
        ) &&
        includesSameElements(
          aContent?.irrelevant_articles,
          bContent?.irrelevant_articles,
          (a, b) => a.id === b.id,
        ) &&
        includesSameElements(
          aContent?.dismissed_articles,
          bContent?.dismissed_articles,
          (a, b) => a.id === b.id,
        )
      );
    } else {
      return a.content?.value === b.content?.value;
    }
  }

  async buildFieldGroupRepliesFromProfiles(
    petitionId: number,
    prefill: {
      petitionFieldId: number; // ID of the FIELD_GROUP
      parentReplyId?: number | null; // ID of the parent reply in which the reply of the first profile should be created
      profileIds: number[]; // IDs of the profiles that should be used to prefill the FIELD_GROUP
    }[],
    userId: number,
  ) {
    const fieldGroups = (await this.petitions.loadFieldsForPetition(petitionId)).filter(
      (f) => f!.type === "FIELD_GROUP" && isNonNullish(f.profile_type_id),
    );
    const children = await this.petitions.loadPetitionFieldChildren(fieldGroups.map((f) => f.id));
    const groupsWithChildren = zip(fieldGroups, children);

    const replies: {
      fieldGroupId: number;
      parentReply: Pick<PetitionFieldReply, "id" | "associated_profile_id"> | null;
      associatedProfileId: number;
      childReplies: Omit<CreatePetitionFieldReply, "parent_petition_field_reply_id">[];
    }[] = [];

    const propertiesWithInvalidFormat: number[] = [];

    for (const input of prefill.filter((p) => p.profileIds.length > 0)) {
      const [parent, children] = groupsWithChildren.find(
        ([parent]) => parent.id === input.petitionFieldId,
      )!;

      const emptyGroupReplies = (await this.petitions.loadEmptyFieldGroupReplies(parent.id)).filter(
        (r) => r.id !== input.parentReplyId,
      );

      for (const profileId of input.profileIds) {
        const profileFieldValuesAndDrafts =
          await this.profiles.loadProfileFieldValuesAndDraftsByProfileId(profileId);
        const profileFieldFiles = await this.profiles.loadProfileFieldFilesByProfileId(profileId);

        const linkedChildren = children.filter((c) => isNonNullish(c.profile_type_field_id));

        const userPermissions = await this.profiles.loadProfileTypeFieldUserEffectivePermission(
          linkedChildren.map((child) => ({
            profileTypeFieldId: child.profile_type_field_id!,
            userId,
          })),
        );

        const childReplies: Omit<CreatePetitionFieldReply, "parent_petition_field_reply_id">[] = [];
        for (const [child] of zip(linkedChildren, userPermissions).filter(([, permission]) =>
          // do not prefill petition fields if the user does not have at least READ permission on the profile property
          isAtLeast(permission, "READ"),
        )) {
          const profileFieldValues = profileFieldValuesAndDrafts.filter(
            (v) => v.profile_type_field_id === child.profile_type_field_id,
          );
          const profileValue =
            profileFieldValues.find((v) => v.is_draft) ??
            profileFieldValues.find((v) => !v.is_draft);

          const profileFiles = profileFieldFiles.filter(
            (f) => f.profile_type_field_id === child.profile_type_field_id,
          );

          const fileUploadIds = profileFiles.map((f) => f.file_upload_id).filter(isNonNullish);

          if (isNonNullish(profileValue)) {
            if (
              child.type === "SHORT_TEXT" &&
              isNonNullish(child.options.format) &&
              isNonNullish(profileValue.content.value) &&
              !validateShortTextFormat(profileValue.content.value, child.options.format)
            ) {
              propertiesWithInvalidFormat.push(child.profile_type_field_id!);
              continue;
            }

            childReplies.push({
              petition_field_id: child.id,
              content: profileValue.content,
              type: child.type,
              user_id: userId,
            });
          } else if (fileUploadIds.length > 0) {
            childReplies.push(
              ...fileUploadIds.map((fileId) => ({
                petition_field_id: child.id,
                content: {
                  file_upload_id: null,
                  old_file_upload_id: fileId, // fileUploads will be cloned later and old_file_upload_id reference will be deleted
                },
                type: child.type,
                user_id: userId,
              })),
            );
          }
        }

        // pick empty replies as parent. If none are available, a new one will be created later
        // prioritize parentReplyId param for first profile if it is set
        const index = input.profileIds.indexOf(profileId);
        let groupReply: PetitionFieldReply | null = null;
        if (index === 0 && isNonNullish(input.parentReplyId)) {
          groupReply = await this.petitions.loadFieldReply(input.parentReplyId);
        } else {
          groupReply = emptyGroupReplies.shift() ?? null;
        }

        replies.push({
          fieldGroupId: parent.id,
          parentReply: groupReply,
          associatedProfileId: profileId,
          childReplies,
        });
      }
    }

    return { replies, propertiesWithInvalidFormat };
  }

  /**
   * writes replies on the petitions based on the prefill data obtained from buildFieldGroupRepliesFromProfiles.
   * This function will also create group replies and events and clone file_uploads if necessary.
   */
  async createPetitionFieldRepliesFromPrefillData(
    petitionId: number,
    data: UnwrapPromise<ReturnType<typeof this.buildFieldGroupRepliesFromProfiles>>["replies"],
    user: User,
  ) {
    const fieldChildren = (
      await this.petitions.loadPetitionFieldChildren(data.map((d) => d.fieldGroupId))
    ).map((children) => children.filter((c) => isNonNullish(c.profile_type_field_id)));

    for (const [{ fieldGroupId, parentReply, childReplies, associatedProfileId }, children] of zip(
      data,
      fieldChildren,
    )) {
      let parentReplyId = parentReply?.id ?? null;
      if (parentReply) {
        // update its associated profile
        await this.petitions.updatePetitionFieldReply(
          parentReply.id,
          { associated_profile_id: associatedProfileId },
          `User:${user.id}`,
        );
        // safe remove old associated profile, if set
        if (isNonNullish(parentReply.associated_profile_id)) {
          // call safeRemove AFTER updating associated_profile_id on reply, so old profile_id can be safe removed
          // (calling this function before updating will result in no disassociation as there is still a reference to the profile on the parentReply)
          const disassociated = await this.petitions.safeRemovePetitionProfileAssociation(
            petitionId,
            parentReply.associated_profile_id,
          );
          if (disassociated) {
            await this.petitions.createEvent({
              type: "PROFILE_DISASSOCIATED",
              petition_id: disassociated.petition_id,
              data: {
                user_id: user.id,
                profile_id: disassociated.profile_id,
              },
            });

            await this.profiles.createEvent({
              type: "PETITION_DISASSOCIATED",
              org_id: user.org_id,
              profile_id: disassociated.profile_id,
              data: {
                user_id: user.id,
                petition_id: disassociated.petition_id,
              },
            });
          }
        }
        // if parent reply already exists on petition, make sure to delete every old reply
        await this.petitions.deletePetitionFieldReplies(
          children.map((f) => ({ id: f.id, parentReplyId: parentReply.id })),
          `User:${user.id}`,
        );
      } else {
        const [emptyReply] = await this.petitions.createEmptyFieldGroupReply(
          [fieldGroupId],
          { associated_profile_id: associatedProfileId },
          user,
        );
        parentReplyId = emptyReply.id;
      }

      await this.petitions.createPetitionFieldReply(
        petitionId,
        await pMap(
          childReplies,
          async (r) => {
            if (isNonNullish(r.content.old_file_upload_id)) {
              const [clonedFileUpload] = await this.files.cloneFileUpload(
                r.content.old_file_upload_id as number,
              );
              return {
                ...r,
                content: {
                  ...omit(r.content, ["old_file_upload_id"]),
                  file_upload_id: clonedFileUpload.id,
                },
                parent_petition_field_reply_id: parentReplyId,
              };
            }
            return {
              ...r,
              parent_petition_field_reply_id: parentReplyId,
            };
          },
          { concurrency: 1 },
        ),
        `User:${user.id}`,
      );
    }
  }
}
