import { gql } from "@apollo/client";
import { Box, HStack, Img, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Logo } from "@parallel/components/common/Logo";
import {
  RecipientPortalHeader_PublicContactFragment,
  RecipientPortalHeader_PublicOrganizationFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { RecipientViewMenuButton } from "./RecipientViewMenuButton";

interface RecipientPortalHeaderProps {
  organization: RecipientPortalHeader_PublicOrganizationFragment;
  contact: RecipientPortalHeader_PublicContactFragment;
  keycode: string;
}

export const RecipientPortalHeader = Object.assign(
  chakraForwardRef<"section", RecipientPortalHeaderProps>(function RecipientPortalHeader(
    { organization, contact, keycode, ...props },
    ref,
  ) {
    return (
      <HStack
        ref={ref as any}
        paddingY={2}
        paddingX={4}
        justifyContent="space-between"
        zIndex={3}
        backgroundColor="white"
        width="100%"
        borderBottom="1px solid"
        borderBottomColor="gray.200"
        {...props}
      >
        {organization.logoUrl72 ? (
          <Img
            src={organization.logoUrl72}
            aria-label={organization.name}
            width="auto"
            height="36px"
          />
        ) : (
          <Logo width="152px" height="36px" />
        )}
        <HStack spacing={3}>
          <Text>
            <FormattedMessage
              id="component.recipient-portal-header.hello-name"
              defaultMessage="Hello, {name}!"
              values={{ name: contact.firstName }}
            />
          </Text>
          <Box display={{ base: "none", md: "flex" }}>
            <RecipientViewMenuButton
              keycode={keycode}
              contact={contact}
              hasClientPortalAccess={true}
              pendingPetitions={0}
              hideHomeButton
            />
          </Box>
        </HStack>
      </HStack>
    );
  }),
  {
    fragments: {
      PublicContact: gql`
        fragment RecipientPortalHeader_PublicContact on PublicContact {
          id
          fullName
          firstName
          email
          initials
        }
      `,
      PublicOrganization: gql`
        fragment RecipientPortalHeader_PublicOrganization on PublicOrganization {
          name
          logoUrl72: logoUrl(options: { resize: { height: 72 } })
        }
      `,
    },
  },
);
