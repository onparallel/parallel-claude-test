import { BoxProps } from "@chakra-ui/core";

// export type ExtendChakra<T = {}> = PropsWithAs<As, WithChakra<T>>;
export type ExtendChakra<P = {}, T = BoxProps> = P & T;
