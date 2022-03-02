import React, { createContext, useContext, ComponentType, forwardRef } from "react";

export default function withDynamicLoadingProps<Props = {}>(
  loader: (useLoadingProps: () => Props) => ComponentType<Props>
) {
  const LoadingPropsContext = createContext({} as Props);

  const useLoadingProps = () => useContext(LoadingPropsContext);

  const Dynamic = loader(useLoadingProps);

  return forwardRef(function (props: Props, ref) {
    return (
      <LoadingPropsContext.Provider value={props}>
        <Dynamic ref={ref} {...props} />
      </LoadingPropsContext.Provider>
    );
  });
}
