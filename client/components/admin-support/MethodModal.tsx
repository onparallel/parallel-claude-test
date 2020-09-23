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
import { Maybe } from "@parallel/graphql/__types";
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
    (method: Method, args: ArgumentWithState[]) => {
      const argToGraphQLParam = (arg: ArgumentWithState): string => {
        const quote =
          !arg.list && arg.type.kind === "SCALAR" && arg.type.name !== "Int"
            ? '"'
            : "";
        let inputValue =
          typeof arg.inputValue === "object"
            ? JSON.stringify(arg.inputValue).replace(/"([^"]+)":/g, "$1:")
            : arg.inputValue;

        if (arg.list && typeof arg.inputValue === "string") {
          inputValue = JSON.stringify(
            inputValue.split(",").map((v: string) => v.trim())
          );
        }

        return `${arg.name}:${quote}${inputValue}${quote}`;
      };

      return `mutation { 
        ${method.id}(${args
        .filter((arg) => arg.inputValue !== "")
        .map(argToGraphQLParam)
        .join(",")}) 
      }`;
    },
    []
  );

  const [status, setStatus] = useState<{ loading: boolean; data?: any }>({
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

    const mutation = gql(buildGraphQLQuery(method, methodArgs));
    setStatus({ loading: true, data: null });
    const { data } = await apolloClient.mutate({ mutation });
    setStatus({ loading: false, data: data[method.id] });
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

function StatusTag({ status }: { status: { loading: boolean; data?: any } }) {
  return status.loading ? (
    <Text></Text>
  ) : (
    <Text
      sx={{
        fontWeight: "bold",
        color: status.data === "SUCCESS" ? "green.500" : "red.500",
      }}
    >
      {status.data}
    </Text>
  );
}
