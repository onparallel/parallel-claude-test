import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  IconButton,
  Image,
  List,
  ListItem,
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import {
  AddIcon,
  AlertCircleFilledIcon,
  BoxedArrowLeft,
  HamburgerMenuIcon,
  HelpOutlineIcon,
  NewsIcon,
  PaperPlaneIcon,
  ProfilesIcon,
  ReportsIcon,
  SidebarIcon,
  TimeAlarmIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import { AppLayoutNavBar_QueryFragment } from "@parallel/graphql/__types";
import { useCookie } from "@parallel/utils/useCookie";
import { useDeviceType } from "@parallel/utils/useDeviceType";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useIsFocusWithin } from "@parallel/utils/useIsFocusWithin";
import { useIsMouseOver } from "@parallel/utils/useIsMouseOver";
import { useLocalStorage } from "@parallel/utils/useLocalStorage";
import { useRouter } from "next/router";
import { memo, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { CloseButton } from "../common/CloseButton";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { Logo } from "../common/Logo";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { SupportLink } from "../common/SupportLink";
import { Wrap } from "../common/Wrap";
import { useAlertsContactUsDialog } from "../common/dialogs/AlertsContactUsDialog";
import { useProfilesContactUsDialog } from "../common/dialogs/ProfilesContactUsDialog";
import { NotificationsButton } from "../notifications/NotificationsButton";
import { NavBarButton } from "./NavBarButton";
import { UserMenu } from "./UserMenu";

const ANIMATION_DURATION = "200ms";
const ANIMATION_DELAY = "150ms";
const ANIMATION_TIMING = "ease-in-out";

export interface AppLayoutNavBarProps extends Pick<AppLayoutNavBar_QueryFragment, "realMe" | "me"> {
  onHelpCenterClick: () => void;
}

export const AppLayoutNavBar = Object.assign(
  memo(function AppLayoutNavBar({ me, realMe, onHelpCenterClick }: AppLayoutNavBarProps) {
    const intl = useIntl();

    const closeRef = useRef<HTMLButtonElement>(null);
    const navRef = useRef<HTMLElement>(null);

    const [isForceOpen, setIsForceOpen] = useCookie(`navbar-expanded-${realMe.id}`, false);
    const isFocusWithin = useIsFocusWithin(navRef);
    const isHovered = useIsMouseOver(navRef);
    const [isOpenMobile, setIsOpenMobile] = useState(false);
    // keep track of the state of the user menu to prevent the navbar to hide when the menu is open
    const [userMenuIsOpen, setUserMenuIsOpen] = useState(false);
    const deviceType = useDeviceType();
    const isMobile = useBreakpointValue(
      { base: true, sm: false },
      { fallback: deviceType === "mobile" ? "base" : "sm" },
    )!;

    // use local storage to store the state so that  it persists between page changes
    const [isOpenDesktop, setIsOpenDesktop] = useLocalStorage("navbar-opened", false);
    useEffect(() => {
      if (!isMobile) {
        setIsOpenDesktop(isFocusWithin || isHovered || userMenuIsOpen);
      }
    }, [isMobile, isFocusWithin, isHovered, userMenuIsOpen]);

    const isNavBarOpen = isMobile ? isOpenMobile : isForceOpen || isOpenDesktop;

    return (
      <Box
        as="nav"
        ref={navRef}
        id="nav-bar"
        zIndex={2}
        data-nav-bar-expanded={isNavBarOpen}
        position="relative"
        width={{ base: "100%", sm: isForceOpen ? "200px" : "64px" }}
        transition={{ sm: "width 150ms ease-out" }}
        sx={{
          ".show-on-expand": {
            transition: {
              sm: `opacity ${ANIMATION_DURATION} ${ANIMATION_TIMING} ${ANIMATION_DELAY}`,
            },
            opacity: { sm: 0 },
          },
          '&[data-nav-bar-expanded="true"]': {
            ".show-on-expand": {
              opacity: { sm: 1 },
            },
            "#nav-bar-menu": {
              minWidth: { sm: "200px" },
              boxShadow: { sm: isForceOpen ? "none" : "xl" },
            },
          },
        }}
      >
        <HStack
          display={{ base: "flex", sm: "none" }}
          height="48px"
          paddingX={4}
          borderBottom={{ base: "1px solid", sm: "none" }}
          borderColor="gray.200"
          background={{ base: "white", sm: undefined }}
        >
          <IconButton
            size="sm"
            variant="ghost"
            icon={<HamburgerMenuIcon boxSize={5} />}
            aria-label={intl.formatMessage({
              id: "component.new-layout.open-navigation",
              defaultMessage: "Open navigation",
            })}
            onClick={() => setIsOpenMobile(true)}
          />
          <Spacer />
          <NotificationsSectionMobile onHelpCenterClick={onHelpCenterClick} />
          <UserMenu placement={isMobile ? "bottom-end" : "right-end"} me={me} realMe={realMe} />
        </HStack>
        <Wrap
          when={isMobile ?? false}
          wrapper={({ children }) => (
            <Drawer
              isOpen={isOpenMobile}
              onClose={() => setIsOpenMobile(false)}
              placement="left"
              closeOnOverlayClick
              closeOnEsc
              initialFocusRef={closeRef}
            >
              <DrawerOverlay />
              <DrawerContent width="200px !important">{children}</DrawerContent>
            </Drawer>
          )}
        >
          <Stack
            id="nav-bar-menu"
            spacing={4}
            overflow="hidden"
            backgroundColor="white"
            zIndex={isMobile ? "modal" : 1}
            minWidth={isNavBarOpen ? "200px" : "64px"}
            maxWidth="100%"
            height="100vh"
            position="absolute"
            top={0}
            insetStart={0}
            paddingY={4}
            paddingX={3}
            borderEnd="1px solid"
            borderColor="gray.200"
            transitionDelay={{ base: "0s", sm: ANIMATION_DELAY }}
            transitionDuration={ANIMATION_DURATION}
            transitionTimingFunction={ANIMATION_TIMING}
            transitionProperty={{
              base: "none",
              sm: [`min-width`, `box-shadow`].join(", "),
            }}
          >
            <HStack width="100%" justify="space-between">
              <NakedLink href="/app">
                <Box as="a" width="40px" height="40px" position="relative" zIndex={1}>
                  <Tooltip
                    label={intl.formatMessage({
                      id: "component.app-layout-nav-bar.switch-organization",
                      defaultMessage: "Switch organization",
                    })}
                    placement="right"
                    isDisabled={realMe.organizations.length === 1}
                    openDelay={600}
                  >
                    <Box
                      position="absolute"
                      cursor="pointer"
                      transition="transform 150ms"
                      width="40px"
                      height="40px"
                      borderRadius="full"
                      _hover={{
                        color: "gray.900",
                        shadow: "lg",
                        transform: "scale(1.1)",
                      }}
                      overflow="hidden"
                    >
                      {me.organization.iconUrl ? (
                        <Image
                          boxSize="40px"
                          objectFit="contain"
                          alt={me.organization.name}
                          src={me.organization.iconUrl}
                        />
                      ) : (
                        <Logo width="40px" hideText={true} color="gray.800" padding={1.5} />
                      )}
                    </Box>
                  </Tooltip>
                </Box>
              </NakedLink>
              <IconButtonWithTooltip
                display={{ base: "none", sm: "inline-flex" }}
                className="show-on-expand"
                size="sm"
                variant="outline"
                aria-expanded={isForceOpen}
                aria-controls="nav-bar"
                icon={isForceOpen ? <BoxedArrowLeft boxSize={5} /> : <SidebarIcon boxSize={5} />}
                label={
                  isForceOpen
                    ? intl.formatMessage({
                        id: "component.new-layout.hide-navigation",
                        defaultMessage: "Hide navigation",
                      })
                    : intl.formatMessage({
                        id: "component.new-layout.keep-navigation-open",
                        defaultMessage: "Keep navigation open",
                      })
                }
                placement="right"
                onClick={() => setIsForceOpen((x) => !x)}
              />
              <CloseButton
                ref={closeRef}
                display={{ base: "inline-flex", sm: "none" }}
                size="sm"
                onClick={() => setIsOpenMobile(false)}
              />
            </HStack>
            <Flex>
              <NakedLink href={`/app/petitions/new`}>
                <Button
                  as="a"
                  colorScheme="purple"
                  width="full"
                  leftIcon={<AddIcon boxSize={4} />}
                  iconSpacing={0}
                  paddingInlineStart={3}
                  paddingInlineEnd={3}
                  justifyContent="space-evenly"
                >
                  <Text as="span" className="show-on-expand" minWidth={0}>
                    <FormattedMessage id="generic.new-petition" defaultMessage="New parallel" />
                  </Text>
                </Button>
              </NakedLink>
            </Flex>
            {/* <CreateMenuButtonSection onOpenOrClose={handleOpenCloseMenu} isMobile={isMobile} /> */}
            <SectionList me={me} />
            <Spacer />
            <Stack spacing={2} display={{ base: "none", sm: "flex" }}>
              <NotificationsSection onHelpCenterClick={onHelpCenterClick} />
              <UserMenu
                placement={isMobile ? "bottom-end" : "right-end"}
                me={me}
                realMe={realMe}
                extended
                onToggle={(isOpen) => setUserMenuIsOpen(isOpen)}
              />
            </Stack>
          </Stack>
        </Wrap>
      </Box>
    );
  }),
  {
    fragments: {
      get Query() {
        return gql`
          fragment AppLayoutNavBar_Query on Query {
            realMe {
              id
              organizations {
                id
              }
            }
            me {
              id
              hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
              organization {
                id
                name
                iconUrl: iconUrl(options: { resize: { width: 80 } })
                isPetitionUsageLimitReached: isUsageLimitReached(limitName: PETITION_SEND)
                currentUsagePeriod(limitName: PETITION_SEND) {
                  id
                  limit
                }
              }
            }
            ...UserMenu_Query
            ...useDeviceType_Query
          }
          ${UserMenu.fragments.Query}
          ${useDeviceType.fragments.Query}
        `;
      },
    },
  },
);

interface SectionListProps extends Pick<AppLayoutNavBar_QueryFragment, "me"> {}

function SectionList({ me }: SectionListProps) {
  const intl = useIntl();
  const router = useRouter();
  const { pathname, query } = router;

  const userCanViewReports = useHasPermission(
    ["REPORTS:OVERVIEW", "REPORTS:TEMPLATE_REPLIES", "REPORTS:TEMPLATE_STATISTICS"],
    "OR",
  );

  const userCanViewProfiles = useHasPermission("PROFILES:LIST_PROFILES");
  const userCanViewAlerts = useHasPermission("PROFILE_ALERTS:LIST_ALERTS");
  const userCanViewContacts = useHasPermission("CONTACTS:LIST_CONTACTS");

  const showProfilesContactUsDialog = useProfilesContactUsDialog();
  const handleProfilesClick = async (e: MouseEvent) => {
    e.preventDefault();
    await showProfilesContactUsDialog.ignoringDialogErrors();
  };

  const showAlertsContactUsDialog = useAlertsContactUsDialog();
  const handleAlertsClick = async (e: MouseEvent) => {
    e.preventDefault();
    await showAlertsContactUsDialog.ignoringDialogErrors();
  };

  const items = useMemo(
    () => [
      {
        section: "petitions",
        href: "/app/petitions",
        icon: <PaperPlaneIcon boxSize={5} />,
        isActive:
          pathname.startsWith("/app/petitions") && !pathname.startsWith("/app/petitions/new"),
        text: intl.formatMessage({
          id: "generic.root-petitions",
          defaultMessage: "Parallels",
        }),
        warning: me.organization.isPetitionUsageLimitReached
          ? intl.formatMessage(
              {
                id: "component.app-layout-nav-bar.parallels-limit-reached-warning",
                defaultMessage:
                  "It seems that you have reached your limit of {limit} parallels, <a>reach out to us to upgrade your plan.</a>",
              },
              {
                limit: me.organization.currentUsagePeriod?.limit ?? 0,
                a: (chunks: any[]) => (
                  <SupportLink
                    message={intl.formatMessage({
                      id: "generic.upgrade-plan-support-message",
                      defaultMessage:
                        "Hi, I would like to get more information about how to upgrade my plan.",
                    })}
                  >
                    {chunks}
                  </SupportLink>
                ),
              },
            )
          : undefined,
      },
      ...(!me.hasProfilesAccess || userCanViewProfiles
        ? [
            {
              section: "profiles",
              href: "/app/profiles",
              icon: <ProfilesIcon boxSize={5} />,
              isActive: pathname.startsWith("/app/profiles"),
              onClick: me.hasProfilesAccess ? undefined : handleProfilesClick,
              text: intl.formatMessage({
                id: "component.app-layout-nav-bar.profiles-link",
                defaultMessage: "Profiles",
              }),
            },
          ]
        : []),
      ...(!me.hasProfilesAccess || userCanViewAlerts
        ? [
            {
              section: "alerts",
              href: "/app/alerts",
              icon: <TimeAlarmIcon boxSize={5} />,
              isActive: pathname.startsWith("/app/alerts"),
              onClick: me.hasProfilesAccess ? undefined : handleAlertsClick,
              text: intl.formatMessage({
                id: "component.app-layout-nav-bar.alerts-link",
                defaultMessage: "Alerts",
              }),
            },
          ]
        : []),
      ...(userCanViewReports
        ? [
            {
              section: "reports",
              icon: <ReportsIcon boxSize={5} />,
              href: "/app/reports",
              isActive: pathname.startsWith("/app/reports"),
              text: intl.formatMessage({
                id: "component.app-layout-nav-bar.reports-link",
                defaultMessage: "Reports",
              }),
            },
          ]
        : []),
      ...(userCanViewContacts
        ? [
            {
              section: "contacts",
              href: "/app/contacts",
              icon: <UsersIcon boxSize={5} />,
              isActive: pathname.startsWith("/app/contacts"),
              text: intl.formatMessage({
                id: "component.app-layout-nav-bar.contacts-link",
                defaultMessage: "Recipients",
              }),
            },
          ]
        : []),
    ],
    [intl.locale, pathname, query],
  );
  return (
    <List spacing={2}>
      {items.map(({ section, href, isActive, icon, text, warning, onClick }) => (
        <ListItem key={section}>
          <Wrap
            when={isNonNullish(warning)}
            wrapper={({ children }) => (
              <SmallPopover content={warning} placement="right" openDelay={450}>
                <Box>{children}</Box>
              </SmallPopover>
            )}
          >
            <NakedLink href={href!}>
              <NavBarButton
                as="a"
                isActive={isActive}
                section={section}
                onClick={onClick}
                icon={icon}
                badge={
                  warning ? (
                    <AlertCircleFilledIcon
                      position="absolute"
                      color="yellow.500"
                      boxSize="14px"
                      insetStart={-1}
                      top={-1}
                    />
                  ) : null
                }
              >
                {text}
              </NavBarButton>
            </NakedLink>
          </Wrap>
        </ListItem>
      ))}
    </List>
  );
}

// function CreateMenuButtonSection({
//   onOpenOrClose,
//   isMobile,
// }: {
//   onOpenOrClose: (isOpen: boolean) => void;
//   isMobile?: boolean;
// }) {
//   return (
//     <Flex>
//       <Menu
//         placement={isMobile ? "bottom" : "end"}
//         onOpen={() => onOpenOrClose(true)}
//         onClose={() => onOpenOrClose(false)}
//       >
//         <MenuButton
//           as={Button}
//           colorScheme="purple"
//           width="full"
//           leftIcon={<AddIcon boxSize={4} />}
//           iconSpacing={0}
//         >
//           <Text as="span" className="show-on-expand">
//             <FormattedMessage
//               id="component.new-layout.create-new-button"
//               defaultMessage="Create new"
//             />
//           </Text>
//         </MenuButton>
//         <Portal>
//           <MenuList minWidth="auto">
//             <MenuItem icon={<PaperPlaneIcon boxSize={4} />}>{untranslated("Parallel")}</MenuItem>
//             <MenuItem icon={<UserIcon boxSize={4} />}>{untranslated("Persona fisica")}</MenuItem>
//             <MenuItem icon={<BusinessIcon boxSize={4} />}>{untranslated("Compañia")}</MenuItem>
//           </MenuList>
//         </Portal>
//       </Menu>
//     </Flex>
//   );
// }

function NotificationsSection({ onHelpCenterClick }: { onHelpCenterClick: () => void }) {
  const intl = useIntl();
  return (
    <List spacing={2}>
      <ListItem>
        <NotificationsButton extended />
      </ListItem>
      <ListItem>
        <NavBarButton
          sx={{
            ".Canny_BadgeContainer .Canny_Badge": {
              backgroundColor: "red.500",
              border: "2px solid white",
              top: "7px",
              insetStart: "23px",
              boxSize: 3,
              borderRadius: "full",
              position: "absolute",
            },
          }}
          icon={<NewsIcon boxSize={5} />}
          onClick={onHelpCenterClick}
        >
          <FormattedMessage id="generic.product-news-label" defaultMessage="News" />
        </NavBarButton>
      </ListItem>
      <ListItem>
        <NakedLink href={`https://help.onparallel.com/${intl.locale}`}>
          <NavBarButton onClick={onHelpCenterClick} icon={<HelpOutlineIcon boxSize={5} />}>
            <FormattedMessage id="component.new-layout.help-button" defaultMessage="Help" />
          </NavBarButton>
        </NakedLink>
      </ListItem>
    </List>
  );
}

function NotificationsSectionMobile({ onHelpCenterClick }: { onHelpCenterClick: () => void }) {
  const intl = useIntl();
  return (
    <>
      <NotificationsButton />
      <IconButtonWithTooltip
        position="relative"
        sx={{
          ".Canny_BadgeContainer .Canny_Badge": {
            backgroundColor: "red.500",
            border: "2px solid white",
            top: "5px",
            insetEnd: "3px",
            boxSize: "16px",
            borderRadius: "full",
            position: "absolute",
          },
        }}
        label={intl.formatMessage({
          id: "generic.product-news-label",
          defaultMessage: "News",
        })}
        placement="bottom"
        size="md"
        variant="ghost"
        backgroundColor="white"
        isRound
        onClick={onHelpCenterClick}
        icon={<NewsIcon boxSize={5} />}
        data-canny-changelog
      />
      <IconButtonWithTooltip
        label={intl.formatMessage({
          id: "generic.help-center",
          defaultMessage: "Help center",
        })}
        as="a"
        data-testid="help-center-button"
        href={`https://help.onparallel.com/${intl.locale}`}
        rel="noopener"
        target="_blank"
        placement="bottom"
        size="md"
        variant="ghost"
        backgroundColor="white"
        isRound
        onClick={onHelpCenterClick}
        icon={<HelpOutlineIcon boxSize={5} />}
      />
    </>
  );
}
