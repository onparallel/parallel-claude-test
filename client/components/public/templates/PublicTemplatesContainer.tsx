import {
  Button,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@parallel/chakra/icons";
import { NakedLink } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { CategoryType } from "./useCategories";

export function PublicTemplatesContainer({
  categories,
  children,
}: {
  categories: CategoryType[];
  children: ReactNode;
}) {
  const router = useRouter();
  const current = router.pathname.startsWith("/[locale]")
    ? router.asPath.replace(/^\/[^\/]+/, "")
    : router.asPath;

  const currentCategory = categories.find(
    (category) =>
      current.includes(category.href) && !current.includes(category.href + "/")
  );

  const displaySideMenu = useBreakpointValue({ base: false, md: true });

  return (
    <PublicContainer
      maxWidth="container.xl"
      wrapper={{
        backgroundColor: "gray.50",
        paddingX: 0,
        paddingStart: useBreakpointValue({ base: 6, md: 0 }),
        paddingEnd: 6,
        paddingTop: displaySideMenu ? 0 : 6,
      }}
    >
      <Grid
        gridTemplateColumns={{ base: "auto", md: "250px 1fr" }}
        gap={6}
        paddingBottom={displaySideMenu ? 0 : 20}
      >
        {displaySideMenu ? (
          <Stack
            borderRight="1px solid"
            borderColor="gray.200"
            paddingY={12}
            spacing={0}
          >
            {categories.map((category, index) => {
              const { label, href } = category;
              const isActive = currentCategory?.label === label;
              return (
                <NakedLink key={index} href={href}>
                  <Button
                    as="a"
                    paddingY={6}
                    paddingLeft={6}
                    justifyContent="space-between"
                    borderRadius="none"
                    fontWeight={isActive ? "bold" : "normal"}
                    isActive={isActive}
                    rightIcon={
                      isActive ? <ChevronRightIcon fontSize="2xl" /> : undefined
                    }
                    backgroundColor="transparent"
                    _hover={{
                      bgColor: "gray.100",
                    }}
                    _active={{
                      bgColor: "gray.200",
                    }}
                  >
                    <Text as="span">{label}</Text>
                  </Button>
                </NakedLink>
              );
            })}
          </Stack>
        ) : (
          <Menu placement="bottom" matchWidth={true}>
            {({ isOpen }) => (
              <>
                <MenuButton
                  as={Button}
                  variant="outline"
                  rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  width="100%"
                  justifyContent="space-between"
                  textAlign="start"
                  backgroundColor="white"
                >
                  {currentCategory?.label}
                </MenuButton>
                <Portal>
                  <MenuList>
                    {categories.map((category, index) => {
                      const { label, href } = category;
                      return (
                        <NakedLink key={index} href={href}>
                          <MenuItem
                            as="a"
                            aria-current={
                              currentCategory?.id === category.id
                                ? "page"
                                : undefined
                            }
                            _activeLink={{
                              fontWeight: "bold",
                              color: "purple.600",
                            }}
                          >
                            {label}
                          </MenuItem>
                        </NakedLink>
                      );
                    })}
                  </MenuList>
                </Portal>
              </>
            )}
          </Menu>
        )}
        <Stack
          paddingY={displaySideMenu ? 16 : 6}
          spacing={10}
          paddingBottom={displaySideMenu ? 28 : 6}
        >
          {children}
        </Stack>
      </Grid>
    </PublicContainer>
  );
}
