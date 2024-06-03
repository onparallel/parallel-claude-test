import { createContext, ReactNode, useContext } from "react";

interface AddNewFieldPlaceholderProviderProps {
  value: {
    afterFieldId?: string;
    inParentFieldId?: string;
  };
  children: ReactNode;
}

const AddNewFieldPlaceholderContext = createContext<
  AddNewFieldPlaceholderProviderProps["value"] | undefined
>(undefined);

export function AddNewFieldPlaceholderProvider({
  value,
  children,
}: AddNewFieldPlaceholderProviderProps) {
  return (
    <AddNewFieldPlaceholderContext.Provider value={value}>
      {children}
    </AddNewFieldPlaceholderContext.Provider>
  );
}

export function useAddNewFieldPlaceholderContext() {
  const context = useContext(AddNewFieldPlaceholderContext);
  if (context === undefined) {
    throw new Error("useNewFieldPlaceholder must be used within a NewFieldPlaceholderProvider");
  }
  return context;
}
