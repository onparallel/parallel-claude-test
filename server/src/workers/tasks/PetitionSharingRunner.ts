import { differenceWith, filter, groupBy, isDefined, pipe, uniq, uniqBy, zip } from "remeda";
import { User } from "../../db/__types";
import {
  AddPetitionPermissionsInput,
  EditPetitionPermissionsInput,
  RemovePetitionPermissionsInput,
} from "../../db/repositories/TaskRepository";
import { TaskRunner } from "../helpers/TaskRunner";
import pMap from "p-map";

export class PetitionSharingRunner extends TaskRunner<"PETITION_SHARING"> {
  async run() {
    if (!this.task.user_id) {
      throw new Error(`Task ${this.task.id} is missing user_id`);
    }

    const user = (await this.ctx.users.loadUser(this.task.user_id))!;

    if (this.task.input.action === "ADD") {
      await this.addPetitionPermissions(this.task.input, user);
    } else if (this.task.input.action === "EDIT") {
      await this.editPetitionPermissions(this.task.input, user);
    } else if (this.task.input.action === "REMOVE") {
      await this.removePetitionPermissions(this.task.input, user);
    }

    return { success: true };
  }

  private async addPetitionPermissions(args: AddPetitionPermissionsInput, user: User) {
    const petitionIds = await this.ctx.petitions.getPetitionIdsWithUserPermissions(
      args.petition_ids ?? [],
      args.folders?.folderIds ?? [],
      args.folders?.type === "TEMPLATE",
      user,
      ["OWNER", "WRITE"],
    );

    const permissionsBefore = (
      await this.ctx.petitions.loadEffectivePermissions(petitionIds)
    ).flat();

    const { newPermissions } = await this.ctx.petitions.addPetitionPermissions(
      petitionIds,
      [
        ...(args.user_ids ?? []).map((userId) => ({
          type: "User" as const,
          id: userId,
          isSubscribed: args.subscribe ?? true,
          permissionType: args.permission_type,
        })),
        ...(args.user_group_ids ?? []).map((userGroupId) => ({
          type: "UserGroup" as const,
          id: userGroupId,
          isSubscribed: args.subscribe ?? true,
          permissionType: args.permission_type,
        })),
      ],
      "User",
      user.id,
      true,
    );

    if (args.notify) {
      const newUserPermissions = pipe(
        newPermissions,
        filter((p) => isDefined(p.user_id)),
        // remove duplicated <user_id,petition_id> entries to send only one email per user/petition
        uniqBy((p) => `${p.user_id}:${p.petition_id}`),
        // omit users who had access previously
        differenceWith(
          permissionsBefore,
          (p1, p2) => p1.petition_id === p2.petition_id && p1.user_id === p2.user_id,
        ),
      );

      if (newUserPermissions.length > 0) {
        await this.ctx.emails.sendPetitionSharedEmail(
          user.id,
          newUserPermissions.map((p) => p.id),
          args.message ?? null,
        );
      }
    }
  }

  private async editPetitionPermissions(args: EditPetitionPermissionsInput, user: User) {
    await this.ctx.petitions.editPetitionPermissions(
      args.petition_ids,
      args.user_ids ?? [],
      args.user_group_ids ?? [],
      args.permission_type,
      user,
    );
  }

  private async removePetitionPermissions(args: RemovePetitionPermissionsInput, user: User) {
    const deletedPermissions = await this.ctx.petitions.removePetitionPermissions(
      args.petition_ids,
      args.user_ids ?? [],
      args.user_group_ids ?? [],
      args.remove_all ?? false,
      user,
    );
    const deletedPermissionsByPetitionId = groupBy(deletedPermissions, (p) => p.petition_id);

    const deletedPetitionIds = uniq(deletedPermissions.map((p) => p.petition_id));

    const effectivePermissions =
      await this.ctx.petitions.loadEffectivePermissions(deletedPetitionIds);

    // For each petition, delete permissions not present in effectivePermissions
    await pMap(
      zip(
        deletedPetitionIds.map((id) => deletedPermissionsByPetitionId[id]),
        effectivePermissions,
      ),
      async ([deletedPermissions, effectivePermissions]) => {
        const petitionId = deletedPermissions[0].petition_id;
        const hasPermissions = new Set(effectivePermissions.map((p) => p.user_id!));

        // users of deletedPermissions that dont have any effectivePermission lost
        // access to the petitions, their notifications need to be deleted
        const userIds = uniq(
          deletedPermissions
            .filter((p) => p.user_id !== null)
            .map((p) => p.user_id!)
            .filter((userId) => !hasPermissions.has(userId)),
        );

        await this.ctx.petitions.deletePetitionUserNotificationsByPetitionId([petitionId], userIds);
      },
      { concurrency: 20 },
    );
  }
}
