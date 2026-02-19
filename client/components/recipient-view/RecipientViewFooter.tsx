import { gql } from "@apollo/client";
import { chakraComponent } from "@parallel/chakra/utils";
import { List, ListItem } from "@chakra-ui/react";
import { Link, NormalLink } from "@parallel/components/common/Link";
import { Logo } from "@parallel/components/common/Logo";
import { RecipientViewFooter_PublicPetitionFragment } from "@parallel/graphql/__types";
import { Flex, Stack } from "@parallel/components/ui";
import { FormattedMessage, useIntl } from "react-intl";

export interface RecipientViewFooterProps {
  petition: RecipientViewFooter_PublicPetitionFragment;
}

export const RecipientViewFooter = chakraComponent<"div", RecipientViewFooterProps>(
  function RecipientViewFooter({ ref, ...props }) {
    const intl = useIntl();
    return (
      <Flex
        ref={ref}
        flexDirection="column"
        marginTop={12}
        as="footer"
        alignItems="center"
        {...props}
      >
        {props.petition.organization.hasRemoveParallelBranding ? null : (
          <Flex fontSize="sm" alignItems="center" position="relative">
            <FormattedMessage
              id="generic.created-with-parallel"
              defaultMessage="Created with {parallel}"
              values={{
                parallel: (
                  <Flex
                    as="a"
                    href={`https://www.onparallel.com/${intl.locale}?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients`}
                    marginStart={2.5}
                    target="_blank"
                  >
                    <Logo display="inline-block" width="100px" />
                  </Flex>
                ),
              }}
            />
          </Flex>
        )}
        <Stack
          as={List}
          textAlign="center"
          marginY={4}
          direction={{ base: "column", sm: "row" }}
          gap={{ base: 4, sm: 8 }}
        >
          <ListItem>
            <NormalLink
              href={`https://help.onparallel.com/${intl.locale}/collections/3391072?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients`}
              isExternal
            >
              <FormattedMessage id="generic.support-faq" defaultMessage="FAQ" />
            </NormalLink>
          </ListItem>
          <ListItem>
            <Link
              href={`https://www.onparallel.com/${intl.locale}/legal/terms?utm_source=parallel&utm_medium=recipient_view&utm_campaign=recipients`}
              target="_blank"
            >
              <FormattedMessage
                id="generic.terms-and-conditions"
                defaultMessage="Terms & Conditions"
              />
            </Link>
          </ListItem>
        </Stack>
      </Flex>
    );
  },
);

const _fragments = {
  PublicPetition: gql`
    fragment RecipientViewFooter_PublicPetition on PublicPetition {
      id
      organization {
        id
        hasRemoveParallelBranding
      }
    }
  `,
};
