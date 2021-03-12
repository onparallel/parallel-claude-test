export interface ValueProps<T, IsNullable extends boolean = true> {
  value: IsNullable extends true ? T | null : T;
  onChange: (value: T) => void;
}
