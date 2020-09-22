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
import {
  IntrospectionInputTypeRef,
  IntrospectionOutputTypeRef,
  IntrospectionType,
} from "graphql";
import { useCallback, useEffect, useReducer } from "react";

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

  const [methodArgs, dispatch] = useReducer(argsReducer, []);

  const methodReturnTypeName =
    method.type.kind === "NON_NULL"
      ? (method.type.ofType as any).name
      : (method.type as any).name;

  console.log(method, methodReturnTypeName);

  const hasEmptyKeys = (value: any): boolean => {
    return Object.values(value).some((v) => v === "");
  };

  const buildGraphQLQuery = useCallback(
    (method: Method, args: ArgumentWithState[]) => {
      const argToGraphQLParam = (arg: ArgumentWithState): string => {
        const quote =
          arg.type.kind === "SCALAR" && arg.type.name !== "Int" ? '"' : "";
        const inputValue =
          typeof arg.inputValue === "object"
            ? JSON.stringify(arg.inputValue).replace(/"([^"]+)":/g, "$1:")
            : arg.inputValue;
        return `${arg.name}:${quote}${inputValue}${quote}`;
      };

      return `${method.id}(${args
        .filter((arg) => arg.inputValue !== "")
        .map(argToGraphQLParam)
        .join(",")})`;
    },
    []
  );

  const handleExecute = useCallback(() => {
    debugger;
    console.log(methodArgs);
    const errors = methodArgs.filter(
      (arg) =>
        arg.required && (arg.inputValue === "" || hasEmptyKeys(arg.inputValue))
    );
    if (errors.length > 0) {
      errors.forEach((arg) => dispatch({ type: "error", arg }));
      return;
    }

    const query = buildGraphQLQuery(method, methodArgs);
    console.log(query);
  }, [methodArgs]);

  useEffect(() => {
    dispatch({ type: "clear" });
    method.args.forEach((arg) => {
      dispatch({
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
                  onChange={(arg) => dispatch({ type: "set", arg })}
                />
              ))}
            </Stack>
          </ModalBody>
          <ModalFooter as={Stack} direction="row">
            <Button onClick={() => onClose()}>Cancel</Button>
            <Button colorScheme="purple" onClick={handleExecute}>
              Execute
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}
