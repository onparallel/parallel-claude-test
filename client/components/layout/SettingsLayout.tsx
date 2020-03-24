import { Box, Flex, Heading, Icon, Text, PseudoBox } from "@chakra-ui/core";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { useRouter } from "next/router";
import { NakedLink } from "../common/Link";

export interface SettingsLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export function SettingsLayout({ header, children }: SettingsLayoutProps) {
  return (
    <Flex flex="1">
      <Box
        backgroundColor="white"
        borderRight="1px solid"
        borderRightColor="gray.100"
        width={64}
      >
        <Box padding={4} borderBottom="1px solid" borderBottomColor="gray.100">
          <Heading as="h2" size="md">
            <FormattedMessage id="settings.header" defaultMessage="Settings" />
          </Heading>
        </Box>
        <SettingsLayoutMenuItem section="account">
          <FormattedMessage id="settings.account" defaultMessage="Account" />
        </SettingsLayoutMenuItem>
        <SettingsLayoutMenuItem section="security">
          <FormattedMessage id="settings.security" defaultMessage="Security" />
        </SettingsLayoutMenuItem>
      </Box>
      <Box flex="1" backgroundColor="white">
        <Box padding={4} borderBottom="1px solid" borderBottomColor="gray.100">
          <Heading as="h3" size="md">
            {header}
          </Heading>
        </Box>
        {children}
      </Box>
    </Flex>
  );
}

interface SettingsLayoutMenuItemProps {
  section: string;
  children: ReactNode;
}

function SettingsLayoutMenuItem({
  section,
  children,
}: SettingsLayoutMenuItemProps) {
  const { pathname } = useRouter();
  const active = pathname === `/[locale]/app/settings/${section}`;
  return (
    <NakedLink href={`/app/settings/${section}`}>
      <PseudoBox
        as="a"
        display="block"
        borderBottom="1px solid"
        borderBottomColor="gray.100"
        backgroundColor={active ? "gray.50" : "white"}
        _hover={{
          backgroundColor: "gray.50",
        }}
      >
        <Flex
          borderRight="4px solid"
          alignItems="center"
          borderRightColor={active ? "purple.500" : "transparent"}
        >
          <Box flex="1" padding={3}>
            <Text fontSize="md">{children}</Text>
          </Box>
          <Icon name="chevron-right" size="6" marginRight={2} />
        </Flex>
      </PseudoBox>
    </NakedLink>
  );
}
