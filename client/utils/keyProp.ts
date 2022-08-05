type KeysOfType<T, U> = {
  [P in keyof T]-?: T[P] extends U ? P : never;
}[keyof T];

export type KeyProp<T> = (KeysOfType<T, string> & string) | ((row: T) => string);

export function getKey<T>(value: T, keyProp: KeyProp<T>) {
  return typeof keyProp === "function" ? keyProp(value) : (value[keyProp] as unknown as string);
}
