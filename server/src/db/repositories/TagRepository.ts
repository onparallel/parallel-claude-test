import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, omit, sortBy } from "remeda";
import { MaybeArray, unMaybeArray } from "../../util/types";
import { CreateTag, PetitionTag, Tag, User } from "../__types";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";

@injectable()
export class TagRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadTag = this.buildLoadBy("tag", "id", (q) => q.whereNull("deleted_at"));

  readonly loadTagsByOrganizationId = this.buildLoadMultipleBy("tag", "organization_id", (q) =>
    q.whereNull("deleted_at").orderBy("name", "asc"),
  );

  async getOrganizationTagsFilteredByName(orgId: number, search: string[]) {
    return await this.from("tag")
      .where({ organization_id: orgId, deleted_at: null })
      .whereIn("name", search)
      .select("*");
  }

  readonly loadTagsByPetitionId = this.buildLoader<number, Tag[]>(async (petitionIds, t) => {
    const results = await this.from("tag", t)
      .join("petition_tag", "tag.id", "petition_tag.tag_id")
      .whereIn("petition_tag.petition_id", petitionIds)
      .whereNull("tag.deleted_at")
      .select<
        Array<Tag & { petition_id: number; pt_created_at: Date }>
      >("tag.*", "petition_tag.petition_id", "petition_tag.created_at as pt_created_at");
    const byPetitionId = groupBy(results, (r) => r.petition_id);
    return petitionIds.map((id) =>
      byPetitionId[id]
        ? sortBy(byPetitionId[id], (tags) => tags.pt_created_at).map((tag) =>
            omit(tag, ["petition_id", "pt_created_at"]),
          )
        : [],
    );
  });

  async createTag(data: Omit<CreateTag, "organization_id">, user: User) {
    const [tag] = await this.insert("tag", {
      ...data,
      organization_id: user.org_id,
      created_by: `User:${user.id}`,
      updated_by: `User:${user.id}`,
    });

    return tag;
  }

  async updateTag(tagId: number, data: Partial<Omit<CreateTag, "organization_id">>, user: User) {
    const [tag] = await this.from("tag")
      .where({ id: tagId, deleted_at: null })
      .update(
        {
          ...data,
          updated_at: this.now(),
          updated_by: `User:${user.id}`,
        },
        "*",
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

  async tagPetition(
    tagId: MaybeArray<number>,
    petitionId: MaybeArray<number>,
    user: User,
    t?: Knex.Transaction,
  ) {
    const petitionIds = unMaybeArray(petitionId);
    const tagIds = unMaybeArray(tagId);

    if (petitionIds.length === 0 || tagIds.length === 0) {
      return [];
    }

    return await this.raw<PetitionTag>(
      /* sql */ `
    ? on conflict do nothing returning *;
    `,
      [
        this.from("petition_tag").insert(
          petitionIds.flatMap((petitionId) =>
            tagIds.map((tagId) => ({
              tag_id: tagId,
              petition_id: petitionId,
              created_by: `User:${user.id}`,
            })),
          ),
        ),
      ],
      t,
    );
  }

  async untagPetition(tagId: number, petitionId?: number, t?: Knex.Transaction) {
    return await this.from("petition_tag", t)
      .where({ tag_id: tagId })
      .mmodify((q) => {
        if (petitionId) {
          q.where({ petition_id: petitionId });
        }
      })
      .delete()
      .returning("*");
  }
}
