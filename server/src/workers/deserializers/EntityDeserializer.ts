import { mapSeries } from "async";
import { WorkerContext } from "../../context";
import { Organization, Petition, User } from "../../db/__types";
import { fullName } from "../../util/fullName";
import { Deserializer } from "./helpers";

function buildDeserializers(ctx: WorkerContext): Deserializer[] {
  return [
    new Deserializer<Organization>(
      "Organization",
      ["org_id"],
      ctx.organizations.loadOrg,
      (o) => ({ identifier: o.identifier })
    ),
    new Deserializer<Petition>(
      "Petition",
      ["petition_id"],
      ctx.petitions.loadPetition,
      (p) => ({
        name: p.name,
      })
    ),
    new Deserializer<User>("User", ["user_id"], ctx.users.loadUser, (u) => ({
      full_name: fullName(u.first_name, u.last_name),
      created_at: u.created_at,
    })),
  ];
}

export class EntityDeserializer {
  private deserializers: Deserializer[] = [];
  constructor(context: WorkerContext) {
    this.deserializers = buildDeserializers(context);
  }

  async deserialize(object: { [x: string]: any }): Promise<any> {
    const data = await mapSeries(Object.keys(object), async (key) => {
      const deserializer = this.deserializers.find((d) =>
        d.idKeys.includes(key)
      );

      if (typeof object[key] === "number" && deserializer) {
        return {
          [key.replace(/_id$/, "")]: await deserializer.deserialize(
            object[key]
          ),
        };
      }

      return {
        [key]:
          typeof object[key] === "object"
            ? await this.deserialize(object[key])
            : object[key],
      };
    });

    return Object.assign({}, ...data);
  }
}
