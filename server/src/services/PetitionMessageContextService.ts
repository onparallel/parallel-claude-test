import { inject, injectable } from "inversify";
import { isDefined } from "remeda";
import { ContactRepository } from "../db/repositories/ContactRepository";
import { PetitionRepository } from "../db/repositories/PetitionRepository";
import { UserRepository } from "../db/repositories/UserRepository";
import { fullName } from "../util/fullName";
import { fromGlobalId, isGlobalId } from "../util/globalId";
import { isFileTypeField } from "../util/isFileTypeField";
import { Maybe } from "../util/types";

export interface IPetitionMessageContextService {
  fetchPlaceholderValues(
    args: {
      petitionId?: Maybe<number>;
      contactId?: Maybe<number>;
      userId?: Maybe<number>;
      petitionAccessId?: Maybe<number>;
    },
    options?: { publicContext?: boolean }
  ): Promise<(key: string) => string>;
}

export const PETITION_MESSAGE_CONTEXT_SERVICE = Symbol.for("PETITION_MESSAGE_CONTEXT_SERVICE");

@injectable()
export class PetitionMessageContextService implements IPetitionMessageContextService {
  constructor(
    @inject(PetitionRepository) private petitions: PetitionRepository,
    @inject(ContactRepository) private contacts: ContactRepository,
    @inject(UserRepository) private users: UserRepository
  ) {}

  async fetchPlaceholderValues(
    args: {
      petitionId?: Maybe<number>;
      contactId?: Maybe<number>;
      userId?: Maybe<number>;
      petitionAccessId?: Maybe<number>;
    },
    options?: { publicContext?: boolean }
  ) {
    const [petition, contact, user, fields] = await Promise.all([
      args.petitionId ? this.petitions.loadPetition(args.petitionId) : null,
      args.contactId ? this.contacts.loadContact(args.contactId) : null,
      args.userId ? this.users.loadUserDataByUserId(args.userId) : null,
      args.petitionId ? this.petitions.loadFieldsForPetition(args.petitionId) : null,
    ]);

    const replies = (
      await this.petitions.loadRepliesForField(fields?.map((f) => f.id) ?? [])
    ).flat();

    const originalMessage =
      isDefined(args.petitionAccessId) && isDefined(args.petitionId) && options?.publicContext
        ? await this.petitions.loadOriginalMessageByPetitionAccess(
            args.petitionAccessId,
            args.petitionId
          )
        : null;

    return (key: string) => {
      if (isGlobalId(key, "PetitionField")) {
        const id = fromGlobalId(key, "PetitionField").id;
        const firstReply = replies.find((reply) => reply.petition_field_id === id);
        if (isDefined(firstReply) && !isFileTypeField(firstReply.type)) {
          return (firstReply?.content.value as string) ?? "";
        }
      }

      switch (key) {
        case "contact-first-name":
          return contact?.first_name ?? "";
        case "contact-last-name":
          return contact?.last_name ?? "";
        case "contact-full-name":
          return fullName(contact?.first_name, contact?.last_name)!;
        case "contact-email":
          return contact?.email ?? "";
        case "user-first-name":
          return user?.first_name ?? "";
        case "user-last-name":
          return user?.last_name ?? "";
        case "user-full-name":
          return fullName(user?.first_name, user?.last_name)!;
        case "petition-title":
          return options?.publicContext
            ? originalMessage?.email_subject ?? ""
            : petition?.name ?? "";
        default:
          return "";
      }
    };
  }
}
