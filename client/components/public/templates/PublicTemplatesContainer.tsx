import {
  Box,
  Button,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon } from "@parallel/chakra/icons";
import { NakedLink } from "@parallel/components/common/Link";
import { PublicContainer } from "@parallel/components/public/layout/PublicContainer";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { PublicTemplateCategory } from "../../../utils/usePublicTemplateCategories";

export function PublicTemplatesContainer({
  categories,
  children,
}: {
  categories: PublicTemplateCategory[];
  children: ReactNode;
}) {
  const router = useRouter();

  const currentCategory = categories.find((c) => c.slug === router.query.category);

  return (
    <PublicContainer
      maxWidth="container.xl"
      wrapper={{
        backgroundColor: "gray.50",
        paddingX: 0,
        paddingStart: { base: 6, md: 0 },
        paddingEnd: 6,
        paddingTop: { base: 6, md: 0 },
      }}
    >
      <Grid
        gridTemplateColumns={{ base: "auto", md: "250px 1fr" }}
        gap={6}
        paddingBottom={{ base: 20, md: 0 }}
      >
        <Stack
          display={{ base: "none", md: "flex" }}
          borderRight="1px solid"
          borderColor="gray.200"
          paddingY={12}
          spacing={0}
        >
          <NakedLink href={`/templates`}>
            <Button
              as="a"
              paddingY={6}
              paddingLeft={6}
              justifyContent="space-between"
              borderRadius="none"
              fontWeight="bold"
              rightIcon={
                currentCategory === undefined ? <ChevronRightIcon fontSize="2xl" /> : undefined
              }
              backgroundColor="transparent"
              _hover={{
                bgColor: "gray.100",
              }}
              aria-current={currentCategory === undefined ? "page" : undefined}
              _activeLink={{
                bgColor: "gray.200",
                fontWeight: "bold",
              }}
              _focus={{
                boxShadow: "none",
              }}
            >
              <FormattedMessage
                id="public-templates.categories.all-categories"
                defaultMessage="All categories"
              />
            </Button>
          </NakedLink>
          {categories.map((c) => {
            const isActive = currentCategory?.slug === c.slug;
            return (
              <NakedLink key={c.slug} href={`/templates/categories/${c.slug}`}>
                <Button
                  as="a"
                  paddingY={6}
                  paddingLeft={6}
                  justifyContent="space-between"
                  borderRadius="none"
                  fontWeight="normal"
                  aria-current={currentCategory?.slug === c.slug ? "page" : undefined}
                  _activeLink={{
                    bgColor: "gray.200",
                    fontWeight: "bold",
                  }}
                  rightIcon={isActive ? <ChevronRightIcon fontSize="2xl" /> : undefined}
                  backgroundColor="transparent"
                  _hover={{
                    bgColor: "gray.100",
                  }}
                  _focus={{
                    boxShadow: "none",
                  }}
                >
                  {c.label}
                </Button>
              </NakedLink>
            );
          })}
        </Stack>

        <Box display={{ base: "block", md: "none" }}>
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
                  {currentCategory ? (
                    currentCategory.label
                  ) : (
                    <FormattedMessage
                      id="public-templates.categories.all-categories"
                      defaultMessage="All categories"
                    />
                  )}
                </MenuButton>
                <Portal>
                  <MenuList>
                    <NakedLink href="/templates">
                      <MenuItem
                        as="a"
                        aria-current={currentCategory === undefined ? "page" : undefined}
                        _activeLink={{
                          fontWeight: "bold",
                          color: "purple.600",
                        }}
                      >
                        <FormattedMessage
                          id="public-templates.categories.all-categories"
                          defaultMessage="All categories"
                        />
                      </MenuItem>
                    </NakedLink>
                    {categories.map((c) => {
                      return (
                        <NakedLink key={c.slug} href={`/templates/categories/${c.slug}`}>
                          <MenuItem
                            as="a"
                            aria-current={currentCategory?.slug === c.slug ? "page" : undefined}
                            _activeLink={{
                              fontWeight: "bold",
                              color: "purple.600",
                            }}
                          >
                            {c.label}
                          </MenuItem>
                        </NakedLink>
                      );
                    })}
                  </MenuList>
                </Portal>
              </>
            )}
          </Menu>
        </Box>
        <Stack paddingY={{ base: 6, md: 16 }} spacing={10} paddingBottom={{ base: 6, md: 28 }}>
          {children}
        </Stack>
      </Grid>
    </PublicContainer>
  );
}
