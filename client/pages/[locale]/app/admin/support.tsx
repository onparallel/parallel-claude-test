import { gql, useQuery } from "@apollo/client";
import { Box, Flex, Heading, Spinner, Stack, Text } from "@chakra-ui/core";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import { MethodModal } from "@parallel/components/admin-support/MethodModal";
import { Card } from "@parallel/components/common/Card";
import { SearchInput } from "@parallel/components/common/SearchInput";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  PetitionsUserQuery,
  useSupportMethodsUserQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo";
import { compose } from "@parallel/utils/compose";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import {
  getIntrospectionQuery,
  IntrospectionObjectType,
  IntrospectionQuery,
} from "graphql";
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";

function SupportMethods() {
  const intl = useIntl();

  const {
    data: { me },
  } = assertQuery(useSupportMethodsUserQuery());
  const { data, loading } = useQuery<IntrospectionQuery>(
    gql(getIntrospectionQuery())
  );
  const supportMethods = useMemo(() => {
    if (!data) {
      return [];
    } else {
      const mutationTypeName = data.__schema.mutationType!.name;
      const mutation = data.__schema.types.find(
        (t) => t.name === mutationTypeName
      )! as IntrospectionObjectType;

      const prefix = "support";
      return mutation.fields
        .filter((f) => f.name.startsWith(prefix))
        .map((f) => ({
          id: f.name,
          type: f.type,
          name: f.name
            .slice(prefix.length)
            .replace(/(?<=[a-z\b])[A-Z]/g, (a) => ` ${a}`),
          description: f.description ?? "",
          args: f.args.map((arg, i) => ({
            ...arg,
            position: i,
            required: arg.type.kind === "NON_NULL",
          })),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [data]);

  const schemaTypes = useMemo(() => {
    return data ? data!.__schema.types : [];
  }, [data]);

  const [search, setSearch] = useState("");
  const filteredSupportMethods = useMemo(() => {
    return supportMethods.filter((m) => {
      return (
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [supportMethods, search]);

  const [selected, setSelected] = useState<
    Maybe<UnwrapArray<typeof supportMethods>>
  >(null);

  return (
    <AppLayout
      title={intl.formatMessage({
        id: "support-methods.title",
        defaultMessage: "Support methods",
      })}
      user={me}
    >
      <Box marginX="auto" width="container.md">
        <Box paddingY={4} position="sticky" top={0}>
          <SearchInput
            isDisabled={loading}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        {loading ? (
          <Flex justifyContent="center">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="purple.500"
              size="xl"
              marginTop={24}
            />
          </Flex>
        ) : (
          <Stack>
            {filteredSupportMethods.map((m) => (
              <Card
                key={m.id}
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
                onClick={() => setSelected(m)}
              >
                <Box flex="1">
                  <Heading size="sm">{m.name}</Heading>
                  <Text fontSize="sm">{m.description}</Text>
                </Box>
                <Flex justifyContent="center" alignItems="center">
                  <ChevronRightIcon boxSize="24px" color="gray.500" />
                </Flex>
              </Card>
            ))}
          </Stack>
        )}
        {selected && (
          <MethodModal
            method={selected}
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
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<PetitionsUserQuery>(gql`
      query SupportMethodsUser {
        me {
          ...SupportMethods_User
        }
      }
      ${SupportMethods.fragments.User}
    `),
  ]);
};

export default compose(withApolloData)(SupportMethods);
