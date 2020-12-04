import { gql } from "@apollo/client";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/core";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import { SupportMethodModal } from "@parallel/components/admin-support/SupportMethodModal";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import { SearchInput } from "@parallel/components/common/SearchInput";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import {
  SupportMethodsUserQuery,
  useSupportMethodsUserQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { unCamelCase } from "@parallel/utils/strings";
import { Maybe, UnwrapArray, UnwrapPromise } from "@parallel/utils/types";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type SupportMethodsProps = Exclude<
  UnwrapPromise<ReturnType<typeof SupportMethods.getInitialProps>>,
  undefined
>;

function SupportMethods({ supportMethods, schemaTypes }: SupportMethodsProps) {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(useSupportMethodsUserQuery());
  const sections = useAdminSections();

  const [search, setSearch] = useState("");

  const filteredSupportMethods = useMemo(() => {
    return supportMethods.filter(({ field }) => {
      return (
        unCamelCase(field.name).toLowerCase().includes(search.toLowerCase()) ||
        field.description?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [supportMethods, search]);

  const [selected, setSelected] = useState<
    Maybe<UnwrapArray<typeof supportMethods>>
  >(null);

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "admin.support-methods",
        defaultMessage: "Support methods",
      })}
      basePath="/app/admin"
      sections={sections}
      user={me}
      sectionsHeader={
        <FormattedMessage id="admin.title" defaultMessage="Admin panel" />
      }
      header={
        <FormattedMessage
          id="admin.support-methods"
          defaultMessage="Support methods"
        />
      }
    >
      <Box marginX="auto" width="100%" maxWidth="container.md" paddingX={4}>
        <Box paddingY={4}>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Stack>
          {filteredSupportMethods.map((method) => (
            <Card
              key={method.field.name}
              display="flex"
              paddingX={4}
              paddingY={2}
              outline="none"
              _hover={{
                borderColor: "gray.300",
                boxShadow: "lg",
              }}
              _focus={{
                boxShadow: "outline",
                borderColor: "gray.200",
              }}
              sx={{
                ":hover": {
                  svg: {
                    color: "gray.700",
                  },
                },
              }}
              role="button"
              tabIndex={1}
              onClick={() => setSelected(method)}
            >
              <Box flex="1">
                <Heading size="sm">{unCamelCase(method.field.name)}</Heading>
                <Text fontSize="sm">{method.field.description}</Text>
              </Box>
              <Flex justifyContent="center" alignItems="center">
                <ChevronRightIcon boxSize="24px" color="gray.500" />
              </Flex>
            </Card>
          ))}
        </Stack>
        {selected && (
          <SupportMethodModal
            {...selected}
            schemaTypes={schemaTypes}
            onClose={() => setSelected(null)}
          />
        )}
      </Box>
    </SettingsLayout>
  );
}

SupportMethods.fragments = {
  get User() {
    return gql`
      fragment SupportMethods_User on User {
        ...AppLayout_User
      }
      ${AppLayout.fragments.User}
    `;
  },
};

SupportMethods.getInitialProps = async ({
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<SupportMethodsUserQuery>(gql`
      query SupportMethodsUser {
        me {
          ...SupportMethods_User
        }
      }
      ${SupportMethods.fragments.User}
    `),
  ]);
  const { supportMethods, schemaTypes } = await import(
    "@parallel/graphql/__support-methods"
  );
  return { supportMethods, schemaTypes };
};

export default compose(
  withSuperAdminAccess,
  withDialogs,
  withApolloData
)(SupportMethods);
