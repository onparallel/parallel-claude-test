import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  PetitionHeader,
  PetitionHeaderInstance,
  PetitionHeaderProps,
} from "@parallel/components/layout/PetitionHeader";
import {
  PetitionLayout_PetitionBaseFragment,
  PetitionLayout_QueryFragment,
  UpdatePetitionInput,
} from "@parallel/graphql/__types";
import { useStateSlice } from "@parallel/utils/useStateSlice";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import {
  ComponentType,
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useIntl } from "react-intl";
import { isDefined } from "remeda";
import { useErrorDialog } from "../common/dialogs/ErrorDialog";
import { useConfirmDiscardDraftDialog } from "../petition-compose/dialogs/ConfirmDiscardDraftDialog";
import { PetitionTemplateHeader, PetitionTemplateHeaderInstance } from "./PetitionTemplateHeader";

export type PetitionSection = "compose" | "preview" | "replies" | "activity" | "messages";

export interface PetitionLayoutProps extends PetitionLayout_QueryFragment {
  petition: PetitionLayout_PetitionBaseFragment;
  onNextClick?: () => void;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: PetitionSection;
  headerActions?: ReactNode;
  subHeader?: ReactNode;
}

export const PetitionLayout = Object.assign(
  chakraForwardRef<"div", PetitionLayoutProps>(function PetitionLayout(
    {
      me,
      realMe,
      petition,
      section,
      onUpdatePetition,
      headerActions,
      children,
      subHeader,
      ...props
    },
    ref
  ) {
    const intl = useIntl();
    const title = useMemo(
      () =>
        petition.__typename === "Petition"
          ? (
              {
                compose: intl.formatMessage({
                  id: "petition.header.compose-tab",
                  defaultMessage: "Compose",
                }),
                messages: intl.formatMessage({
                  id: "petition.header.messages-tab",
                  defaultMessage: "Messages",
                }),
                preview: intl.formatMessage({
                  id: "petition.header.preview-tab",
                  defaultMessage: "Input",
                }),
                replies: intl.formatMessage({
                  id: "petition.header.replies-tab",
                  defaultMessage: "Review",
                }),
                activity: intl.formatMessage({
                  id: "petition.header.activity-tab",
                  defaultMessage: "Activity",
                }),
              } as Record<PetitionHeaderProps["section"], string>
            )[section!]
          : intl.formatMessage({
              id: "generic.template",
              defaultMessage: "Template",
            }),
      [section, intl.locale]
    );

    const headerRef = useRef<PetitionHeaderInstance | PetitionTemplateHeaderInstance>(null);

    const [, setShouldConfirmNavigation] = usePetitionShouldConfirmNavigation();

    useTempQueryParam("new", () => {
      setTimeout(() => headerRef.current?.focusName());
      setShouldConfirmNavigation(true);
    });

    useConfirmDiscardDraftDialog(petition);

    return (
      <AppLayout
        ref={ref}
        title={`${
          petition!.name ||
          (petition.__typename === "Petition"
            ? intl.formatMessage({
                id: "generic.unnamed-parallel",
                defaultMessage: "Unnamed parallel",
              })
            : intl.formatMessage({
                id: "generic.unnamed-template",
                defaultMessage: "Unnamed template",
              }))
        } - ${title}`}
        me={me}
        realMe={realMe}
      >
        {petition.__typename === "Petition" ? (
          <PetitionHeader
            ref={headerRef}
            petition={petition}
            me={me}
            onUpdatePetition={onUpdatePetition}
            section={section!}
            actions={headerActions}
          />
        ) : petition.__typename === "PetitionTemplate" ? (
          <PetitionTemplateHeader
            ref={headerRef}
            petition={petition}
            me={me}
            section={section!}
            onUpdatePetition={onUpdatePetition}
          />
        ) : null}
        {subHeader ? <Box>{subHeader}</Box> : null}
        <Box flex="1" overflow="auto" {...props} id="petition-layout-body">
          {children}
        </Box>
      </AppLayout>
    );
  }),
  {
    fragments: {
      PetitionBase: gql`
        fragment PetitionLayout_PetitionBase on PetitionBase {
          id
          name
          ...useConfirmDiscardDraftDialog_PetitionBase
          ... on Petition {
            ...PetitionHeader_Petition
          }
          ... on PetitionTemplate {
            ...PetitionTemplateHeader_PetitionTemplate
          }
        }
        ${useConfirmDiscardDraftDialog.fragments.PetitionBase}
        ${PetitionHeader.fragments.Petition}
        ${PetitionTemplateHeader.fragments.PetitionTemplate}
      `,
      Query: gql`
        fragment PetitionLayout_Query on Query {
          ...AppLayout_Query
          ...PetitionHeader_Query
        }
        ${AppLayout.fragments.Query}
        ${PetitionHeader.fragments.Query}
      `,
    },
  }
);

type PetitionState = "SAVED" | "SAVING" | "ERROR";

interface PetitionLayoutContext {
  state: PetitionState;
  shouldConfirmNavigation: boolean;
}

const PetitionLayoutContext = createContext<
  [
    value: PetitionLayoutContext | null,
    setValue: Dispatch<SetStateAction<PetitionLayoutContext>> | null
  ]
>([null, null]);

export function withPetitionLayoutContext<P>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: ComponentType<P>
): ComponentType<P> {
  const WithPetitionLayoutContext: ComponentType<P> = function (props) {
    const [value, setValue] = useState<PetitionLayoutContext>({
      state: "SAVED",
      shouldConfirmNavigation: false,
    });
    return (
      <PetitionLayoutContext.Provider value={[value, setValue]}>
        <Component {...(props as any)} />
      </PetitionLayoutContext.Provider>
    );
  };
  const { displayName, ...rest } = Component;
  return Object.assign(WithPetitionLayoutContext, rest, {
    displayName: `WithPetitionLayoutContext(${displayName ?? Component.name})`,
  });
}

export function usePetitionLayoutContext() {
  return useContext(PetitionLayoutContext);
}

export function createUseContextSlice<K extends keyof PetitionLayoutContext>(key: K, name: string) {
  return function () {
    const [state, setState] = usePetitionLayoutContext();
    if (!isDefined(state)) {
      throw new Error(`${name} is being used without using withPetitionLayoutContext`);
    }
    return useStateSlice(state!, setState!, key);
  };
}

export const usePetitionState = createUseContextSlice("state", "usePetitionState");
export const usePetitionShouldConfirmNavigation = createUseContextSlice(
  "shouldConfirmNavigation",
  "usePetitionShouldConfirmNavigation"
);

export function usePetitionStateWrapper() {
  const showError = useErrorDialog();
  const intl = useIntl();
  const [, setState] = usePetitionState();
  if (!isDefined(setState)) {
    throw new Error(
      "usePetitionStateWrapper is being used without using withPetitionLayoutContext"
    );
  }
  return useCallback(function <T extends (...args: any[]) => Promise<any>>(updater: T) {
    return async function (...args: any[]) {
      setState("SAVING");
      try {
        const result = await updater(...args);
        setState("SAVED");
        return result;
      } catch (error) {
        setState("ERROR");
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
