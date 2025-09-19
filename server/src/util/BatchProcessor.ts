import DataLoader from "dataloader";

export class BatchProcessor<K, V> {
  private readonly dataloader: DataLoader<K, V>;

  constructor(batchProcessFn: (keys: ReadonlyArray<K>) => PromiseLike<ArrayLike<V | Error>>) {
    this.dataloader = new DataLoader<K, V>(batchProcessFn, { cache: false });
  }

  async process(key: K) {
    return await this.dataloader.load(key);
  }

  async processMany(keys: ReadonlyArray<K>) {
    return await this.dataloader.loadMany(keys);
  }
}
