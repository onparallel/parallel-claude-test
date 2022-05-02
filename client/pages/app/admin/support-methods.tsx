import { gql } from "@apollo/client";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import { SupportMethodModal } from "@parallel/components/admin-support/SupportMethodModal";
import { Card } from "@parallel/components/common/Card";
import { withDialogs } from "@parallel/components/common/dialogs/DialogProvider";
import { SearchInput } from "@parallel/components/common/SearchInput";
import { withApolloData, WithApolloDataContext } from "@parallel/components/common/withApolloData";
import { withSuperAdminAccess } from "@parallel/components/common/withSuperAdminAccess";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { AdminSupportMethods_userDocument } from "@parallel/graphql/__types";
import { useAssertQuery } from "@parallel/utils/apollo/useAssertQuery";
import { compose } from "@parallel/utils/compose";
import { unCamelCase } from "@parallel/utils/strings";
import { Maybe, UnwrapArray, UnwrapPromise } from "@parallel/utils/types";
import { useAdminSections } from "@parallel/utils/useAdminSections";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type AdminSupportMethodsProps = Exclude<
  UnwrapPromise<ReturnType<typeof AdminSupportMethods.getInitialProps>>,
  undefined
>;

function AdminSupportMethods({ supportMethods, schemaTypes }: AdminSupportMethodsProps) {
  const intl = useIntl();
  const {
    data: { me, realMe },
  } = useAssertQuery(AdminSupportMethods_userDocument);
  const sections = useAdminSections();

  const [search, setSearch] = useState("");

  const filteredAdminSupportMethods = useMemo(() => {
    return supportMethods.filter(({ field }) => {
      return (
        unCamelCase(field.name).toLowerCase().includes(search.toLowerCase()) ||
        field.description?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [supportMethods, search]);

  const [selected, setSelected] = useState<Maybe<UnwrapArray<typeof supportMethods>>>(null);

  return (
    <SettingsLayout
      title={intl.formatMessage({
        id: "admin.support-methods",
        defaultMessage: "Support methods",
      })}
      basePath="/app/admin"
      sections={sections}
      me={me}
      realMe={realMe}
      sectionsHeader={<FormattedMessage id="admin.title" defaultMessage="Admin panel" />}
      header={
        <Heading as="h3" size="md">
          <FormattedMessage id="admin.support-methods" defaultMessage="Support methods" />
        </Heading>
      }
    >
      <Box marginX="auto" width="100%" maxWidth="container.md" paddingX={4} paddingBottom={16}>
        <Box paddingY={4}>
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
        </Box>
        <Stack>
          {filteredAdminSupportMethods.map((method) => (
            <Card
              key={method.field.name}
              display="flex"
              paddingX={4}
              paddingY={2}
              outline="none"
              isInteractive
              role="button"
              tabIndex={1}
              onClick={() => setSelected(method)}
            >
              <Box flex="1">
                <Heading size="sm">{unCamelCase(method.field.name)}</Heading>
                <Text fontSize="sm">{method.field.description}</Text>
              </Box>
              <Flex justifyContent="center" alignItems="center">
                <ChevronRightIcon boxSize="24px" />
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

AdminSupportMethods.queries = [
  gql`
    query AdminSupportMethods_user {
      ...AppLayout_Query
    }
    ${AppLayout.fragments.Query}
  `,
];

AdminSupportMethods.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  await fetchQuery(AdminSupportMethods_userDocument);
  const { supportMethods, schemaTypes } = await import("@parallel/graphql/__support-methods");
  return { supportMethods, schemaTypes };
};

export default compose(withSuperAdminAccess, withDialogs, withApolloData)(AdminSupportMethods);
