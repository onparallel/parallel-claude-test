import { PropsWithAs, As, WithChakra } from "@chakra-ui/core";

export type ExtendChakra<T = {}> = PropsWithAs<As, WithChakra<T>>;
