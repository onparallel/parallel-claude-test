import { gql, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/core";
import { ChevronRightIcon } from "@parallel/chakra/icons";
import {
  ArgumentInput,
  ArgumentWithState,
  getDefaultInputValue,
} from "@parallel/components/admin-support/ArgumentInput";
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
import { useCallback, useMemo, useReducer, useState } from "react";
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
      const queryTypeName = data.__schema.queryType!.name;
      const query = data.__schema.types.find(
        (t) => t.name === queryTypeName
      )! as IntrospectionObjectType;
      const prefix = "public";
      return [...query.fields, ...mutation.fields]
        .filter((f) => f.name.startsWith(prefix))
        .map((f) => ({
          id: f.name,
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

  const handleSelection = (
    value: Maybe<UnwrapArray<typeof supportMethods>>
  ) => {
    setSelected(value);
    dispatch({ type: "clear" });
    value?.args.forEach((arg) => {
      dispatch({
        type: "set",
        arg: {
          ...arg,
          inputValue: getDefaultInputValue(arg, schemaTypes),
        },
      });
    });
  };

  const argsReducer = (
    state: ArgumentWithState[],
    action: {
      type: "set" | "clear" | "error";
      arg?: ArgumentWithState;
    }
  ) => {
    switch (action.type) {
      case "set":
        return action.arg
          ? state
              .filter((a) => a.name !== action.arg!.name)
              .concat({ ...action.arg, error: false })
              .sort((a, b) => a.position - b.position)
          : state;

      case "error":
        return action.arg
          ? state
              .filter((a) => a.name !== action.arg!.name)
              .concat({ ...action.arg, error: true })
              .sort((a, b) => a.position - b.position)
          : state;

      case "clear":
        return [];
      default:
        return state;
    }
  };

  const [selectedMethodArgs, dispatch] = useReducer(argsReducer, []);

  const hasEmptyKeys = (value: any): boolean => {
    return Object.values(value).some((v) => v === "");
  };

  const handleExecute = useCallback(() => {
    const errors = selectedMethodArgs.filter(
      (arg) =>
        arg.required && (arg.inputValue === "" || hasEmptyKeys(arg.inputValue))
    );
    if (errors.length > 0) {
      errors.forEach((arg) => dispatch({ type: "error", arg }));
      return;
    }
    console.log(selected, selectedMethodArgs);
  }, [selectedMethodArgs]);

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
                onClick={() => handleSelection(m)}
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
          <Modal isOpen size="xl" onClose={() => handleSelection(null)}>
            <ModalOverlay>
              <ModalContent>
                <ModalHeader>
                  {selected.name}
                  <Text fontSize="sm" fontWeight="normal">
                    {selected.description}
                  </Text>
                </ModalHeader>
                <ModalBody>
                  <Stack>
                    {selectedMethodArgs.map((arg, i) => (
                      <ArgumentInput
                        key={i}
                        argument={arg}
                        schemaTypes={schemaTypes}
                        onChange={(value: ArgumentWithState) => {
                          dispatch({ type: "set", arg: value });
                        }}
                      />
                    ))}
                  </Stack>
                </ModalBody>
                <ModalFooter as={Stack} direction="row">
                  <Button onClick={() => handleSelection(null)}>Cancel</Button>
                  <Button colorScheme="purple" onClick={handleExecute}>
                    Execute
                  </Button>
                </ModalFooter>
              </ModalContent>
            </ModalOverlay>
          </Modal>
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
