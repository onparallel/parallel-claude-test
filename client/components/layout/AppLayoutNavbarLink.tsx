import { Box, Icon, Text, Tooltip } from "@chakra-ui/core";
import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { Link } from "../common/Link";

export interface AppLayoutNavbarLinkProps {
  href: string;
  active: boolean;
  icon: string;
  available: boolean;
  children: ReactNode;
}

export function AppLayoutNavbarLink({
  href,
  active,
  icon,
  available,
  children,
}: AppLayoutNavbarLinkProps) {
  const intl = useIntl();
  const label = intl.formatMessage({
    id: "navbar.coming-soon",
    defaultMessage: "Coming soon",
  });
  return available ? (
    <Link
      href={href}
      chakra={{
        display: "block",
        userSelect: "none",
        _focus: {
          boxShadow: "none",
          textDecoration: "underline",
        },
        ...(active
          ? {
              backgroundColor: "purple.500",
              color: "white",
              _active: {
                backgroundColor: "purple.600",
                color: "white",
              },
              _hover: {
                backgroundColor: "purple.600",
                color: "white",
              },
            }
          : {
              backgroundColor: "white",
              color: "purple.600",
              _active: {
                backgroundColor: "purple.50",
                color: "purple.700",
              },
              _hover: {
                backgroundColor: "purple.50",
                color: "purple.700",
              },
            }),
      }}
    >
      <Content icon={icon}>{children}</Content>
    </Link>
  ) : (
    <Tooltip label={label} aria-label={label} placement="right" showDelay={300}>
      <Box opacity={0.5} cursor="default">
        <Content icon={icon}>{children}</Content>
      </Box>
    </Tooltip>
  );
}

function Content({
  icon,
  children,
}: Pick<AppLayoutNavbarLinkProps, "icon" | "children">) {
  return (
    <Box textAlign="center" paddingY={3}>
      <Box marginBottom={2}>
        <Icon
          aria-hidden="true"
          focusable={false}
          name={icon as any}
          size="24px"
        ></Icon>
      </Box>
      <Text as="div" textTransform="uppercase" fontSize="xs" fontWeight={600}>
        {children}
      </Text>
    </Box>
  );
}
