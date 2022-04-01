import { gql } from "@apollo/client";
import { Box, Center, Flex, List, ListItem, Stack, useBreakpointValue } from "@chakra-ui/react";
import {
  AddIcon,
  HelpOutlineIcon,
  PaperPlaneIcon,
  ReportsIcon,
  UsersIcon,
} from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { AppLayoutNavbar_QueryFragment } from "@parallel/graphql/__types";
import { useRouter } from "next/router";
import { memo, useMemo } from "react";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink, NormalLink } from "../common/Link";
import { Logo } from "../common/Logo";
import { Spacer } from "../common/Spacer";
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
      const items = useMemo(
        () => [
          {
            section: "petitions",
            href: "/app/petitions",
            icon: <PaperPlaneIcon />,
            isAvailable: true,
            isActive: pathname.startsWith("/app/petitions"),
            text: intl.formatMessage({
              id: "navbar.petitions-link",
              defaultMessage: "Petitions",
            }),
            warning: petitionLimitReached
              ? intl.formatMessage(
                  {
                    id: "navbar.petitions-link.limit-reached.warning",
                    defaultMessage:
                      "It seems that you have reached your limit of {limit} petitions, <a>reach out to us to upgrade your plan.</a>",
                  },
                  {
                    limit: me.organization.usageLimits.petitions.limit,
                    a: (chunks: any[]) => (
                      <NormalLink display="contents" href="mailto:support@onparallel.com">
                        {chunks}
                      </NormalLink>
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
              id: "navbar.contacts-link",
              defaultMessage: "Contacts",
            }),
          },
          {
            section: "reports",
            icon: <ReportsIcon />,
            isAvailable: false,
            text: intl.formatMessage({
              id: "navbar.reports-link",
              defaultMessage: "Reports",
            }),
          },
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
              <Box as="a" width="40px" height="40px" position="relative">
                <Box
                  position="absolute"
                  cursor="pointer"
                  transition="transform 150ms"
                  _hover={{
                    color: "gray.900",
                    transform: "scale(1.1)",
                  }}
                >
                  <Logo width="40px" hideText={true} color="gray.800" />
                </Box>
              </Box>
            </NakedLink>
          </Center>
          <Flex justifyContent="center" alignItems="center">
            <NakedLink href="/app/petitions/new">
              <IconButtonWithTooltip
                id="create-petition"
                as="a"
                colorScheme="purple"
                icon={<AddIcon />}
                size="lg"
                isRound
                label={intl.formatMessage({
                  id: "new-petition.title",
                  defaultMessage: "New petition",
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
              <ListItem key={section} id={`pw-section-${section}`}>
                <AppLayoutNavbarLink
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
            me {
              id
              organization {
                id
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
