import { ComponentType, createContext, forwardRef, ForwardedRef, useContext } from "react";

export function withDynamicLoadingProps<Props extends Record<string, any> = {}>(
  loader: (useLoadingProps: () => Props) => ComponentType<Props>,
) {
  const LoadingPropsContext = createContext({} as Props);

  const useLoadingProps = () => useContext(LoadingPropsContext);

  const Dynamic = loader(useLoadingProps);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const WrappedComponent = forwardRef<any, any>(function (
    props: Props,
    ref: ForwardedRef<unknown>,
  ) {
    return (
      <LoadingPropsContext.Provider value={props}>
        <Dynamic ref={ref} {...props} />
      </LoadingPropsContext.Provider>
    );
  }) as unknown as ComponentType<Props>;

  return WrappedComponent;
}
