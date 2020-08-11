import { PropsWithAs, As, WithChakra } from "@chakra-ui/core";

export type ExtendChakra<P = {}> = PropsWithAs<As, WithChakra<P>>;
