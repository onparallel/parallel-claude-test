import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  LinkBox,
  LinkOverlay,
  List,
  ListItem,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  StackProps,
  Text,
  useBreakpointValue,
  useMenuItem,
} from "@chakra-ui/react";
import { Menu, Tooltip } from "@parallel/chakra/components";
import {
  AddIcon,
  AlertCircleFilledIcon,
  BusinessIcon,
  ChevronLeftIcon,
  HamburgerMenuIcon,
  HelpOutlineIcon,
  HomeIcon,
  MoreVerticalIcon,
  NewsIcon,
  PaperPlaneIcon,
  PinIcon,
  ReportsIcon,
  TimeAlarmIcon,
  UserIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import {
  AppLayoutNavBar_ProfileTypeFragment,
  AppLayoutNavBar_QueryFragment,
} from "@parallel/graphql/__types";
import { useHandleNavigation } from "@parallel/utils/navigation";
import { untranslated } from "@parallel/utils/untranslated";
import { useBrowserMetadata } from "@parallel/utils/useBrowserMetadata";
import { useCookie } from "@parallel/utils/useCookie";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { useIsFocusWithin } from "@parallel/utils/useIsFocusWithin";
import { useIsMouseOver } from "@parallel/utils/useIsMouseOver";
import { useLocalStorage } from "@parallel/utils/useLocalStorage";
import { usePinProfileType } from "@parallel/utils/usePinProfileType";
import { useUnpinProfileType } from "@parallel/utils/useUnpinProfileType";
import { useRouter } from "next/router";
import {
  forwardRef,
  MouseEvent,
  MouseEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import smoothScrollIntoView from "smooth-scroll-into-view-if-needed";
import { CloseButton } from "../common/CloseButton";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import {
  LocalizableUserText,
  localizableUserTextRender,
} from "../common/LocalizableUserTextRender";
import { Logo } from "../common/Logo";
import { OverflownText } from "../common/OverflownText";
import { ProfileTypeReference } from "../common/ProfileTypeReference";
import { ScrollShadows } from "../common/ScrollShadows";
import { SmallPopover } from "../common/SmallPopover";
import { Spacer } from "../common/Spacer";
import { SupportLink } from "../common/SupportLink";
import { Wrap } from "../common/Wrap";
import { useAlertsContactUsDialog } from "../common/dialogs/AlertsContactUsDialog";
import { useProfilesContactUsDialog } from "../common/dialogs/ProfilesContactUsDialog";
import { NotificationsButton } from "../notifications/NotificationsButton";
import { getProfileTypeIcon } from "../organization/profiles/getProfileTypeIcon";
import { useCreateProfileDialog } from "../profiles/dialogs/CreateProfileDialog";
import { NavBarButton } from "./NavBarButton";
import { UserMenu } from "./UserMenu";

const ANIMATION_DURATION = "200ms";
const ANIMATION_DELAY = "150ms";
const ANIMATION_TIMING = "ease-in-out";

export interface AppLayoutNavBarProps {
  queryObject: AppLayoutNavBar_QueryFragment;
  onHelpCenterClick: () => void;
}

export function AppLayoutNavBar({ queryObject, onHelpCenterClick }: AppLayoutNavBarProps) {
  const { me, realMe, appLayoutNavBarProfileTypes: profileTypes } = queryObject;
  const intl = useIntl();

  const closeRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const [isForceOpen, setIsForceOpen] = useCookie(`navbar-expanded-${realMe.id}`, false);
  const isFocusWithin = useIsFocusWithin(navRef);
  const isHovered = useIsMouseOver(navRef);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  // keep track of the state of the different menus to prevent the navbar to hide when the menu is open
  const [subMenuIsOpen, setSubMenuIsOpen] = useState(false);
  function handleSubMenuToggle(isOpen: boolean) {
    setSubMenuIsOpen(isOpen);
    if (!isOpen && !isForceOpen) {
      setTimeout(() => {
        (document.activeElement as any)?.blur?.();
      });
    }
  }
  const { deviceType } = useBrowserMetadata();
  const isMobile = useBreakpointValue(
    { base: true, sm: false },
    { fallback: deviceType === "mobile" ? "base" : "sm" },
  )!;

  // use local storage to store the state so that  it persists between page changes
  const [isOpenDesktop, setIsOpenDesktop] = useLocalStorage("navbar-opened", false);
  useEffect(() => {
    if (!isMobile) {
      setIsOpenDesktop((isFocusWithin || isHovered || subMenuIsOpen) && !isForceOpen);
    }
  }, [isMobile, isFocusWithin, isHovered, subMenuIsOpen]);

  const isNavBarOpen = isMobile ? isOpenMobile : isForceOpen || isOpenDesktop;

  const handlePinNavbarClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (isForceOpen) {
      // after unpinning feels strange that the menu wont close when moving the mouse away.
      e.currentTarget.blur();
    }
    setIsForceOpen(!isForceOpen);
  };

  return (
    <Box
      as="nav"
      className="no-print"
      ref={navRef}
      id="nav-bar"
      zIndex={isOpenDesktop ? 41 : 2}
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
        ".expand-button": {
          opacity: 0,
          // prevent tooltip showing when hovering the menu close to the button
          pointerEvents: "none",
          transition: `opacity ${ANIMATION_DURATION} ${ANIMATION_TIMING} ${ANIMATION_DELAY}`,
        },
        '&[data-nav-bar-expanded="true"]': {
          ".show-on-expand": {
            opacity: { sm: 1 },
          },
          "#nav-bar-menu": {
            minWidth: { sm: "200px" },
            boxShadow: { sm: isForceOpen ? "none" : "xl" },
          },
          ".expand-button": {
            opacity: 1,
            pointerEvents: "unset",
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
          backgroundColor="white"
          zIndex={isMobile ? "modal" : 1}
          minWidth={isNavBarOpen ? "200px" : "64px"}
          maxWidth="100%"
          height="100vh"
          position="absolute"
          top={0}
          insetStart={0}
          paddingX={0}
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
          <Stack spacing={4} flex="1" minHeight={0}>
            <HStack
              paddingTop={4}
              paddingX={3}
              width="100%"
              justify="space-between"
              position="relative"
            >
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
                      {me.organization.iconUrl80 ? (
                        <Image
                          boxSize="40px"
                          objectFit="contain"
                          alt={me.organization.name}
                          src={me.organization.iconUrl80}
                        />
                      ) : (
                        <Logo width="40px" hideText={true} color="gray.800" padding={1.5} />
                      )}
                    </Box>
                  </Tooltip>
                </Box>
              </NakedLink>
              {/* This Center adds a bit of margin around to make it the button easier to click, preventing the menu from closing when the mouse goes by a slight margin. Uncomment background to see */}
              <Center
                rounded="100%"
                boxSize={10}
                // background="red"
                display={{ base: "none", sm: "inline-flex" }}
                position="absolute"
                insetEnd={0}
                transform="translateX(50%)"
                top={4}
                className="expand-button"
              >
                <IconButtonWithTooltip
                  size="xs"
                  variant="outline"
                  aria-expanded={isForceOpen}
                  aria-controls="nav-bar"
                  borderRadius="full"
                  backgroundColor="white"
                  icon={isForceOpen ? <ChevronLeftIcon boxSize={5} /> : <PinIcon boxSize={3} />}
                  label={
                    isForceOpen
                      ? intl.formatMessage({
                          id: "component.new-layout.hide-navigation",
                          defaultMessage: "Hide navigation",
                        })
                      : intl.formatMessage({
                          id: "component.new-layout.keep-navigation-open",
                          defaultMessage: "Pin navigation",
                        })
                  }
                  placement="right"
                  onClick={handlePinNavbarClick}
                />
              </Center>
              <CloseButton
                ref={closeRef}
                display={{ base: "inline-flex", sm: "none" }}
                size="sm"
                onClick={() => setIsOpenMobile(false)}
              />
            </HStack>
            <Box paddingX={3}>
              <CreateMenuButtonSection
                onToggle={handleSubMenuToggle}
                isMobile={isMobile}
                me={me}
                isForceOpen={isForceOpen}
              />
            </Box>
            <Stack
              spacing={4}
              overflowY="auto"
              overflowX="hidden"
              minHeight={0}
              paddingBottom={4}
              flex={1}
            >
              <Stack flex={1} spacing={4} paddingX={3}>
                <SectionsAndProfilesList
                  onToggle={handleSubMenuToggle}
                  isMobile={isMobile}
                  me={me}
                  profileTypes={profileTypes}
                />
                <Spacer />
                <NotificationsSection
                  display={{ base: "none", sm: "flex" }}
                  onHelpCenterClick={onHelpCenterClick}
                />
              </Stack>
              <Box display={{ base: "none", sm: "flex" }}>
                <UserMenu
                  placement={isMobile ? "bottom-end" : "right-end"}
                  me={me}
                  realMe={realMe}
                  extended
                  onToggle={handleSubMenuToggle}
                />
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Wrap>
    </Box>
  );
}

const _fragments = {
  ProfileType: gql`
    fragment AppLayoutNavBar_ProfileType on ProfileType {
      id
      name
      icon
      isPinned
      canCreate
      ...ProfileTypeReference_ProfileType
    }
  `,
  User: gql`
    fragment AppLayoutNavBar_User on User {
      id
      hasDashboardsAccess: hasFeatureFlag(featureFlag: DASHBOARDS)
      hasProfilesAccess: hasFeatureFlag(featureFlag: PROFILES)
      hasShowContactsButton: hasFeatureFlag(featureFlag: SHOW_CONTACTS_BUTTON)
      organization {
        id
        name
        iconUrl80: iconUrl(options: { resize: { width: 80 } })
        isPetitionUsageLimitReached: isUsageLimitReached(limitName: PETITION_SEND)
        currentUsagePeriod(limitName: PETITION_SEND) {
          id
          limit
        }
      }
      pinnedProfileTypes {
        id
        ...AppLayoutNavBar_ProfileType
      }
    }
  `,
  Query: gql`
    fragment AppLayoutNavBar_Query on Query {
      realMe {
        id
        organizations {
          id
        }
      }
      me {
        ...AppLayoutNavBar_User
      }
      appLayoutNavBarProfileTypes: profileTypes(
        limit: 100
        offset: 0
        filter: { includeArchived: true }
      ) {
        totalCount
        items {
          id
          ...AppLayoutNavBar_ProfileType
        }
      }
      ...UserMenu_Query
    }
  `,
};

interface SectionsAndProfilesListProps {
  me: AppLayoutNavBar_QueryFragment["me"];
  profileTypes: AppLayoutNavBar_QueryFragment["appLayoutNavBarProfileTypes"];
  onToggle: (isOpen: boolean) => void;
  isMobile: boolean;
}

function SectionsAndProfilesList({
  onToggle,
  isMobile,
  me,
  profileTypes,
}: SectionsAndProfilesListProps) {
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
  const userCanViewDashboards = useHasPermission("DASHBOARDS:LIST_DASHBOARDS");

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
      ...(me.hasDashboardsAccess && userCanViewDashboards
        ? [
            {
              section: "home",
              href: "/app/home",
              icon: <HomeIcon boxSize={5} />,
              isActive: pathname.startsWith("/app/home"),
              text: intl.formatMessage({
                id: "component.app-layout-nav-bar.home-link",
                defaultMessage: "Home",
              }),
            },
          ]
        : []),
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
      ...(userCanViewContacts && me.hasShowContactsButton
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

  const sortedProfileTypes = useMemo(() => {
    return (
      [...profileTypes.items].sort((profileTypeA, profileTypeB) => {
        const profileTypeAName = localizableUserTextRender({
          intl,
          value: profileTypeA.pluralName,
          default: localizableUserTextRender({
            intl,
            value: profileTypeA.name,
            default: intl.formatMessage({
              id: "generic.unnamed-profile-type",
              defaultMessage: "Unnamed profile type",
            }),
          }),
        });
        const profileTypeBName = localizableUserTextRender({
          intl,
          value: profileTypeB.pluralName,
          default: localizableUserTextRender({
            intl,
            value: profileTypeB.name,
            default: intl.formatMessage({
              id: "generic.unnamed-profile-type",
              defaultMessage: "Unnamed profile type",
            }),
          }),
        });
        return profileTypeAName.localeCompare(profileTypeBName);
      }) ?? []
    );
  }, [profileTypes.items.flatMap((p) => [p.id, p.isPinned]).join("")]);

  const unpinProfileType = useUnpinProfileType();
  const pinProfileType = usePinProfileType();

  const handlePinAndUnpinProfileType = async (profileType: AppLayoutNavBar_ProfileTypeFragment) => {
    try {
      if (profileType.isPinned) {
        await unpinProfileType(profileType.id);
      } else {
        await pinProfileType(profileType.id);
      }
    } catch {}
  };

  return (
    <>
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
      {userCanViewProfiles ? (
        <>
          <HStack spacing={0} className="show-on-expand">
            <Text fontSize="sm" fontWeight={500} flex="1">
              <FormattedMessage
                id="component.app-layout-nav-bar.profiles"
                defaultMessage="Profiles"
              />
              :
            </Text>
            {me.hasProfilesAccess && sortedProfileTypes.length > 0 ? (
              <Menu
                placement={isMobile ? "bottom" : "end-start"}
                onOpen={() => onToggle(true)}
                onClose={() => onToggle(false)}
              >
                <MenuButton
                  as={IconButtonWithTooltip}
                  size="xs"
                  variant="ghost"
                  icon={<MoreVerticalIcon boxSize={3} />}
                  label={intl.formatMessage({
                    id: "component.app-layout-nav-bar.view-all-profiles",
                    defaultMessage: "View all profiles",
                  })}
                />
                <Portal>
                  <MenuList padding={0}>
                    <ScrollShadows
                      onFocus={(e) => {
                        smoothScrollIntoView(e.target, {
                          scrollMode: "if-needed",
                          behavior: "smooth",
                        });
                      }}
                      minWidth="auto"
                      maxWidth="280px"
                      display="flex"
                      flexDirection="column"
                      gap={2}
                      paddingY={4}
                      paddingX={3}
                      maxHeight="400px"
                      overflow="auto"
                    >
                      {sortedProfileTypes.map((profileType) => {
                        const isActive =
                          pathname === "/app/profiles" && query.type === profileType.id;
                        return (
                          <ProfileTypeButton
                            key={profileType.id}
                            profileType={profileType}
                            isActive={isActive}
                            onTogglePinned={handlePinAndUnpinProfileType.bind(null, profileType)}
                          />
                        );
                      })}
                    </ScrollShadows>
                  </MenuList>
                </Portal>
              </Menu>
            ) : null}
          </HStack>
          {me.hasProfilesAccess ? (
            <List spacing={2}>
              {me.pinnedProfileTypes.length ? (
                me.pinnedProfileTypes.map((profileType) => {
                  const icon = getProfileTypeIcon(profileType.icon);
                  return (
                    <ListItem key={profileType.id}>
                      <NakedLink href={`/app/profiles?type=${profileType.id}`}>
                        <NavBarButton
                          as="a"
                          isActive={pathname === "/app/profiles" && query.type === profileType.id}
                          section={`profiles`}
                          icon={<Icon as={icon} boxSize={5} />}
                        >
                          <ProfileTypeReference profileType={profileType} usePlural />
                        </NavBarButton>
                      </NakedLink>
                    </ListItem>
                  );
                })
              ) : (
                <ListItem className="show-on-expand">
                  <Text textStyle="muted" fontSize="sm" noOfLines={1}>
                    <FormattedMessage
                      id="component.app-layout-nav-bar.no-profiles"
                      defaultMessage="No profiles"
                    />
                  </Text>
                </ListItem>
              )}
            </List>
          ) : (
            <List spacing={2}>
              <ListItem>
                <NavBarButton
                  as="a"
                  href=""
                  icon={<UserIcon boxSize={5} />}
                  onClick={handleProfilesClick}
                >
                  <FormattedMessage
                    id="component.app-layout-nav-bar.individuals-button"
                    defaultMessage="Individuals"
                  />
                </NavBarButton>
              </ListItem>
              <ListItem>
                <NavBarButton
                  as="a"
                  href=""
                  icon={<BusinessIcon boxSize={5} />}
                  onClick={handleProfilesClick}
                >
                  <FormattedMessage
                    id="component.app-layout-nav-bar.companies-button"
                    defaultMessage="Companies"
                  />
                </NavBarButton>
              </ListItem>
            </List>
          )}
        </>
      ) : null}
    </>
  );
}

interface ProfileTypeButtonProps {
  isActive: boolean;
  profileType: AppLayoutNavBar_ProfileTypeFragment;
  onTogglePinned: () => void;
}

const ProfileTypeButton = forwardRef<HTMLAnchorElement, ProfileTypeButtonProps>(
  function ProfileTypeButton({ profileType, isActive, onTogglePinned, ...rest }, ref) {
    const intl = useIntl();

    const menuItemProps = useMenuItem(rest, ref);
    const icon = getProfileTypeIcon(profileType.icon);
    return (
      <LinkBox
        key={profileType.id}
        sx={{
          color: "gray.600",
          background: "transparent",
          minHeight: "40px",
          rounded: "md",
          display: "flex",
          gap: 3,
          paddingX: 2.5,
          alignItems: "center",
          "&:focus-within, &:hover": {
            color: "gray.800",
            background: "gray.100",
            ".show-on-hover": {
              opacity: 1,
            },
            '&:has(a[aria-current="page"])': {
              color: "blue.900",
            },
          },
          '&:has(a[aria-current="page"])': {
            color: "blue.700",
            background: "blue.50",
          },
          "svg.custom-icon": {
            transition: "transform 150ms ease",
          },
          "&:hover svg.custom-icon": {
            transform: "scale(1.2)",
          },
        }}
      >
        <Icon className="custom-icon" as={icon} boxSize={5} />
        <NakedLink href={`/app/profiles?type=${profileType.id}`}>
          <OverflownText
            as={LinkOverlay}
            aria-current={isActive ? "page" : undefined}
            minWidth={0}
            flex={1}
            _focusVisible={{ outline: "none" }}
            {...menuItemProps}
          >
            <ProfileTypeReference profileType={profileType} usePlural />
          </OverflownText>
        </NakedLink>
        <IconButtonWithTooltip
          variant="ghost"
          rounded="full"
          marginStart={1}
          sx={{
            "&:hover, &:focus": {
              background: "gray.200",
              opacity: 1,
              "svg > g": {
                stroke: "gray.600",
                fill: "primary.600",
              },
            },
            ...(profileType.isPinned
              ? {
                  "svg > g": {
                    stroke: "primary.600",
                    fill: "primary.600",
                  },
                }
              : {}),
          }}
          className="show-on-hover"
          opacity={profileType.isPinned ? 1 : 0}
          size="sm"
          icon={<PinIcon boxSize={4} />}
          label={
            profileType.isPinned
              ? intl.formatMessage({
                  id: "component.app-layout-nav-bar.remove-from-menu",
                  defaultMessage: "Remove from menu",
                })
              : intl.formatMessage({
                  id: "component.app-layout-nav-bar.pin-to-menu",
                  defaultMessage: "Pin to menu",
                })
          }
          onClick={(e) => {
            e.stopPropagation();
            onTogglePinned();
          }}
        />
      </LinkBox>
    );
  },
);

interface CreateMenuButtonSectionProps extends Pick<AppLayoutNavBar_QueryFragment, "me"> {
  onToggle: (isOpen: boolean) => void;
  isMobile: boolean;
  isForceOpen: boolean;
}

function CreateMenuButtonSection({
  onToggle,
  isMobile,
  isForceOpen,
  me,
}: CreateMenuButtonSectionProps) {
  const navigate = useHandleNavigation();
  const emptyRef = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const showCreateProfileDialog = useCreateProfileDialog();
  async function handleCreateNewProfileFromProfileType(
    profileTypeId: string,
    profileTypeName: LocalizableUserText,
  ) {
    try {
      const { profile } = await showCreateProfileDialog({
        profileTypeId,
        profileTypeName,
        modalProps: { finalFocusRef: isForceOpen ? buttonRef : emptyRef },
      });

      navigate(`/app/profiles/${profile.id}/general`);
    } catch {}
  }

  const userCanCreateProfiles = useHasPermission("PROFILES:CREATE_PROFILES");
  const pinnedProfileTypes = me.pinnedProfileTypes.filter((pt) => pt.canCreate);

  if (!me.hasProfilesAccess || !userCanCreateProfiles || pinnedProfileTypes.length === 0) {
    return (
      <NakedLink href="/app/petitions/new">
        <Button
          as="a"
          colorScheme="purple"
          width="full"
          paddingInlineStart={3}
          paddingInlineEnd={3}
          overflow="hidden"
        >
          <HStack margin="0 auto" width="fit-content" minWidth={0}>
            <AddIcon boxSize={4} />
            <Text as="span" className="show-on-expand" minWidth={0}>
              <FormattedMessage id="generic.create-petition" defaultMessage="Create parallel" />
            </Text>
          </HStack>
        </Button>
      </NakedLink>
    );
  }

  return (
    <Flex>
      <Menu
        placement={isMobile ? "bottom" : "end-start"}
        onOpen={() => onToggle(true)}
        onClose={() => onToggle(false)}
      >
        <MenuButton
          as={Button}
          ref={buttonRef}
          colorScheme="purple"
          width="full"
          paddingInlineStart={3}
          paddingInlineEnd={3}
          overflow="hidden"
        >
          <HStack margin="0 auto" width="fit-content">
            <AddIcon boxSize={4} />
            <Text as="span" className="show-on-expand" minWidth={0}>
              <FormattedMessage
                id="component.app-layout-nav-bar.create-new-button"
                defaultMessage="Create new"
              />
            </Text>
          </HStack>
        </MenuButton>
        <Portal>
          <MenuList
            onFocus={(e) => {
              smoothScrollIntoView(e.target, {
                scrollMode: "if-needed",
                behavior: "smooth",
              });
            }}
            minWidth="auto"
            maxWidth="300px"
            maxHeight="400px"
            overflow="auto"
          >
            <NakedLink href="/app/petitions/new">
              <MenuItem as="a" icon={<PaperPlaneIcon boxSize={4} />}>
                {untranslated("Parallel")}
              </MenuItem>
            </NakedLink>
            {pinnedProfileTypes.map((profileType) => {
              const icon = getProfileTypeIcon(profileType.icon);
              return (
                <MenuItem
                  key={profileType.id}
                  icon={<Icon as={icon} boxSize={4} />}
                  onClick={() =>
                    handleCreateNewProfileFromProfileType(profileType.id, profileType.name)
                  }
                  paddingEnd={5}
                >
                  <ProfileTypeReference profileType={profileType} />
                </MenuItem>
              );
            })}
          </MenuList>
        </Portal>
      </Menu>
    </Flex>
  );
}

interface NotificationsSectionProps extends StackProps {
  onHelpCenterClick: () => void;
}

function NotificationsSection({ onHelpCenterClick, ...rest }: NotificationsSectionProps) {
  const intl = useIntl();
  return (
    <Stack {...rest}>
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
            data-canny-changelog
          >
            <FormattedMessage id="generic.product-news-label" defaultMessage="News" />
          </NavBarButton>
        </ListItem>
        <ListItem>
          <NavBarButton
            icon={<HelpOutlineIcon boxSize={5} />}
            as="a"
            target="_blank"
            rel="noopener"
            href={`https://help.onparallel.com/${intl.locale}`}
          >
            <FormattedMessage id="generic.help" defaultMessage="Help" />
          </NavBarButton>
        </ListItem>
      </List>
    </Stack>
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
