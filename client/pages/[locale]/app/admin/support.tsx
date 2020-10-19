import { gql } from "@apollo/client";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/core";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import { SupportMethodModal } from "@parallel/components/admin-support/SupportMethodModal";
import { Card } from "@parallel/components/common/Card";
import { SearchInput } from "@parallel/components/common/SearchInput";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  SupportMethodsUserQuery,
  useSupportMethodsUserQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { unCamelCase } from "@parallel/utils/strings";
import { Maybe, UnwrapArray, UnwrapPromise } from "@parallel/utils/types";
import { useMemo, useState } from "react";

type SupportMethodsProps = Exclude<
  UnwrapPromise<ReturnType<typeof SupportMethods.getInitialProps>>,
  undefined
>;

function SupportMethods({ supportMethods, schemaTypes }: SupportMethodsProps) {
  const {
    data: { me },
  } = assertQuery(useSupportMethodsUserQuery());

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
    <AppLayout title="Support methods" user={me}>
      <Box marginX="auto" width="100%" maxWidth="container.md" padding={2}>
        <Box paddingY={4} position="sticky" top={0}>
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
    </AppLayout>
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
  res,
}: WithApolloDataContext) => {
  const [{ data }] = await Promise.all([
    fetchQuery<SupportMethodsUserQuery>(gql`
      query SupportMethodsUser {
        me {
          organizationRole
          organization {
            identifier
          }
          ...SupportMethods_User
        }
      }
      ${SupportMethods.fragments.User}
    `),
  ]);
  if (
    data?.me &&
    data.me.organization.identifier === "parallel" &&
    data.me.organizationRole === "ADMIN"
  ) {
    const { supportMethods, schemaTypes } = await import(
      "@parallel/graphql/__support-methods"
    );
    return { supportMethods, schemaTypes };
  } else {
    res?.writeHead(403).end();
  }
};

export default compose(withApolloData)(SupportMethods);
