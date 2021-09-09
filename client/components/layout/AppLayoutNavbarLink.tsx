import { Box, Text, Tooltip, useBreakpointValue } from "@chakra-ui/react";
import { cloneElement, ReactElement, ReactNode } from "react";
import { useIntl } from "react-intl";
import { Link } from "../common/Link";

export interface AppLayoutNavbarLinkProps {
  href?: string;
  isActive?: boolean;
  icon: ReactElement;
  isAvailable?: boolean;
  children: ReactNode;
}

export function AppLayoutNavbarLink({
  href,
  isActive,
  icon,
  isAvailable,
  children,
}: AppLayoutNavbarLinkProps) {
  const intl = useIntl();
  const isMobile = useBreakpointValue({ base: true, sm: false });
  return isAvailable ? (
    <Link
      href={href!}
      position="relative"
      display="block"
      userSelect="none"
      aria-current={isActive ? "page" : undefined}
      _focus={{
        boxShadow: "none",
        textDecoration: "underline",
      }}
      sx={{
        color: "gray.600",
        _hover: { color: "gray.700" },
        _active: { color: "gray.800" },
        _activeLink: {
          color: "purple.600",
          _hover: { color: "purple.700" },
          _active: { color: "purple.800" },
          _after: {
            base: {
              display: "block",
              position: "absolute",
              content: "''",
              height: "4px",
              width: "100%",
              top: 0,
              left: 0,
              backgroundColor: "purple.600",
            },
            sm: {
              width: "4px",
              height: "100%",
              left: 0,
              top: 0,
            },
          },
        },
      }}
    >
      <AppLayoutNavbarLinkContent icon={icon}>{children}</AppLayoutNavbarLinkContent>
    </Link>
  ) : (
    <Tooltip
      label={intl.formatMessage({
        id: "navbar.coming-soon",
        defaultMessage: "Coming soon",
      })}
      placement={isMobile ? "top" : "right"}
    >
      <Box opacity={0.3} cursor="default" borderColor="transparent">
        <AppLayoutNavbarLinkContent icon={icon} isDisabled>
          {children}
        </AppLayoutNavbarLinkContent>
      </Box>
    </Tooltip>
  );
}

function AppLayoutNavbarLinkContent({
  icon,
  isDisabled,
  children,
}: {
  icon: ReactElement;
  isDisabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      textAlign="center"
      paddingX={{ base: 1.5, sm: 0 }}
      paddingY={{ base: 2, sm: 3 }}
      sx={
        isDisabled
          ? {}
          : {
              "&:hover svg": {
                transform: "scale(1.2)",
              },
            }
      }
    >
      <Box marginBottom={1}>
        {cloneElement(icon, {
          "aria-hidden": "true",
          boxSize: "24px",
          transition: "transform 150ms ease",
        })}
      </Box>
      <Text as="div" textTransform="uppercase" fontSize="xs" fontWeight="600">
        {children}
      </Text>
    </Box>
  );
}
