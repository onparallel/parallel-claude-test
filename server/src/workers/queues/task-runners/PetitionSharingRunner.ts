import { inject, injectable } from "inversify";
import pMap from "p-map";
import { differenceWith, filter, groupBy, isNonNullish, pipe, unique, uniqueBy, zip } from "remeda";
import { Config, CONFIG } from "../../../config";
import { User } from "../../../db/__types";
import { FileRepository } from "../../../db/repositories/FileRepository";
import { PetitionRepository } from "../../../db/repositories/PetitionRepository";
import {
  AddPetitionPermissionsInput,
  EditPetitionPermissionsInput,
  RemovePetitionPermissionsInput,
  Task,
  TaskRepository,
} from "../../../db/repositories/TaskRepository";
import { UserRepository } from "../../../db/repositories/UserRepository";
import { EMAILS, IEmailsService } from "../../../services/EmailsService";
import { ILogger, LOGGER } from "../../../services/Logger";
import { IStorageService, STORAGE_SERVICE } from "../../../services/StorageService";
import { TaskRunner } from "../../helpers/TaskRunner";

@injectable()
export class PetitionSharingRunner extends TaskRunner<"PETITION_SHARING"> {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(UserRepository) private users: UserRepository,
    @inject(EMAILS) private emails: IEmailsService,
    // ---- EXTENDS ---- //
    @inject(LOGGER) logger: ILogger,
    @inject(CONFIG) config: Config,
    @inject(TaskRepository) tasks: TaskRepository,
    @inject(FileRepository) files: FileRepository,
    @inject(STORAGE_SERVICE) storage: IStorageService,
  ) {
    super(logger, config, tasks, files, storage);
  }

  async run(task: Task<"PETITION_SHARING">) {
    if (!task.user_id) {
      throw new Error(`Task ${task.id} is missing user_id`);
    }

    const user = (await this.users.loadUser(task.user_id))!;

    if (task.input.action === "ADD") {
      await this.addPetitionPermissions(task.input, user);
    } else if (task.input.action === "EDIT") {
      await this.editPetitionPermissions(task.input, user);
    } else if (task.input.action === "REMOVE") {
      await this.removePetitionPermissions(task.input, user);
    }

    return { success: true };
  }

  private async addPetitionPermissions(args: AddPetitionPermissionsInput, user: User) {
    const petitionIds = await this.petitions.getPetitionIdsWithUserPermissions(
      args.petition_ids ?? [],
      args.folders?.folderIds ?? [],
      args.folders?.type === "TEMPLATE",
      user,
      ["OWNER", "WRITE"],
    );

    const permissionsBefore = (await this.petitions.loadEffectivePermissions(petitionIds)).flat();

    const newPermissions = await this.petitions.addPetitionPermissions(
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
        filter((p) => isNonNullish(p.user_id)),
        // remove duplicated <user_id,petition_id> entries to send only one email per user/petition
        uniqueBy((p) => `${p.user_id}:${p.petition_id}`),
        // omit users who had access previously
        differenceWith(
          permissionsBefore,
          (p1, p2) => p1.petition_id === p2.petition_id && p1.user_id === p2.user_id,
        ),
      );

      if (newUserPermissions.length > 0) {
        await this.emails.sendPetitionSharedEmail(
          user.id,
          newUserPermissions.map((p) => p.id),
          args.message ?? null,
        );
      }
    }
  }

  private async editPetitionPermissions(args: EditPetitionPermissionsInput, user: User) {
    await this.petitions.editPetitionPermissions(
      args.petition_ids,
      args.user_ids ?? [],
      args.user_group_ids ?? [],
      args.permission_type,
      user,
    );
  }

  private async removePetitionPermissions(args: RemovePetitionPermissionsInput, user: User) {
    const deletedPermissions = await this.petitions.removePetitionPermissions(
      args.petition_ids,
      args.user_ids ?? [],
      args.user_group_ids ?? [],
      args.remove_all ?? false,
      user,
    );
    const deletedPermissionsByPetitionId = groupBy(deletedPermissions, (p) => p.petition_id);

    const deletedPetitionIds = unique(deletedPermissions.map((p) => p.petition_id));

    const effectivePermissions = await this.petitions.loadEffectivePermissions(deletedPetitionIds);

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
        const userIds = unique(
          deletedPermissions
            .filter((p) => p.user_id !== null)
            .map((p) => p.user_id!)
            .filter((userId) => !hasPermissions.has(userId)),
        );

        await this.petitions.deletePetitionUserNotificationsByPetitionId([petitionId], userIds);
      },
      { concurrency: 20 },
    );
  }
}
