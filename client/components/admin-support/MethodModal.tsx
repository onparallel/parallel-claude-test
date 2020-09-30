import { gql, useApolloClient } from "@apollo/client";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  Stack,
  ModalFooter,
  Button,
} from "@chakra-ui/core";
import { Maybe, SupportMethodResponse } from "@parallel/graphql/__types";
import {
  IntrospectionInputTypeRef,
  IntrospectionOutputTypeRef,
  IntrospectionType,
} from "graphql";
import { useCallback, useEffect, useReducer, useState } from "react";

import {
  ArgumentInput,
  ArgumentWithState,
  getDefaultInputValue,
} from "./ArgumentInput";

type MethodModalProps = {
  method: Method;
  schemaTypes: readonly IntrospectionType[];
  onClose: () => void;
};

export type Method = {
  id: string;
  name: string;
  type: IntrospectionOutputTypeRef;
  description: string;
  queryType: "query" | "mutation";
  args: {
    position: number;
    required: boolean;
    name: string;
    type: IntrospectionInputTypeRef;
    description?: Maybe<string>;
    defaultValue?: Maybe<any>;
  }[];
};

export function MethodModal({
  method,
  schemaTypes,
  onClose,
}: MethodModalProps) {
  const apolloClient = useApolloClient();

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

  const [methodArgs, dispatchArg] = useReducer(argsReducer, []);

  const hasEmptyKeys = (value: any): boolean => {
    return Object.values(value).some((v) => v === "");
  };

  const buildGraphQLQuery = useCallback(
    (method: Method, _args: ArgumentWithState[]) => {
      const args = _args.filter((arg) => arg.inputValue !== "");
      const deepSearchArgType = (arg: ArgumentWithState): string => {
        if (arg.type.kind === "NON_NULL") {
          return deepSearchArgType({ ...arg, type: arg.type.ofType });
        } else {
          return (arg.type as any).name.concat(arg.required ? "!" : "");
        }
      };
      const argsDef = (args: ArgumentWithState[]) => {
        return args
          .map((arg) => `$${arg.name}: ${deepSearchArgType(arg)}`)
          .join(", ");
      };

      const variables: { [key: string]: any } = {};
      args.forEach((arg) => {
        variables[arg.name] = arg.inputValue;
      });

      return {
        query: `${method.queryType}(${argsDef(args)}) { 
          ${method.id}(${args
          .map((arg) => `${arg.name}: $${arg.name}`)
          .join(", ")}) { 
            result
            message 
          }
        }`,
        variables,
      };
    },
    []
  );

  const [status, setStatus] = useState<{
    loading: boolean;
    data?: Maybe<SupportMethodResponse>;
  }>({
    loading: false,
    data: null,
  });

  const handleExecute = useCallback(async () => {
    const argErrors = methodArgs.filter(
      (arg) =>
        arg.required && (arg.inputValue === "" || hasEmptyKeys(arg.inputValue))
    );
    if (argErrors.length > 0) {
      argErrors.forEach((arg) => dispatchArg({ type: "error", arg }));
      return;
    }

    const { query, variables } = buildGraphQLQuery(method, methodArgs);
    setStatus({ loading: true, data: null });
    try {
      let data;
      if (method.queryType === "mutation") {
        data = (
          await apolloClient.mutate({
            mutation: gql(query),
            variables,
          })
        ).data;
      } else if (method.queryType === "query") {
        data = (
          await apolloClient.query({
            query: gql(query),
            variables,
          })
        ).data;
      }
      setStatus({ loading: false, data: data[method.id] });
    } catch (e) {
      setStatus({
        loading: false,
        data: {
          result: "FAILURE",
          message: e.message,
        },
      });
    }
  }, [methodArgs]);

  useEffect(() => {
    dispatchArg({ type: "clear" });
    method.args.forEach((arg) => {
      dispatchArg({
        type: "set",
        arg: {
          ...arg,
          inputValue: getDefaultInputValue(arg, schemaTypes),
        },
      });
    });
  }, [method.id]);

  return (
    <Modal isOpen size="xl" onClose={() => onClose()}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            {method.name}
            <Text fontSize="sm" fontWeight="normal">
              {method.description}
            </Text>
            <Text
              fontSize="xs"
              color={method.queryType === "mutation" ? "red.500" : ""}
            >
              {method.queryType === "query"
                ? "This method has no impact on the database."
                : "This method will write into the database."}
            </Text>
          </ModalHeader>
          <ModalBody>
            <Stack>
              {methodArgs.map((arg, i) => (
                <ArgumentInput
                  key={i}
                  argument={arg}
                  schemaTypes={schemaTypes}
                  onChange={(arg) => dispatchArg({ type: "set", arg })}
                />
              ))}
            </Stack>
          </ModalBody>
          <ModalFooter
            as={Stack}
            direction="row"
            justifyContent="space-between"
          >
            <StatusTag status={status} />
            <Stack direction="row">
              <Button onClick={() => onClose()}>Cancel</Button>
              <Button colorScheme="purple" onClick={handleExecute}>
                Execute
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

function StatusTag({
  status,
}: {
  status: { loading: boolean; data?: Maybe<SupportMethodResponse> };
}) {
  return status.loading || !status.data ? (
    <Text></Text>
  ) : (
    <Text
      sx={{
        fontWeight: "bold",
        color: status.data.result === "SUCCESS" ? "green.500" : "red.500",
      }}
    >
      {status.data.result} {status.data.message}
    </Text>
  );
}
