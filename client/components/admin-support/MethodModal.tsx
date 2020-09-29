import { gql } from "@apollo/client";
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
import { createApolloClient } from "@parallel/utils/apollo";
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

type Method = {
  id: string;
  name: string;
  type: IntrospectionOutputTypeRef;
  description: string;
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
  const apolloClient = createApolloClient(
    {},
    {
      getToken() {
        return localStorage.getItem("token")!;
      },
    }
  );
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
      const argsDef = (args: ArgumentWithState[]) => {
        return args
          .map(
            (arg) =>
              `$${arg.name}: ${(arg.type as any).name.concat(
                arg.required ? "!" : ""
              )}`
          )
          .join(", ");
      };

      const variables: { [key: string]: any } = {};
      args.forEach((arg) => {
        variables[arg.name] = arg.inputValue;
      });

      return {
        query: `mutation(${argsDef(args)}) { 
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
    const mutation = gql(query);
    setStatus({ loading: true, data: null });
    try {
      const { data } = await apolloClient.mutate({ mutation, variables });
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
