import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, omit, sortBy } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateTag, Tag, User } from "../__types";

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
    (q) => q.whereNull("deleted_at").orderBy("name", "asc")
  );

  readonly loadTagsByPetitionId = fromDataLoader(
    new DataLoader<number, Tag[]>(async (petitionIds) => {
      const results = await this.from("tag")
        .join("petition_tag", "tag.id", "petition_tag.tag_id")
        .whereIn("petition_tag.petition_id", petitionIds)
        .whereNull("tag.deleted_at")
        .select<Array<Tag & { petition_id: number; pt_created_at: Date }>>(
          "tag.*",
          "petition_tag.petition_id",
          "petition_tag.created_at as pt_created_at"
        );
      const byPetitionId = groupBy(results, (r) => r.petition_id);
      return petitionIds.map((id) =>
        byPetitionId[id]
          ? sortBy(byPetitionId[id], (tags) => tags.pt_created_at).map((tag) =>
              omit(tag, ["petition_id", "pt_created_at"])
            )
          : []
      );
    })
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
      .where({ id: tagId, deleted_at: null })
      .update(
        {
          ...data,
          updated_at: this.now(),
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

  async tagPetition(tagId: number, petitionId: number, user: User) {
    await this.insert("petition_tag", {
      tag_id: tagId,
      petition_id: petitionId,
      created_by: `User:${user.id}`,
    });
  }

  async untagPetition(
    tagId: number,
    petitionId?: number,
    t?: Knex.Transaction
  ) {
    await this.from("petition_tag", t)
      .where({ tag_id: tagId })
      .mmodify((q) => {
        if (petitionId) {
          q.where({ petition_id: petitionId });
        }
      })
      .delete();
  }
}
