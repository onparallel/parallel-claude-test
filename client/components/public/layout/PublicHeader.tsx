import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  StackProps,
  useDisclosure,
} from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { BurgerButton } from "@parallel/components/common/BurgerButton";
import { NakedLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { Spacer } from "@parallel/components/common/Spacer";
import { FormattedMessage } from "react-intl";
import { PublicContainer } from "./PublicContainer";

export type PublicHeaderProps = ExtendChakra<{
  isThin?: boolean;
}>;

export function PublicHeader({ isThin, ...props }: PublicHeaderProps) {
  const { isOpen, onToggle } = useDisclosure();
  const breakpoint = "lg" as const;

  return (
    <PublicContainer
      wrapper={{
        as: "header",
        backgroundColor: "white",
        boxShadow: isThin || isOpen ? "md" : "none",
        ...props,
      }}
    >
      <Flex
        direction={{ base: "column", lg: "row" }}
        alignItems={{ base: "stretch", lg: "center" }}
      >
        <Flex
          alignSelf="stretch"
          alignItems="center"
          flex="1"
          minHeight={{ base: 16, lg: isThin ? 16 : 20 }}
          transition="min-height 300ms"
        >
          <NakedLink href="/">
            <Box
              as="a"
              color="gray.700"
              _hover={{ color: "gray.800" }}
              _focus={{ color: "gray.800" }}
              _active={{ color: "gray.900" }}
            >
              <Logo width="152px" />
            </Box>
          </NakedLink>
          <Spacer />
          <BurgerButton
            isOpen={isOpen}
            display={{ base: "block", [breakpoint]: "none" }}
            onClick={onToggle}
          />
        </Flex>
        <Box
          height={{ base: isOpen ? "auto" : 0, lg: "auto" }}
          opacity={{ base: isOpen ? 1 : 0, lg: 1 }}
          overflow="hidden"
          transition="opacity 500ms"
          paddingBottom={{ base: isOpen ? 4 : 0, lg: 0 }}
        >
          <PublicHeaderMenu
            direction={{ base: "column", lg: "row" }}
            spacing={{ base: 2, lg: 4 }}
            alignItems={{ base: "stretch", lg: "center" }}
          />
        </Box>
      </Flex>
    </PublicContainer>
  );
}

function PublicHeaderMenu(props: StackProps) {
  return (
    <Stack {...props}>
      <NakedLink href="/security">
        <Button as="a" variant="ghost">
          <FormattedMessage
            id="public.security-link"
            defaultMessage="Security"
          />
        </Button>
      </NakedLink>
      <Menu placement="bottom">
        <MenuButton as={Button} variant="ghost">
          <FormattedMessage
            id="public.persons-link"
            defaultMessage="For whom"
          />
        </MenuButton>
        <Portal>
          <MenuList>
            <NakedLink href="/for-whom/people">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.for-whom.freelance"
                  defaultMessage="Freelancers"
                />
              </MenuItem>
            </NakedLink>
            <NakedLink href="/for-whom/legal-industry">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.for-whom.legal"
                  defaultMessage="Legal"
                />
              </MenuItem>
            </NakedLink>
            <NakedLink href="/for-whom/services">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.for-whom.services"
                  defaultMessage="Professional Services"
                />
              </MenuItem>
            </NakedLink>
          </MenuList>
        </Portal>
      </Menu>
      <NakedLink href="/about">
        <Button as="a" variant="ghost">
          <FormattedMessage id="public.about-link" defaultMessage="About" />
        </Button>
      </NakedLink>
      <Button as="a" variant="ghost" href="/blog">
        <FormattedMessage id="public.blog-link" defaultMessage="Blog" />
      </Button>
      <NakedLink href="/login">
        <Button as="a" variant="outline" id="pw-public-login">
          <FormattedMessage id="public.login-button" defaultMessage="Login" />
        </Button>
      </NakedLink>
      <NakedLink href="/invite">
        <Button as="a" colorScheme="purple">
          <FormattedMessage
            id="public.invite-button"
            defaultMessage="Request an invite"
          />
        </Button>
      </NakedLink>
    </Stack>
  );
}
