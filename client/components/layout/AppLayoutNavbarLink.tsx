import { Box, Text, Tooltip } from "@chakra-ui/react";
import { cloneElement, ReactElement, ReactNode } from "react";
import { useIntl } from "react-intl";
import { Link } from "../common/Link";

export interface AppLayoutNavbarLinkProps {
  href?: string;
  isActive?: boolean;
  icon: ReactElement;
  isAvailable?: boolean;
  isMobile?: boolean;
  children: ReactNode;
}

export function AppLayoutNavbarLink({
  href,
  isActive,
  icon,
  isAvailable,
  isMobile,
  children,
}: AppLayoutNavbarLinkProps) {
  const intl = useIntl();
  return isAvailable ? (
    <Link
      href={href!}
      position="relative"
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
      _after={
        isActive
          ? {
              display: "block",
              position: "absolute",
              content: "''",
              ...(isMobile
                ? { height: "4px", width: "100%", top: 0, left: 0 }
                : { width: "4px", height: "100%", right: 0, top: 0 }),
              backgroundColor: "purple.600",
            }
          : {}
      }
      {...(isActive ? { "aria-current": "page" } : {})}
    >
      <AppLayoutNavbarLinkContent icon={icon} isMobile={isMobile}>
        {children}
      </AppLayoutNavbarLinkContent>
    </Link>
  ) : (
    <Tooltip
      label={intl.formatMessage({
        id: "navbar.coming-soon",
        defaultMessage: "Coming soon",
      })}
      placement="right"
    >
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
  icon: ReactElement;
  isDisabled?: boolean;
  isMobile?: boolean;
  children: ReactNode;
}) {
  return (
    <Box
      textAlign="center"
      paddingY={isMobile ? 2 : 3}
      paddingX={isMobile ? "6px" : undefined}
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
