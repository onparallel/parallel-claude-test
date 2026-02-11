import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Center,
  ComponentWithAs,
  Flex,
  FlexProps,
  HStack,
  Icon,
  IconProps,
  Stack,
} from "@chakra-ui/react";
import { CommentIcon, InfoCircleIcon, ListIcon, UserArrowIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { RecipientViewSidebar_PublicPetitionAccessFragment } from "@parallel/graphql/__types";
import { AnimatePresence, motion } from "framer-motion";
import { useIntl } from "react-intl";
import { sumBy } from "remeda";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { RecipientViewComments } from "./RecipientViewComments";
import { RecipientViewContents } from "./RecipientViewContents";
import { RecipientViewInformation } from "./RecipientViewInformation";
import { RecipientViewMenuButton } from "./RecipientViewMenuButton";
import { useRecipientViewSidebarContext } from "./RecipientViewSidebarContextProvider";
import { useDelegateAccess } from "./hooks/useDelegateAccess";

const MotionFlex = motion<FlexProps>(Flex);
const breakpoint = "md";

interface RecipientViewSidebarProps {
  keycode: string;
  access: RecipientViewSidebar_PublicPetitionAccessFragment;
  currentPage: number;
}

export function RecipientViewSidebar({ keycode, access, currentPage }: RecipientViewSidebarProps) {
  const intl = useIntl();

  const petition = access!.petition!;
  const { setSidebarState, sidebarState } = useRecipientViewSidebarContext();
  const isOpen = sidebarState !== "CLOSED";

  const unreadCount =
    sumBy(petition.fields, (field) => (field.hasCommentsEnabled ? field.unreadCommentCount : 0)) +
    petition.unreadGeneralCommentCount;

  return (
    <HStack
      display={{ base: "none", [breakpoint]: "flex" }}
      spacing={0}
      align="top"
      backgroundColor="white"
    >
      <AnimatePresence initial={false}>
        {isOpen ? (
          <MotionFlex
            initial={{ width: "0px" }}
            maxWidth={{ base: "323px", lg: "350px" }}
            animate={{
              width: "350px",
              transition: { type: "spring", bounce: 0, duration: 0.4 },
            }}
            exit={{
              width: "0px",
              transition: { type: "spring", bounce: 0, duration: 0.4 },
            }}
            position="relative"
            overflow="hidden"
            borderEnd="1px solid"
            borderEndColor="gray.200"
          >
            <RecipientViewSidebarBody
              keycode={keycode}
              access={access}
              currentPage={currentPage}
              isRecipientViewContentsHidden={petition.isRecipientViewContentsHidden}
              position="absolute"
              top={0}
              insetStart={0}
              height="100%"
              width={{ base: "323px", lg: "350px" }}
            />
          </MotionFlex>
        ) : null}
      </AnimatePresence>

      <Stack spacing={0} align="center" height="100%">
        <SidebarIconButton
          isActive={isOpen && sidebarState === "CONTENTS"}
          label={intl.formatMessage({
            id: "component.recipient-view-sidebar.contents-label",
            defaultMessage: "Contents",
          })}
          icon={ListIcon}
          onClick={() => setSidebarState("CONTENTS")}
          hasBorder
          placement="left"
        />
        <SidebarIconButton
          isActive={isOpen && sidebarState === "COMMENTS"}
          label={intl.formatMessage({
            id: "component.recipient-view-sidebar.comments-label",
            defaultMessage: "Comments",
          })}
          icon={CommentIcon}
          onClick={() => setSidebarState("COMMENTS")}
          hasBorder
          unreadCount={unreadCount}
          placement="left"
        />
        <SidebarIconButton
          isActive={isOpen && sidebarState === "INFORMATION"}
          label={intl.formatMessage({
            id: "component.recipient-view-sidebar.information-label",
            defaultMessage: "Information",
          })}
          icon={InfoCircleIcon}
          onClick={() => setSidebarState("INFORMATION")}
          hasBorder
          placement="left"
        />
      </Stack>
    </HStack>
  );
}

export function RecipientViewMobileNavigation({
  keycode,
  access,
  currentPage,
  pendingPetitions,
}: RecipientViewSidebarProps & { pendingPetitions: number }) {
  const intl = useIntl();

  const { setSidebarState, sidebarState } = useRecipientViewSidebarContext();
  const isOpen = sidebarState !== "CLOSED";
  const petition = access!.petition!;
  const granter = access!.granter;
  const contact = access!.contact!;

  const unreadCount =
    sumBy(petition.fields, (field) => (field.hasCommentsEnabled ? field.unreadCommentCount : 0)) +
    petition.unreadGeneralCommentCount;

  const delegateAccess = useDelegateAccess();

  const handleDelegateAccess = () => {
    delegateAccess({
      keycode,
      contactName: contact?.fullName ?? "",
      organizationName: granter?.organization?.name ?? "",
    });
  };

  return (
    <>
      {isOpen ? (
        <RecipientViewSidebarBody
          keycode={keycode}
          access={access}
          currentPage={currentPage}
          isRecipientViewContentsHidden={petition.isRecipientViewContentsHidden}
          display={{ base: "flex", [breakpoint]: "none" }}
          height="calc(100% - 57px)"
          position="absolute"
          bottom="57px"
          zIndex={3}
          width="100%"
          minHeight={0}
          bgColor="white"
          closeOnNavigate
        />
      ) : null}

      <HStack
        display={{ base: "flex", [breakpoint]: "none" }}
        backgroundColor="white"
        spacing={0}
        justify="space-between"
        align="center"
        paddingX={4}
      >
        <SidebarIconButton
          isActive={isOpen && sidebarState === "CONTENTS"}
          label={intl.formatMessage({
            id: "component.recipient-view-sidebar.contents-label",
            defaultMessage: "Contents",
          })}
          icon={ListIcon}
          onClick={() => setSidebarState("CONTENTS")}
          placement="top"
        />
        <SidebarIconButton
          isActive={isOpen && sidebarState === "COMMENTS"}
          label={intl.formatMessage({
            id: "component.recipient-view-sidebar.comments-label",
            defaultMessage: "Comments",
          })}
          icon={CommentIcon}
          onClick={() => setSidebarState("COMMENTS")}
          unreadCount={unreadCount}
          placement="top"
        />
        <SidebarIconButton
          isActive={isOpen && sidebarState === "INFORMATION"}
          label={intl.formatMessage({
            id: "component.recipient-view-sidebar.information-label",
            defaultMessage: "Information",
          })}
          icon={InfoCircleIcon}
          onClick={() => setSidebarState("INFORMATION")}
          placement="top"
        />
        <IconButtonWithTooltip
          variant="ghost"
          boxSize={14}
          borderRadius="0"
          label={intl.formatMessage({ id: "generic.share", defaultMessage: "Share" })}
          color="primary.500"
          icon={<UserArrowIcon boxSize={6} />}
          onClick={handleDelegateAccess}
          placement="top"
        />
        <Center boxSize={14}>
          <RecipientViewMenuButton
            keycode={keycode}
            contact={contact}
            hasClientPortalAccess={access.hasClientPortalAccess}
            pendingPetitions={pendingPetitions}
          />
        </Center>
      </HStack>
    </>
  );
}

function SidebarIconButton({
  isActive,
  label,
  icon,
  hasBorder,
  unreadCount,
  placement,
  onClick,
}: {
  isActive: boolean;
  label: string;
  icon: ComponentWithAs<"svg", IconProps>;
  hasBorder?: boolean;
  unreadCount?: number;
  placement?: "left" | "top";
  onClick: () => void;
}) {
  return (
    <Box position="relative">
      <IconButtonWithTooltip
        variant="ghost"
        boxSize={14}
        borderRadius="0"
        label={label}
        icon={<Icon as={icon} boxSize={6} />}
        placement={placement}
        onClick={onClick}
        backgroundColor={isActive ? "gray.100" : "inherit"}
        _hover={{
          backgroundColor: isActive ? "gray.300" : "gray.200",
        }}
        _active={{
          backgroundColor: isActive ? "gray.300" : "gray.200",
        }}
        borderBottom={hasBorder ? "1px solid" : undefined}
        borderBottomColor={hasBorder ? "gray.200" : undefined}
      />
      {unreadCount ? (
        <Badge
          position="absolute"
          top={2}
          insetEnd={2}
          background="primary.500"
          color="white"
          fontSize="xs"
          borderRadius="full"
          minW="18px"
          minH="18px"
          lineHeight="16px"
          border="1px solid white"
          pointerEvents="none"
          textAlign="center"
        >
          {unreadCount < 100 ? unreadCount : "99+"}
        </Badge>
      ) : null}
    </Box>
  );
}

const RecipientViewSidebarBody = chakraComponent<
  "div",
  {
    keycode: string;
    currentPage: number;
    access: RecipientViewSidebar_PublicPetitionAccessFragment;
    isRecipientViewContentsHidden: boolean;
    closeOnNavigate?: boolean;
  }
>(function RecipientViewSidebarBody({
  ref,
  keycode,
  currentPage,
  access,
  isRecipientViewContentsHidden,
  closeOnNavigate,
  ...props
}) {
  const { setSidebarState, sidebarState } = useRecipientViewSidebarContext();

  const handleClose = () => {
    setSidebarState("CLOSED");
  };

  return (
    <Flex ref={ref} {...props}>
      {isRecipientViewContentsHidden || sidebarState === "INFORMATION" ? (
        <RecipientViewInformation keycode={keycode} access={access} onClose={handleClose} />
      ) : sidebarState === "CONTENTS" ? (
        <RecipientViewContents
          currentPage={currentPage}
          petition={access!.petition!}
          onClose={handleClose}
          closeOnNavigate={closeOnNavigate}
        />
      ) : (
        <RecipientViewComments keycode={keycode} access={access} onClose={handleClose} />
      )}
    </Flex>
  );
});

const _fragments = {
  PublicPetitionAccess: gql`
    fragment RecipientViewSidebar_PublicPetitionAccess on PublicPetitionAccess {
      hasClientPortalAccess
      petition {
        id
        isRecipientViewContentsHidden
        unreadGeneralCommentCount
        ...RecipientViewContents_PublicPetition
        fields {
          id
          unreadCommentCount
        }
      }
      contact {
        id
        ...RecipientViewMenuButton_PublicContact
      }
      ...RecipientViewComments_PublicPetitionAccess
      ...RecipientViewInformation_PublicPetitionAccess
    }
  `,
};
