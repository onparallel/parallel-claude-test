import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { NextComponentType } from "next";
import {
  ComponentType,
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useState,
} from "react";
import { useIntl } from "react-intl";
import { isApolloError } from "./apollo/isApolloError";

export type PetitionState = "SAVED" | "SAVING" | "ERROR";

const PetitionStateContext = createContext<
  [PetitionState, Dispatch<SetStateAction<PetitionState>>] | null
>(null);

// eslint-disable-next-line @typescript-eslint/naming-convention
export function withPetitionState<P>(Component: ComponentType<P>): ComponentType<P> {
  const WithPetitionState: NextComponentType = function ({ ...props }) {
    const value = useState<PetitionState>("SAVED");
    return (
      <PetitionStateContext.Provider value={value}>
        <Component {...(props as any)} />
      </PetitionStateContext.Provider>
    );
  };
  const { displayName, ...rest } = Component;
  return Object.assign(WithPetitionState, rest, {
    displayName: `WithPetitionState(${displayName ?? Component.name})`,
  });
}

export function usePetitionState() {
  const [state] = useContext(PetitionStateContext)!;
  return state;
}

export function usePetitionStateWrapper() {
  const showError = useErrorDialog();
  const intl = useIntl();
  const [, setState] = useContext(PetitionStateContext)!;
  return useCallback(function <T extends (...args: any[]) => Promise<any>>(updater: T) {
    return async function (...args: any[]) {
      setState("SAVING");
      try {
        const result = await updater(...args);
        setState("SAVED");
        return result;
      } catch (error: any) {
        setState("ERROR");
        if (isApolloError(error, "ALIAS_ALREADY_EXISTS")) {
          // If the error is and duplicated alias we handled the error in PetitionComposeFieldSettings
          throw error;
        }
        try {
          await showError({
            message: intl.formatMessage({
              id: "generic.unexpected-error-happened",
              defaultMessage:
                "An unexpected error happened. Please try refreshing your browser window and, if it persists, reach out to support for help.",
            }),
          });
        } catch {}
      }
    } as T;
  }, []);
}
