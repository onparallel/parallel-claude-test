/** @jsx jsx */
import { Box, Icon, Text, Tooltip } from "@chakra-ui/core";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { Link } from "../common/Link";
import { css, jsx } from "@emotion/core";

export interface AppLayoutNavbarLinkProps {
  href: string;
  active: boolean;
  icon: string;
  isAvailable: boolean;
  isMobile?: boolean;
  children: ReactNode;
}

export function AppLayoutNavbarLink({
  href,
  active,
  icon,
  isAvailable,
  isMobile,
  children,
}: AppLayoutNavbarLinkProps) {
  const intl = useIntl();
  const label = intl.formatMessage({
    id: "navbar.coming-soon",
    defaultMessage: "Coming soon",
  });
  return isAvailable ? (
    <Link
      href={href}
      borderX={!isMobile ? "4px solid" : undefined}
      borderY={isMobile ? "4px solid" : undefined}
      borderColor="transparent"
      display="block"
      userSelect="none"
      _focus={{
        boxShadow: "none",
        textDecoration: "underline",
      }}
      _hover={{
        color: "purple.700",
      }}
      _active={{
        textDecoration: "none",
      }}
      borderTopColor={isMobile && active ? "purple.600" : "transparent"}
      borderRightColor={!isMobile && active ? "purple.600" : "transparent"}
    >
      <AppLayoutNavbarLinkContent icon={icon} isMobile={isMobile}>
        {children}
      </AppLayoutNavbarLinkContent>
    </Link>
  ) : (
    <Tooltip label={label} aria-label={label} placement="right" showDelay={300}>
      <Box
        opacity={0.5}
        cursor="default"
        borderX={!isMobile ? "4px solid" : undefined}
        borderY={isMobile ? "4px solid" : undefined}
        borderColor="transparent"
      >
        <AppLayoutNavbarLinkContent icon={icon} isDisabled isMobile={isMobile}>
          {children}
        </AppLayoutNavbarLinkContent>
      </Box>
    </Tooltip>
  );
}

function AppLayoutNavbarLinkContent({
  icon,
  isDisabled,
  isMobile,
  children,
}: {
  icon: string;
  isDisabled?: boolean;
  isMobile?: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      textAlign="center"
      paddingY={isMobile ? 2 : 3}
      paddingX={isMobile ? 2 : undefined}
      css={
        isDisabled
          ? null
          : css`
              &:hover svg {
                transform: scale(1.2);
              }
            `
      }
    >
      <Box marginBottom={1}>
        <Icon
          aria-hidden="true"
          focusable={false}
          name={icon as any}
          size="24px"
          transition="transform 150ms ease"
        ></Icon>
      </Box>
      <Text as="div" textTransform="uppercase" fontSize="xs" fontWeight={600}>
        {children}
      </Text>
    </Box>
  );
}
