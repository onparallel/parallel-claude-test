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
      borderX="4px solid"
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
      borderRightColor={active ? "purple.600" : "transparent"}
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
