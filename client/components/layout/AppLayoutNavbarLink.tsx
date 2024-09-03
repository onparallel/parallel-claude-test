import { Box, Text, useBreakpointValue } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { AlertCircleFilledIcon } from "@parallel/chakra/icons";
import { cloneElement, ReactElement, ReactNode } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { NakedLink } from "../common/Link";
import { SmallPopover } from "../common/SmallPopover";

export interface AppLayoutNavbarLinkProps {
  section: string;
  href?: string;
  isActive?: boolean;
  icon: ReactElement;
  isAvailable?: boolean;
  children: ReactNode;
  warningPopover?: ReactNode;
  onClick?: () => void;
}

export function AppLayoutNavbarLink({
  section,
  href,
  isActive,
  icon,
  isAvailable,
  children,
  warningPopover,
  onClick,
}: AppLayoutNavbarLinkProps) {
  const intl = useIntl();
  const isMobile = useBreakpointValue({ base: true, sm: false });

  const navbarBox = (
    <Box
      as={isNonNullish(onClick) ? "button" : "a"}
      cursor="pointer"
      data-link={`navbar-${section}`}
      position="relative"
      display="block"
      width="100%"
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
          color: "primary.600",
          _hover: { color: "primary.700" },
          _active: { color: "primary.800" },
          _after: {
            base: {
              display: "block",
              position: "absolute",
              content: "''",
              height: "4px",
              width: "100%",
              top: 0,
              insetStart: 0,
              backgroundColor: "primary.600",
            },
            sm: {
              width: "4px",
              height: "100%",
              insetStart: 0,
              top: 0,
            },
          },
        },
      }}
      onClick={onClick}
    >
      <AppLayoutNavbarLinkContent icon={icon} warningPopover={warningPopover}>
        {children}
      </AppLayoutNavbarLinkContent>
    </Box>
  );

  return isAvailable ? (
    <NakedLink href={href!}>{navbarBox}</NakedLink>
  ) : isNonNullish(onClick) ? (
    navbarBox
  ) : (
    <Tooltip
      label={intl.formatMessage({
        id: "generic.coming-soon",
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
  warningPopover,
}: {
  icon: ReactElement;
  isDisabled?: boolean;
  children: ReactNode;
  warningPopover?: ReactNode;
}) {
  return (
    <Box
      textAlign="center"
      paddingX={{ base: 2.5, sm: 0 }}
      paddingY={{ base: 4, sm: 3 }}
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
          boxSize: { base: "28px", sm: "24px" },
          transition: "transform 150ms ease",
        })}
        {warningPopover ? (
          <SmallPopover content={warningPopover} placement="right">
            <AlertCircleFilledIcon
              position="absolute"
              color="yellow.500"
              insetEnd={4}
              top={2}
              transition="transform 150ms ease"
            />
          </SmallPopover>
        ) : null}
      </Box>
      <Text
        as="div"
        textTransform="uppercase"
        fontSize="xs"
        fontWeight="600"
        display={{ base: "none", sm: "block" }}
      >
        {children}
      </Text>
    </Box>
  );
}
