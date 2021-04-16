import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateTag, User } from "../__types";

@injectable()
export class TagRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadTag = this.buildLoadById("tag", "id", (q) =>
    q.whereNull("deleted_at")
  );

  readonly loadTagsByOrganizationId = this.buildLoadMultipleBy(
    "tag",
    "organization_id",
    (q) => q.whereNull("deleted_at")
  );

  async createTag(data: Omit<CreateTag, "organization_id">, user: User) {
    const [tag] = await this.insert("tag", {
      ...data,
      organization_id: user.org_id,
      created_by: `User:${user.id}`,
      updated_by: `User:${user.id}`,
    });

    return tag;
  }

  async updateTag(
    tagId: number,
    data: Partial<Omit<CreateTag, "organization_id">>,
    user: User
  ) {
    const [tag] = await this.from("tag")
      .where("id", tagId)
      .whereNull("deleted_at")
      .update(
        {
          ...data,
          updated_by: `User:${user.id}`,
        },
        "*"
      );

    return tag;
  }

  async deleteTag(tagId: number, user: User, t?: Knex.Transaction) {
    await this.from("tag", t)
      .where("id", tagId)
      .update({
        deleted_at: this.now(),
        deleted_by: `User:${user.id}`,
      });
  }

  async tagPetition(tagId: number, petitionId: number) {
    await this.insert("petition_tag", {
      tag_id: tagId,
      petition_id: petitionId,
    });
  }

  async untagPetition(tagId: number, petitionId: number) {
    await this.from("petition_tag")
      .where({ tag_id: tagId, petition_id: petitionId })
      .delete();
  }

  async removeTagFromPetitions(tagId: number, t?: Knex.Transaction) {
    await this.from("petition_tag", t).where("tag_id", tagId).delete();
  }
}
