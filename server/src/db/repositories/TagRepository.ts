import DataLoader from "dataloader";
import { inject, injectable } from "inversify";
import { Knex } from "knex";
import { groupBy, omit } from "remeda";
import { fromDataLoader } from "../../util/fromDataLoader";
import { BaseRepository } from "../helpers/BaseRepository";
import { KNEX } from "../knex";
import { CreateTag, Tag, User } from "../__types";

@injectable()
export class TagRepository extends BaseRepository {
  constructor(@inject(KNEX) knex: Knex) {
    super(knex);
  }

  readonly loadTag = this.buildLoadById("tag", "id");

  readonly loadTagsByOrganizationId = this.buildLoadMultipleBy(
    "tag",
    "organization_id"
  );

  readonly loadTagsByPetitionId = fromDataLoader(
    new DataLoader<number, Tag[]>(async (petitionIds) => {
      const results = await this.from("tag")
        .join("petition_tag", "tag.id", "petition_tag.tag_id")
        .whereIn("petition_tag.petition_id", petitionIds)
        .select<Array<Tag & { petition_id: number }>>(
          "tag.*",
          "petition_tag.petition_id"
        );
      const byPetitionId = groupBy(results, (r) => r.petition_id);
      return petitionIds.map((id) =>
        byPetitionId[id]
          ? byPetitionId[id].map((tag) => omit(tag, ["petition_id"]))
          : []
      );
    })
  );

  async createTag(data: Omit<CreateTag, "organization_id">, user: User) {
    const [tag] = await this.insert("tag", {
      ...data,
      organization_id: user.org_id,
    });

    return tag;
  }

  async updateTag(
    tagId: number,
    data: Partial<Omit<CreateTag, "organization_id">>
  ) {
    const [tag] = await this.from("tag").where("id", tagId).update(data, "*");

    return tag;
  }

  async deleteTag(tagId: number, t?: Knex.Transaction) {
    await this.from("tag", t).where("id", tagId).delete();
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
