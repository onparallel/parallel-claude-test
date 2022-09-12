import { gql } from "@apollo/client";
import {
  Box,
  Center,
  Flex,
  Image,
  List,
  ListItem,
  Stack,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  AddIcon,
  HelpOutlineIcon,
  NewsIcon,
  PaperPlaneIcon,
  ReportsIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AppLayoutNavbar_QueryFragment } from "@parallel/graphql/__types";
import { isAtLeast } from "@parallel/utils/roles";
import { useRouter } from "next/router";
import { memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { Logo } from "../common/Logo";
import { Spacer } from "../common/Spacer";
import { SupportLink } from "../common/SupportLink";
import { NotificationsButton } from "../notifications/NotificationsButton";
import { AppLayoutNavbarLink } from "./AppLayoutNavbarLink";
import { UserMenu } from "./UserMenu";

export interface AppLayoutNavbarProps extends AppLayoutNavbar_QueryFragment {
  onHelpCenterClick: () => void;
}

export const AppLayoutNavbar = Object.assign(
  memo(
    chakraForwardRef<"nav", AppLayoutNavbarProps>(function AppLayoutNavbar(
      { me, realMe, onHelpCenterClick, ...props },
      ref
    ) {
      const intl = useIntl();
      const router = useRouter();
      const { pathname, query } = router;
      const petitionLimitReached =
        me.organization.usageLimits.petitions.used >= me.organization.usageLimits.petitions.limit;

      const hasAdminRole = isAtLeast("ADMIN", me.role);
      const items = useMemo(
        () => [
          {
            section: "petitions",
            href: "/app/petitions",
            icon: <PaperPlaneIcon />,
            isAvailable: true,
            isActive: pathname.startsWith("/app/petitions"),
            text: intl.formatMessage({
              id: "component.app-layout-navbar.parallels-link",
              defaultMessage: "Parallels",
            }),
            warning: petitionLimitReached
              ? intl.formatMessage(
                  {
                    id: "component.app-layout-navbar.parallels-link.limit-reached-warning",
                    defaultMessage:
                      "It seems that you have reached your limit of {limit} parallels, <a>reach out to us to upgrade your plan.</a>",
                  },
                  {
                    limit: me.organization.usageLimits.petitions.limit,
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
                  }
                )
              : undefined,
          },
          {
            section: "contacts",
            href: "/app/contacts",
            icon: <UsersIcon />,
            isActive: pathname.startsWith("/app/contacts"),
            isAvailable: true,
            text: intl.formatMessage({
              id: "component.app-layout-navbar.contacts-link",
              defaultMessage: "Contacts",
            }),
          },
          ...(hasAdminRole
            ? [
                {
                  section: "reports",
                  icon: <ReportsIcon />,
                  href: "/app/reports",
                  isActive: pathname.startsWith("/app/reports"),
                  isAvailable: true,
                  text: intl.formatMessage({
                    id: "component.app-layout-navbar.reports-link",
                    defaultMessage: "Reports",
                  }),
                },
              ]
            : []),
        ],
        [intl.locale, pathname, query]
      );
      const isMobile = useBreakpointValue({ base: true, sm: false });

      return (
        <Flex
          ref={ref as any}
          alignItems="stretch"
          as="nav"
          backgroundColor="white"
          flexDirection={{ base: "row", sm: "column" }}
          paddingX={{ base: 2, sm: 0 }}
          paddingY={{ base: 0, sm: 4 }}
          width={{ base: "auto", sm: 24 }}
          height={{ base: 16, sm: "auto" }}
          {...props}
        >
          <Center display={{ base: "none", sm: "flex" }} marginBottom={6} marginTop={2}>
            <NakedLink href="/app">
              <Box as="a" width="46px" height="46px" position="relative">
                <Tooltip
                  label={intl.formatMessage({
                    id: "component.app-layout-navbar.switch-organization",
                    defaultMessage: "Switch organization",
                  })}
                  placement="right"
                  isDisabled={realMe.organizations.length === 1}
                >
                  <Box
                    position="absolute"
                    cursor="pointer"
                    transition="transform 150ms"
                    width="46px"
                    height="46px"
                    borderRadius="full"
                    _hover={{
                      color: "gray.900",
                      shadow: "lg",
                      transform: "scale(1.1)",
                    }}
                    overflow="hidden"
                  >
                    {me.organization.iconUrl92 ? (
                      <Image
                        boxSize="46px"
                        objectFit="contain"
                        alt={me.organization.name}
                        src={me.organization.iconUrl92}
                      />
                    ) : (
                      <Logo width="46px" hideText={true} color="gray.800" padding={1.5} />
                    )}
                  </Box>
                </Tooltip>
              </Box>
            </NakedLink>
          </Center>
          <Flex justifyContent="center" alignItems="center">
            <NakedLink href={`/app/petitions/new`}>
              <IconButtonWithTooltip
                data-link="create-petition"
                as="a"
                colorScheme="primary"
                icon={<AddIcon />}
                size="lg"
                isRound
                label={intl.formatMessage({
                  id: "generic.new-petition",
                  defaultMessage: "New parallel",
                })}
                placement={isMobile ? "top" : "right"}
              />
            </NakedLink>
          </Flex>
          <Flex
            as={List}
            alignSelf="stretch"
            flexDirection={{ base: "row", sm: "column" }}
            flex={{ base: 1, sm: "none" }}
            justifyContent="center"
            marginX={{ base: 2, sm: 0 }}
            marginY={{ base: 0, sm: 2 }}
          >
            {items.map(({ section, href, isActive, isAvailable, icon, text, warning }) => (
              <ListItem key={section}>
                <AppLayoutNavbarLink
                  section={section}
                  href={href}
                  isAvailable={isAvailable}
                  isActive={isActive}
                  icon={icon}
                  warningPopover={warning}
                >
                  {text}
                </AppLayoutNavbarLink>
              </ListItem>
            ))}
          </Flex>
          <Spacer display={{ base: "none", sm: "block" }} />
          <Stack spacing={2} alignItems="center" display={{ base: "none", sm: "flex" }}>
            <NotificationsButton />
            <IconButtonWithTooltip
              sx={{
                ".Canny_BadgeContainer .Canny_Badge": {
                  backgroundColor: "primary.500",
                  border: "2px solid white",
                  top: "5px",
                  right: "6px",
                },
              }}
              label={intl.formatMessage({
                id: "navbar.new-in-parallel",
                defaultMessage: "New in Parallel",
              })}
              placement="right"
              size="md"
              variant="ghost"
              backgroundColor="white"
              isRound
              onClick={onHelpCenterClick}
              icon={<NewsIcon fontSize="22px" />}
              data-canny-changelog
            />
            <IconButtonWithTooltip
              label={intl.formatMessage({
                id: "navbar.help-center",
                defaultMessage: "Help center",
              })}
              as="a"
              href={`https://help.onparallel.com/${intl.locale}`}
              rel="noopener"
              target="_blank"
              placement="right"
              size="md"
              variant="ghost"
              backgroundColor="white"
              isRound
              onClick={onHelpCenterClick}
              icon={<HelpOutlineIcon fontSize="22px" />}
            />
          </Stack>
          <Center marginTop={{ base: 0, sm: 4 }}>
            <UserMenu
              placement={isMobile ? "top-end" : "right-end"}
              me={me}
              realMe={realMe}
              onHelpCenterClick={onHelpCenterClick}
            />
          </Center>
        </Flex>
      );
    })
  ),
  {
    fragments: {
      get Query() {
        return gql`
          fragment AppLayoutNavbar_Query on Query {
            ...UserMenu_Query
            realMe {
              id
              organizations {
                id
              }
            }
            me {
              id
              role
              organization {
                id
                name
                iconUrl92: iconUrl(options: { resize: { width: 92 } })
                usageLimits {
                  petitions {
                    limit
                    used
                  }
                }
              }
            }
          }
          ${UserMenu.fragments.Query}
        `;
      },
    },
  }
);
