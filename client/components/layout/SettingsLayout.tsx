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
  showBackButton?: boolean;
  header?: ReactNode;
  children?: ReactNode;
};

export function SettingsLayout({
  basePath,
  title,
  user,
  sections,
  sectionsHeader,
  isBase,
  showBackButton,
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
          router.replace(sections[0].path);
        }
      },
      [sections]
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
            <SettingsLayoutMenuItem key={index} path={section.path}>
              {section.title}
            </SettingsLayoutMenuItem>
          ))}
        </Box>
        <Flex
          display={{
            base: isBase ? "none" : "flex",
            md: "flex",
          }}
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
                    display={{
                      base: "flex",
                      md: showBackButton ? "flex" : "none",
                    }}
                  />
                </NakedLink>
                {header}
              </Flex>
              <Flex flex="1" minHeight={0} overflow="auto" backgroundColor="gray.50">
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
}

function SettingsLayoutMenuItem({ path, children }: SettingsLayoutMenuItemProps) {
  const { pathname } = useRouter();

  const active = pathname.startsWith(path);

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
