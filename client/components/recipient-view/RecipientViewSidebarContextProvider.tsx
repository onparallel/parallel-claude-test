import { useBreakpointValue } from "@chakra-ui/react";
import { useBrowserMetadata } from "@parallel/utils/useBrowserMetadata";
import { useEffectSkipFirst } from "@parallel/utils/useEffectSkipFirst";
import { useFieldCommentsQueryState } from "@parallel/utils/useFieldCommentsQueryState";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { isNonNullish } from "remeda";

interface RecipientViewSidebarContextProps {
  children: ReactNode;
}
export type SidebarState = "CONTENTS" | "INFORMATION" | "COMMENTS" | "CLOSED";

interface RecipientViewSidebarContextValue {
  setSidebarState: (value: SidebarState) => void;
  sidebarState: SidebarState;
}

const RecipientViewSidebarContext = createContext<RecipientViewSidebarContextValue | undefined>(
  undefined,
);

export function RecipientViewSidebarContextProvider({
  children,
}: RecipientViewSidebarContextProps) {
  const [fieldId, setFieldId] = useFieldCommentsQueryState();
  const { deviceType } = useBrowserMetadata();
  const initialState = useBreakpointValue<SidebarState>(
    { base: "CLOSED", lg: "CONTENTS" },
    { fallback: deviceType === null ? "lg" : "md" },
  )!;
  const [state, setState] = useState<SidebarState>(
    isNonNullish(fieldId) ? "COMMENTS" : initialState,
  );

  useEffectSkipFirst(() => {
    if (isNonNullish(fieldId) && state !== "COMMENTS") {
      setState("COMMENTS");
    }
  }, [fieldId]);

  const handleSidebarState = (value: SidebarState) => {
    // Close the sidebar if it is open and the same state is clicked or open with the new state
    setState(state === value ? "CLOSED" : value);
    // Reset the fieldId when change the sidebar state
    if (isNonNullish(fieldId)) {
      setFieldId(null);
    }
  };

  const value = useMemo<RecipientViewSidebarContextValue>(
    () => ({
      setSidebarState: handleSidebarState,
      sidebarState: state,
    }),
    [state, fieldId],
  );

  return (
    <RecipientViewSidebarContext.Provider value={value}>
      {children}
    </RecipientViewSidebarContext.Provider>
  );
}

export function useRecipientViewSidebarContext() {
  const context = useContext(RecipientViewSidebarContext);
  if (context === undefined) {
    throw new Error(
      "useRecipientViewSidebarContext must be used within a RecipientViewSidebarContextProvider",
    );
  }
  return context;
}
