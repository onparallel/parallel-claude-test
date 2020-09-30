import { gql, useQuery } from "@apollo/client";
import { Box, Flex, Heading, Spinner, Stack, Text } from "@chakra-ui/core";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import {
  Method,
  MethodModal,
} from "@parallel/components/admin-support/MethodModal";
import { Card } from "@parallel/components/common/Card";
import { SearchInput } from "@parallel/components/common/SearchInput";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  PetitionsUserQuery,
  SupportMethodsUserQuery,
  useSupportMethodsUserQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { Maybe, UnwrapArray } from "@parallel/utils/types";
import {
  getIntrospectionQuery,
  IntrospectionObjectType,
  IntrospectionQuery,
} from "graphql";
import { useMemo, useState } from "react";

function SupportMethods() {
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

      const queryTypeName = data.__schema.queryType!.name;
      const query = data.__schema.types.find(
        (t) => t.name === queryTypeName
      )! as IntrospectionObjectType;

      return [
        ...mutation.fields.map((m) => ({ ...m, queryType: "mutation" })),
        ...query.fields.map((m) => ({ ...m, queryType: "query" })),
      ]
        .filter(
          (f) =>
            f.type.kind === "NON_NULL" &&
            (f.type.ofType as any).name === "SupportMethodResponse"
        )
        .map((f) => {
          let name = f.name.replace(/([A-Z])/g, " $1");
          name = name.charAt(0).toUpperCase() + name.slice(1);
          return {
            id: f.name,
            type: f.type,
            name,
            queryType: f.queryType,
            description: f.description ?? "",
            args: f.args.map((arg, i) => ({
              ...arg,
              position: i,
              required: arg.type.kind === "NON_NULL",
              description: arg.description,
            })),
          };
        })
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
    <AppLayout title="Support methods" user={me}>
      <Box marginX="auto" width="100%" maxWidth="container.md" padding={2}>
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
            method={selected as Method}
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
  res,
}: WithApolloDataContext) => {
  const [{ data }] = await Promise.all([
    fetchQuery<PetitionsUserQuery>(gql`
      query SupportMethodsUser {
        me {
          ...SupportMethods_User
          organizationRole
          organization {
            identifier
          }
        }
      }
      ${SupportMethods.fragments.User}
    `),
  ]);

  const { me } = data as SupportMethodsUserQuery;
  if (
    !me ||
    me.organization.identifier !== "parallel" ||
    me.organizationRole !== "ADMIN"
  ) {
    res?.writeHead(403).end();
  }
};

export default compose(withApolloData)(SupportMethods);
