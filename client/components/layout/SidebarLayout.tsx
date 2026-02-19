import { gql } from "@apollo/client";
import { Heading, IconButton } from "@chakra-ui/react";
import { ArrowBackIcon, ChevronRightIcon } from "@parallel/chakra/icons";
import { SidebarLayout_QueryFragment } from "@parallel/graphql/__types";
import { useOnMediaQueryChange } from "@parallel/utils/useOnMediaQueryChange";
import { useRouter } from "next/router";
import { ReactNode, useCallback } from "react";
import { useIntl } from "react-intl";
import NextLink from "next/link";
import { AppLayout } from "./AppLayout";
import { Box, Flex, Text } from "@parallel/components/ui";

export interface SidebarLayoutProps {
  queryObject: SidebarLayout_QueryFragment;
  basePath: string;
  title: string;
  sections: { title: string; path: string }[];
  sectionsHeader: ReactNode;
  isBase?: boolean;
  showBackButton?: boolean;
  header?: ReactNode;
  subHeader?: ReactNode;
  children?: ReactNode;
}

export function SidebarLayout({
  basePath,
  title,
  queryObject,
  sections,
  sectionsHeader,
  isBase,
  showBackButton,
  header,
  subHeader,
  children,
}: SidebarLayoutProps) {
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
      [sections],
    ),
  );

  return (
    <AppLayout title={title} queryObject={queryObject}>
      <Flex flex="1" maxHeight="100vh">
        <Flex
          direction="column"
          backgroundColor="white"
          borderEnd="1px solid"
          borderEndColor="gray.200"
          flex="1"
          minHeight={0}
          maxWidth={{ base: "auto", md: 64 }}
          display={{ base: isBase ? "flex" : "none", md: "flex" }}
        >
          <Flex
            alignItems="center"
            paddingX={4}
            height={16}
            borderBottom="1px solid"
            borderBottomColor="gray.200"
          >
            <Heading as="h2" size="md">
              {sectionsHeader}
            </Heading>
          </Flex>
          <Flex direction="column" flex={1} overflow="auto" minHeight={0}>
            {sections.map((section, index) => (
              <SidebarLayoutMenuItem key={index} path={section.path}>
                {section.title}
              </SidebarLayoutMenuItem>
            ))}
          </Flex>
        </Flex>
        {isBase ? null : (
          <Flex
            display={{
              base: isBase ? "none" : "flex",
              md: "flex",
            }}
            direction="column"
            flex="1"
            minWidth={0}
            backgroundColor="white"
          >
            <Flex
              flexDirection="row"
              alignItems="center"
              height={16}
              paddingX={4}
              borderBottom="1px solid"
              borderBottomColor="gray.200"
            >
              <IconButton
                as={NextLink}
                href={basePath}
                icon={<ArrowBackIcon />}
                variant="ghost"
                aria-label={intl.formatMessage({
                  id: "generic.go-back",
                  defaultMessage: "Go back",
                })}
                marginEnd={2}
                display={{
                  base: "flex",
                  md: showBackButton ? "flex" : "none",
                }}
              />
              {header}
            </Flex>
            {subHeader ? <Box>{subHeader}</Box> : null}
            <Flex
              direction="column"
              flex="1"
              minHeight={0}
              overflow="auto"
              backgroundColor="gray.50"
              position="relative"
            >
              {children}
            </Flex>
          </Flex>
        )}
      </Flex>
    </AppLayout>
  );
}

const _fragments = {
  Query: gql`
    fragment SidebarLayout_Query on Query {
      ...AppLayout_Query
    }
  `,
};

interface SidebarLayoutMenuItemProps {
  path: string;
  children: ReactNode;
}

function SidebarLayoutMenuItem({ path, children }: SidebarLayoutMenuItemProps) {
  const { pathname } = useRouter();

  const active = pathname.startsWith(path);

  return (
    <Box
      as={NextLink}
      href={path}
      display="flex"
      borderBottom="1px solid"
      borderBottomColor="gray.200"
      borderEnd="4px solid"
      borderEndColor="transparent"
      backgroundColor="white"
      alignItems="center"
      aria-current={active ? "page" : undefined}
      _activeLink={{
        backgroundColor: "gray.75",
        borderEndColor: "primary.500",
      }}
      _hover={{
        backgroundColor: "gray.50",
        _activeLink: {
          backgroundColor: "gray.75",
        },
      }}
    >
      <Box flex="1" padding={3}>
        <Text fontSize="md">{children}</Text>
      </Box>
      <ChevronRightIcon boxSize="6" marginEnd={2} />
    </Box>
  );
}
