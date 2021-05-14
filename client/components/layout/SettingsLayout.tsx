import { gql } from "@apollo/client";
import { Box, Flex, Heading, IconButton, Text } from "@chakra-ui/react";
import { ArrowBackIcon, ChevronRightIcon } from "@parallel/chakra/icons";
import { SettingsLayout_UserFragment } from "@parallel/graphql/__types";
import { useOnMediaQueryChange } from "@parallel/utils/useOnMediaQueryChange";
import { useRouter } from "next/router";
import { ReactNode, useCallback } from "react";
import { useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { AppLayout } from "./AppLayout";

export type SettingsLayoutProps = {
  basePath: string;
  title: string;
  user: SettingsLayout_UserFragment;
  sections: { title: string; path: string }[];
  sectionsHeader: ReactNode;
  isBase?: boolean;
  includesPath?: boolean;
  header?: ReactNode;
  children?: ReactNode;
};

export function SettingsLayout({
  basePath,
  isBase,
  includesPath,
  title,
  user,
  sections,
  sectionsHeader,
  header,
  children,
}: SettingsLayoutProps) {
  const intl = useIntl();
  const router = useRouter();
  useOnMediaQueryChange(
    "md",
    useCallback(
      (matches) => {
        if (isBase && matches) {
          const defaultPath = sections[0].path;
          router.replace(`/${router.query.locale}${defaultPath}`);
        }
      },
      [sections, router.query.locale]
    )
  );
  return (
    <AppLayout title={title} user={user}>
      <Flex flex="1" maxHeight="100vh">
        <Box
          backgroundColor="white"
          borderRight="1px solid"
          borderRightColor="gray.100"
          flex="1"
          maxWidth={{ base: "auto", md: 64 }}
          display={{ base: isBase ? "block" : "none", md: "block" }}
        >
          <Flex
            alignItems="center"
            paddingX={4}
            height={16}
            borderBottom="1px solid"
            borderBottomColor="gray.100"
          >
            <Heading as="h2" size="md">
              {sectionsHeader}
            </Heading>
          </Flex>
          {sections.map((section, index) => (
            <SettingsLayoutMenuItem
              key={index}
              path={section.path}
              includesPath={includesPath ?? false}
            >
              {section.title}
            </SettingsLayoutMenuItem>
          ))}
        </Box>
        <Flex
          display={{ base: isBase ? "none" : "flex", md: "flex" }}
          direction="column"
          flex="1"
          backgroundColor="white"
        >
          {isBase ? null : (
            <>
              <Flex
                flexDirection="row"
                alignItems="center"
                height={16}
                paddingX={4}
                borderBottom="1px solid"
                borderBottomColor="gray.100"
              >
                <NakedLink href={basePath}>
                  <IconButton
                    as="a"
                    icon={<ArrowBackIcon />}
                    variant="ghost"
                    aria-label={intl.formatMessage({
                      id: "generic.go-back",
                      defaultMessage: "Go back",
                    })}
                    marginRight={2}
                    display={{ base: "flex", md: "none" }}
                  />
                </NakedLink>
                {header}
              </Flex>
              <Flex flex="1" minHeight={0} overflow="auto">
                {children}
              </Flex>
            </>
          )}
        </Flex>
      </Flex>
    </AppLayout>
  );
}

SettingsLayout.fragments = {
  User: gql`
    fragment SettingsLayout_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.User}
  `,
};

interface SettingsLayoutMenuItemProps {
  path: string;
  children: ReactNode;
  includesPath: boolean;
}

function SettingsLayoutMenuItem({
  path,
  children,
  includesPath,
}: SettingsLayoutMenuItemProps) {
  const { pathname } = useRouter();

  const active = includesPath
    ? pathname.includes(`/[locale]${path}`)
    : pathname === `/[locale]${path}`;

  return (
    <NakedLink href={path}>
      <Box
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
          <ChevronRightIcon boxSize="6" marginRight={2} />
        </Flex>
      </Box>
    </NakedLink>
  );
}
