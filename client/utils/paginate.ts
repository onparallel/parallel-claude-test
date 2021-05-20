export interface PaginateOptions<T> {
  page: number;
  items: number;
  filter?: (value: T) => boolean;
  compareFn?: (a: T, b: T) => any;
  reverse?: boolean;
}

export function paginate<T>(list: T[], options: PaginateOptions<T>) {
  const { page, items, filter, compareFn } = options;
  list = list.slice(0);
  if (filter) {
    list = list.filter(filter);
  }
  if (compareFn) {
    list.sort(compareFn);
  }
  return list.slice((page - 1) * items, page * items);
}
