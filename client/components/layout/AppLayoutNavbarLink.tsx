import { Box, Icon, LinkProps, Text, useColorMode } from "@chakra-ui/core";
import { Link } from "../common/Link";
import { ReactNode } from "react";

export interface AppLayoutNavbarLinkProps {
  href: string;
  active: boolean;
  icon: string;
  children: ReactNode;
}

export function AppLayoutNavbarLink({
  href,
  active,
  icon,
  children
}: AppLayoutNavbarLinkProps) {
  const { colorMode } = useColorMode();

  return (
    <Link
      href={href}
      chakra={{
        display: "block",
        userSelect: "none",
        _focus: {
          boxShadow: "none",
          textDecoration: "underline"
        },
        ...{
          light: {
            _active: {
              backgroundColor: "purple.50",
              color: "purple.700"
            },
            _hover: {
              backgroundColor: "purple.50",
              color: "purple.700"
            }
          },
          dark: {
            _active: {
              backgroundColor: "purple.900",
              color: "purple.50"
            },
            _hover: {
              backgroundColor: "purple.900",
              color: "purple.50"
            }
          }
        }[colorMode],
        ...(active
          ? {
              light: {
                backgroundColor: "purple.500",
                color: "white",
                _active: {
                  backgroundColor: "purple.600",
                  color: "white"
                },
                _hover: {
                  backgroundColor: "purple.600",
                  color: "white"
                }
              },
              dark: {
                backgroundColor: "purple.200",
                color: "gray.700",
                _active: {
                  backgroundColor: "purple.300",
                  color: "gray.800"
                },
                _hover: {
                  backgroundColor: "purple.300",
                  color: "gray.800"
                }
              }
            }[colorMode]
          : {})
      }}
    >
      <Box textAlign="center" paddingY={3}>
        <Box marginBottom={2}>
          <Icon
            aria-hidden="true"
            focusable={false}
            name={icon as any}
            size="20px"
          ></Icon>
        </Box>
        <Text as="div" textTransform="uppercase" fontSize="xs" fontWeight={600}>
          {children}
        </Text>
      </Box>
    </Link>
  );
}
