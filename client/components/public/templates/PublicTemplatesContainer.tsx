import {
  Button,
  Grid,
  Menu,
  MenuButton,
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
import { MenuItemLink } from "@parallel/components/public/layout/PublicHeader";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { useCategories } from "./useCategories";

export function PublicTemplatesContainer({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const current = router.pathname.startsWith("/[locale]")
    ? router.asPath.replace(/^\/[^\/]+/, "")
    : router.asPath;

  const categories = useCategories();

  const currentCategory = Object.entries(categories).find(
    ([_, category]) =>
      current.includes(category.href) && !current.includes(category.href + "/")
  );

  const [_, category] = currentCategory ?? [];

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
            {Object.entries(categories).map(([key, value], index) => {
              const { label, href } = value;
              const isActive = category?.label === label;
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
                  {category?.label}
                </MenuButton>
                <Portal>
                  <MenuList>
                    {Object.entries(categories).map(
                      ([key, category], index) => {
                        const { label, href } = category;
                        return (
                          <MenuItemLink key={index} href={href}>
                            {label}
                          </MenuItemLink>
                        );
                      }
                    )}
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
