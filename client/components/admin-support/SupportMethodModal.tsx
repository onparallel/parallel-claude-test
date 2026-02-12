/* eslint-disable formatjs/no-literal-string-in-jsx */
import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import {
  Grid,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { Button, Stack, Text } from "@parallel/components/ui";
import { SupportMethodResponse } from "@parallel/graphql/__types";
import { unCamelCase } from "@parallel/utils/strings";
import { Maybe } from "@parallel/utils/types";
import { IntrospectionField, IntrospectionInputTypeRef, IntrospectionType } from "graphql";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HtmlBlock } from "../common/HtmlBlock";
import { getDefaultInputTypeValue } from "./helpers";
import { SupportMethodArgumentInput } from "./SupportMethodArgumentInput";

interface MethodModalProps {
  field: IntrospectionField;
  queryType: "query" | "mutation";
  schemaTypes: readonly IntrospectionType[];
  onClose: () => void;
}

function reset(field: IntrospectionField, schemaTypes: readonly IntrospectionType[]) {
  return () =>
    Object.fromEntries(
      field.args.map((arg) => [
        arg.name,
        {
          value: getDefaultInputTypeValue(arg.type, schemaTypes, arg.defaultValue),
          isInvalid: false,
        },
      ]),
    );
}

export function SupportMethodModal({ field, queryType, schemaTypes, onClose }: MethodModalProps) {
  const apolloClient = useApolloClient();

  const [values, setValues] = useState(reset(field, schemaTypes));
  const [status, setStatus] = useState<{
    loading: boolean;
    data?: Maybe<SupportMethodResponse>;
  }>({
    loading: false,
    data: null,
  });
  const graphQLQuery = useMemo(() => {
    const getArgType = (type: IntrospectionInputTypeRef): string => {
      switch (type.kind) {
        case "NON_NULL":
          return `${getArgType(type.ofType)}!`;
        case "LIST":
          return `[${getArgType(type.ofType)}]`;
        default:
          return type.name;
      }
    };
    const argsDef = field.args.map((arg) => `$${arg.name}: ${getArgType(arg.type)}`).join(", ");
    const argsAssignment = field.args.map((arg) => `${arg.name}: $${arg.name}`).join(", ");

    const query = `
      ${queryType} support_${field.name}(${argsDef}) {
        ${field.name}(${argsAssignment}) {
          result
          type
          message
        }
      }
    `;
    return gql(query);
  }, [queryType, field]);

  const handleExecute = useCallback(async () => {
    // Validate missing values
    const invalidFields = field.args.filter(
      (f) =>
        f.type.kind === "NON_NULL" &&
        (values[f.name] === null || values[f.name].value === "" || values[f.name].value === null),
    );
    setValues({
      ...Object.fromEntries(
        field.args.map((arg) => [
          arg.name,
          {
            ...values[arg.name],
            isInvalid: invalidFields.some((a) => a.name === arg.name),
          },
        ]),
      ),
    });
    if (invalidFields.length > 0) {
      return;
    }
    setStatus({ loading: true, data: null });
    try {
      const variables = Object.fromEntries(
        field.args.map((arg) => [arg.name, values[arg.name].value]),
      );
      const { data } =
        queryType === "query"
          ? await apolloClient.query({
              query: graphQLQuery,
              variables,
              fetchPolicy: "no-cache",
            })
          : await apolloClient.mutate({
              mutation: graphQLQuery,
              variables,
              fetchPolicy: "no-cache",
            });
      setStatus({ loading: false, data: (data as any)[field.name] });
    } catch (e: any) {
      setStatus({
        loading: false,
        data: {
          result: "FAILURE",
          message: e.message,
        },
      });
    }
  }, [graphQLQuery, queryType, values]);

  // reset when changing fields
  useEffect(() => setValues(reset(field, schemaTypes)), [field, schemaTypes]);

  return (
    <Modal isOpen size="xl" onClose={() => onClose()}>
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            {unCamelCase(field.name)}
            <Text fontSize="sm" fontWeight="normal">
              {field.description}
            </Text>
          </ModalHeader>
          <ModalBody>
            <Grid templateColumns="minmax(100px, auto) 1fr" rowGap={2} columnGap={2}>
              {field.args.map((arg) => (
                <SupportMethodArgumentInput
                  key={arg.name}
                  arg={arg}
                  schemaTypes={schemaTypes}
                  value={values[arg.name].value}
                  isInvalid={values[arg.name].isInvalid}
                  onValue={(value) =>
                    setValues((state) => ({
                      ...state,
                      [arg.name]: { value, isInvalid: false },
                    }))
                  }
                />
              ))}
            </Grid>
          </ModalBody>
          <ModalFooter as={Stack} direction="row" justifyContent="space-between">
            <StatusTag status={status} />
            <Stack direction="row">
              <Button onClick={() => onClose()}>Cancel</Button>
              <Button loading={status.loading} colorPalette="primary" onClick={handleExecute}>
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
      {status.data.result}
      {status.data.type === "copy-to-clipboard" ? (
        <CopyToClipboardButton content={status.data.message ?? ""} />
      ) : status.data.message ? (
        <HtmlBlock dangerousInnerHtml={status.data.message.split("\n").join("<br/>")} />
      ) : null}
    </Text>
  );
}

function CopyToClipboardButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  function handleExportClick() {
    navigator.clipboard.writeText(content);
    setCopied(true);
  }
  return (
    <Button color="black" onClick={handleExportClick}>
      {copied ? "Copied to clipboard!" : "Copy to clipboard"}
      {copied ? <CheckIcon marginStart={1} color="green.500" /> : null}
    </Button>
  );
}
