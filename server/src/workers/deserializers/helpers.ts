import { toGlobalId } from "../../util/globalId";

class NotFoundError extends Error {
  constructor(type: string, id: number) {
    super();
    this.message = `${type} with id ${id} not found.`;
  }
}

export class Deserializer<T = any> {
  constructor(
    private entityName: string,
    public readonly idKeys: string[],
    private loaderFn: (id: number) => Promise<T | null>,
    private builderFn: (entity: T) => any
  ) {}
  async deserialize(id: number) {
    const entity = await this.loaderFn(id);
    if (!entity) {
      throw new NotFoundError(this.entityName, id);
    }

    return {
      id: toGlobalId(this.entityName, id),
      ...(await this.builderFn(entity)),
    };
  }
}
