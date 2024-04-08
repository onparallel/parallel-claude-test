import { gql } from "@apollo/client";
import { Box, Flex, chakra } from "@chakra-ui/react";
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
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { Focusable } from "@parallel/utils/types";
import { useStateSlice } from "@parallel/utils/useStateSlice";
import { useTempQueryParam } from "@parallel/utils/useTempQueryParam";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { AnimatePresence, motion } from "framer-motion";
import {
  ComponentType,
  Dispatch,
  PropsWithChildren,
  ReactNode,
  RefObject,
  SetStateAction,
  createContext,
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
export type PetitionSection = "compose" | "preview" | "replies" | "activity" | "messages";

export interface PetitionLayoutProps extends PetitionLayout_QueryFragment {
  petition: PetitionLayout_PetitionBaseFragment;
  onNextClick?: () => void;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: PetitionSection;
  headerActions?: ReactNode;
  drawer?: ReactNode;
  drawerInitialFocusRef?: RefObject<Focusable>;
  onRefetch?: () => void;
  hasRightPane?: boolean;
  isRightPaneActive?: boolean;
  rightPane?: ReactNode;
}

export function PetitionLayout({
  me,
  realMe,
  petition,
  section,
  onUpdatePetition,
  headerActions,
  children,
  drawer,
  drawerInitialFocusRef,
  onRefetch,
  isRightPaneActive,
  rightPane,
  hasRightPane,
}: PropsWithChildren<PetitionLayoutProps>) {
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
    [section, intl.locale],
  );

  const headerRef = useRef<PetitionHeaderInstance>(null);

  const [, setShouldConfirmNavigation] = usePetitionShouldConfirmNavigation();

  useTempQueryParam("new", () => {
    setTimeout(() => {
      if (!isDefined(petition.name)) {
        headerRef.current?.focusName();
      }
    });
    setShouldConfirmNavigation(true);
  });

  useConfirmDiscardDraftDialog(petition);

  const drawerIsOpenRef = useUpdatingRef(isDefined(drawer));
  const bodyRef = useRef<HTMLDivElement>(null);
  const [drawerIsShown, setDrawerIsShown] = useState(false);

  return (
    <AppLayout
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
      position="relative"
    >
      <PetitionHeader
        ref={headerRef}
        petition={petition}
        me={me}
        onUpdatePetition={onUpdatePetition}
        onRefetch={onRefetch}
        section={section!}
        actions={headerActions}
      />
      <Flex ref={bodyRef} flex="1" minHeight={0}>
        <Flex
          flex="1"
          minWidth={0}
          display={{ base: isRightPaneActive ? "none" : "flex", lg: "flex" }}
          flexDirection="column"
          overflow="auto"
          id="petition-layout-body"
        >
          {children}
        </Flex>
        {hasRightPane ? (
          <Box
            as="section"
            width={{ base: "100%", lg: "390px" }}
            backgroundColor="white"
            display={{ base: isRightPaneActive ? "flex" : "none", lg: "flex" }}
            borderLeft={{ base: "none", lg: "1px solid" }}
            borderLeftColor={{ base: "none", lg: "gray.200" }}
            flexDirection="column"
          >
            {drawerIsShown ? null : rightPane}
          </Box>
        ) : null}
      </Flex>
      <AnimatePresence>
        {drawer ? (
          // this creates a "window" with overflow hidden so no weird scrollbars appear
          <Box
            position="absolute"
            width={{ base: "full", lg: "390px" }}
            top={{ base: "105px", lg: "66px" }}
            bottom={0}
            right={0}
            zIndex={1}
            overflow="hidden"
          >
            <MotionSection
              borderLeft={{ base: "none", lg: "1px solid" }}
              borderColor={{ base: "none", lg: "gray.200" }}
              boxShadow={{ base: "none", lg: "short" }}
              position="absolute"
              height="100%"
              width="100%"
              top={0}
              initial={{ x: "100%" }}
              animate={{ x: 0, transition: { type: "spring", bounce: 0, duration: 0.2 } }}
              exit={{
                x: "100%",
                transition: { type: "spring", bounce: 0, duration: 0.2 },
              }}
              onAnimationComplete={({ x }: any) => {
                if (drawerIsOpenRef.current) {
                  drawerInitialFocusRef?.current?.focus();
                }
                if (x === 0) {
                  setDrawerIsShown(true);
                }
              }}
              onAnimationStart={({ x }: any) => {
                if (x === "100%") {
                  setDrawerIsShown(false);
                }
              }}
            >
              {drawer}
            </MotionSection>
          </Box>
        ) : null}
      </AnimatePresence>
    </AppLayout>
  );
}

PetitionLayout.fragments = {
  PetitionBase: gql`
    fragment PetitionLayout_PetitionBase on PetitionBase {
      id
      name
      ...useConfirmDiscardDraftDialog_PetitionBase
      ...PetitionHeader_PetitionBase
    }
    ${useConfirmDiscardDraftDialog.fragments.PetitionBase}
    ${PetitionHeader.fragments.PetitionBase}
  `,
  Query: gql`
    fragment PetitionLayout_Query on Query {
      ...AppLayout_Query
      ...PetitionHeader_Query
    }
    ${AppLayout.fragments.Query}
    ${PetitionHeader.fragments.Query}
  `,
};

const MotionSection = chakra(motion.section);

type PetitionState = "SAVED" | "SAVING" | "ERROR";

interface PetitionLayoutContext {
  state: PetitionState;
  shouldConfirmNavigation: boolean;
}

const PetitionLayoutContext = createContext<
  [
    value: PetitionLayoutContext | null,
    setValue: Dispatch<SetStateAction<PetitionLayoutContext>> | null,
  ]
>([null, null]);

export function withPetitionLayoutContext<P>(
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Component: ComponentType<P>,
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
  "usePetitionShouldConfirmNavigation",
);

const HANDLED_ERRORS = ["ALIAS_ALREADY_EXISTS"];

export function usePetitionStateWrapper() {
  const showError = useErrorDialog();
  const intl = useIntl();
  const [, setState] = usePetitionState();
  if (!isDefined(setState)) {
    throw new Error(
      "usePetitionStateWrapper is being used without using withPetitionLayoutContext",
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
        if (HANDLED_ERRORS.some((type) => isApolloError(error, type))) {
          throw error;
        }
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
