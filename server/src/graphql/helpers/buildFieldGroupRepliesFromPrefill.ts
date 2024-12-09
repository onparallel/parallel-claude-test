import pMap from "p-map";
import { isNonNullish, omit, zip } from "remeda";
import { ApiContext } from "../../context";
import { CreatePetitionFieldReply, PetitionFieldReply } from "../../db/__types";
import { isAtLeast } from "../../util/profileTypeFieldPermission";
import { UnwrapPromise } from "../../util/types";

export async function buildFieldGroupRepliesFromPrefillInput(
  petitionId: number,
  prefill: {
    petitionFieldId: number; // ID of the FIELD_GROUP
    parentReplyId?: number | null; // ID of the parent reply in which the reply of the first profile should be created
    profileIds: number[]; // IDs of the profiles that should be used to prefill the FIELD_GROUP
  }[],
  ctx: ApiContext,
) {
  const fieldGroups = (await ctx.petitions.loadFieldsForPetition(petitionId)).filter(
    (f) => f!.type === "FIELD_GROUP" && isNonNullish(f.profile_type_id),
  );
  const children = await ctx.petitions.loadPetitionFieldChildren(fieldGroups.map((f) => f.id));
  const groupsWithChildren = zip(fieldGroups, children);

  const replies: {
    fieldGroupId: number;
    parentReply: Pick<PetitionFieldReply, "id" | "associated_profile_id"> | null;
    associatedProfileId: number;
    childReplies: Omit<CreatePetitionFieldReply, "parent_petition_field_reply_id">[];
  }[] = [];

  for (const input of prefill.filter((p) => p.profileIds.length > 0)) {
    const [parent, children] = groupsWithChildren.find(
      ([parent]) => parent.id === input.petitionFieldId,
    )!;

    const emptyGroupReplies = (await ctx.petitions.loadEmptyFieldGroupReplies(parent.id)).filter(
      (r) => r.id !== input.parentReplyId,
    );

    for (const profileId of input.profileIds) {
      const profileFieldValues = await ctx.profiles.loadProfileFieldValuesByProfileId(profileId);
      const profileFieldFiles = await ctx.profiles.loadProfileFieldFilesByProfileId(profileId);

      const linkedChildren = children.filter((c) => isNonNullish(c.profile_type_field_id));

      const userPermissions = await ctx.profiles.loadProfileTypeFieldUserEffectivePermission(
        linkedChildren.map((child) => ({
          profileTypeFieldId: child.profile_type_field_id!,
          userId: ctx.user!.id,
        })),
      );

      const childReplies: Omit<CreatePetitionFieldReply, "parent_petition_field_reply_id">[] = [];
      for (const [child] of zip(linkedChildren, userPermissions).filter(([, permission]) =>
        // do not prefill petition fields if the user does not have at least READ permission on the profile property
        isAtLeast(permission, "READ"),
      )) {
        const profileValue = profileFieldValues.find(
          (v) => v.profile_type_field_id === child.profile_type_field_id,
        );
        const profileFiles = profileFieldFiles.filter(
          (f) => f.profile_type_field_id === child.profile_type_field_id,
        );

        const fileUploadIds = profileFiles.map((f) => f.file_upload_id).filter(isNonNullish);

        if (isNonNullish(profileValue)) {
          childReplies.push({
            petition_field_id: child.id,
            content: profileValue.content,
            type: child.type,
            user_id: ctx.user!.id,
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
              user_id: ctx.user!.id,
            })),
          );
        }
      }

      // pick empty replies as parent. If none are available, a new one will be created later
      // prioritize parentReplyId param for first profile if it is set
      const index = input.profileIds.indexOf(profileId);
      let groupReply: PetitionFieldReply | null = null;
      if (index === 0 && isNonNullish(input.parentReplyId)) {
        groupReply = await ctx.petitions.loadFieldReply(input.parentReplyId);
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

  return replies;
}

/**
 * writes replies on the petitions based on the prefill data obtained from buildFieldGroupRepliesFromPrefillInput.
 * This function will also create group replies and events and clone file_uploads if necessary.
 */
export async function createPetitionFieldRepliesFromPrefillData(
  petitionId: number,
  data: UnwrapPromise<ReturnType<typeof buildFieldGroupRepliesFromPrefillInput>>,
  ctx: ApiContext,
) {
  const fieldChildren = (
    await ctx.petitions.loadPetitionFieldChildren(data.map((d) => d.fieldGroupId))
  ).map((children) => children.filter((c) => isNonNullish(c.profile_type_field_id)));

  for (const [{ fieldGroupId, parentReply, childReplies, associatedProfileId }, children] of zip(
    data,
    fieldChildren,
  )) {
    let parentReplyId = parentReply?.id ?? null;
    if (parentReply) {
      // update its associated profile
      await ctx.petitions.updatePetitionFieldReply(
        parentReply.id,
        { associated_profile_id: associatedProfileId },
        `User:${ctx.user!.id}`,
      );
      // safe remove old associated profile, if set
      if (isNonNullish(parentReply.associated_profile_id)) {
        // call safeRemove AFTER updating associated_profile_id on reply, so old profile_id can be safe removed
        // (calling this function before updating will result in no disassociation as there is still a reference to the profile on the parentReply)
        const disassociated = await ctx.petitions.safeRemovePetitionProfileAssociation(
          petitionId,
          parentReply.associated_profile_id,
        );
        if (disassociated) {
          await ctx.petitions.createEvent({
            type: "PROFILE_DISASSOCIATED",
            petition_id: disassociated.petition_id,
            data: {
              user_id: ctx.user!.id,
              profile_id: disassociated.profile_id,
            },
          });

          await ctx.profiles.createEvent({
            type: "PETITION_DISASSOCIATED",
            org_id: ctx.user!.org_id,
            profile_id: disassociated.profile_id,
            data: {
              user_id: ctx.user!.id,
              petition_id: disassociated.petition_id,
            },
          });
        }
      }
      // if parent reply already exists on petition, make sure to delete every old reply
      await ctx.petitions.deletePetitionFieldReplies(
        children.map((f) => ({ id: f.id, parentReplyId: parentReply.id })),
        `User:${ctx.user!.id}`,
      );
    } else {
      const [emptyReply] = await ctx.petitions.createEmptyFieldGroupReply(
        [fieldGroupId],
        { associated_profile_id: associatedProfileId },
        ctx.user!,
      );
      parentReplyId = emptyReply.id;
    }

    await ctx.petitions.createPetitionFieldReply(
      petitionId,
      await pMap(
        childReplies,
        async (r) => {
          if (isNonNullish(r.content.old_file_upload_id)) {
            const [clonedFileUpload] = await ctx.files.cloneFileUpload(
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
      `User:${ctx.user!.id}`,
    );
  }
}
