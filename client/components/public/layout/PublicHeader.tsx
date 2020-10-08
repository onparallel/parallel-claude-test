import {
  Box,
  Button,
  Collapse,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
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
        alignItems="center"
        minHeight={isThin ? 16 : 20}
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
        <PublicHeaderMenu
          direction="row"
          alignItems="center"
          spacing={4}
          display={{ base: "none", [breakpoint]: "flex" }}
        />
        <BurgerButton
          isOpen={isOpen}
          display={{ base: "block", [breakpoint]: "none" }}
          onClick={onToggle}
        />
      </Flex>
      <Collapse
        isOpen={isOpen}
        display={{ base: "block", [breakpoint]: "none" }}
      >
        <PublicHeaderMenu direction="column" spacing={2} paddingBottom={4} />
      </Collapse>
    </PublicContainer>
  );
}

function PublicHeaderMenu(props: StackProps) {
  return (
    <Stack {...props}>
      <Flex>
        <NakedLink href="/security">
          <Button flex="1" as="a" variant="ghost">
            <FormattedMessage
              id="public.security-link"
              defaultMessage="Security"
            />
          </Button>
        </NakedLink>
      </Flex>
      <Flex>
        <Menu placement="bottom">
          <MenuButton as={Button} variant="ghost" width="100%">
            <FormattedMessage
              id="public.persons-link"
              defaultMessage="For whom"
            ></FormattedMessage>
          </MenuButton>
          <MenuList>
            <NakedLink href="/for-whom/people">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.for-whom.freelance"
                  defaultMessage="Freelancers"
                ></FormattedMessage>
              </MenuItem>
            </NakedLink>
            <NakedLink href="/for-whom/legal-industry">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.for-whom.legal"
                  defaultMessage="Legal"
                ></FormattedMessage>
              </MenuItem>
            </NakedLink>
            <NakedLink href="/for-whom/services">
              <MenuItem as="a">
                <FormattedMessage
                  id="public.for-whom.services"
                  defaultMessage="Professional Services"
                ></FormattedMessage>
              </MenuItem>
            </NakedLink>
          </MenuList>
        </Menu>
      </Flex>
      <Flex>
        <NakedLink href="/about">
          <Button flex="1" as="a" variant="ghost">
            <FormattedMessage id="public.about-link" defaultMessage="About" />
          </Button>
        </NakedLink>
      </Flex>
      <Button as="a" variant="ghost" href="/blog">
        <FormattedMessage id="public.blog-link" defaultMessage="Blog" />
      </Button>
      <Flex>
        <NakedLink href="/login">
          <Button as="a" flex="1" variant="outline" id="pw-public-login">
            <FormattedMessage id="public.login-button" defaultMessage="Login" />
          </Button>
        </NakedLink>
      </Flex>
      <Flex>
        <NakedLink href="/invite">
          <Button flex="1" as="a" colorScheme="purple">
            <FormattedMessage
              id="public.invite-button"
              defaultMessage="Request an invite"
            />
          </Button>
        </NakedLink>
      </Flex>
    </Stack>
  );
}
