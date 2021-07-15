import { If } from "./types";

export interface ValueProps<T, IsNullable extends boolean = true> {
  value: If<IsNullable, T | null, T>;
  onChange: (value: If<IsNullable, T | null, T>) => void;
}
