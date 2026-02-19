import { ComponentType, createContext, useContext } from "react";

export function withDynamicLoadingProps<Props extends Record<string, any> = {}>(
  loader: (useLoadingProps: () => Props) => ComponentType<Props>,
) {
  const LoadingPropsContext = createContext<Props | null>(null);

  const useLoadingProps = () => useContext(LoadingPropsContext)!;

  const Dynamic = loader(useLoadingProps);

  const WrappedComponent: ComponentType<Props> = function (props: Props) {
    return (
      <LoadingPropsContext.Provider value={props}>
        <Dynamic {...props} />
      </LoadingPropsContext.Provider>
    );
  };

  WrappedComponent.displayName = `WithDynamicLoadingProps(${Dynamic.displayName || Dynamic.name || "Component"})`;

  return WrappedComponent;
}
