import { ConnectionMetadata } from "@parallel/graphql/__types";
import { ComponentType, createContext, useContext } from "react";
import { isDefined } from "remeda";

const MetadataContext = createContext<Partial<ConnectionMetadata> | null>(null);

export function withMetadata<P>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: ComponentType<P>
): ComponentType<P> {
  const WithMetadata: ComponentType<P> = function (props) {
    return (
      <MetadataContext.Provider value={(props as any).metadata as Partial<ConnectionMetadata>}>
        <Component {...(props as any)} />
      </MetadataContext.Provider>
    );
  };
  const { displayName, ...rest } = Component;
  return Object.assign(WithMetadata, rest, {
    displayName: `WithMetadata(${displayName ?? Component.name})`,
  });
}

export function useMetadata() {
  const metadata = useContext(MetadataContext);
  if (process.env.NODE_ENV === "development" && !isDefined(metadata)) {
    console.warn("useMetadata is being used without using withMetadata");
  }
  return metadata;
}
