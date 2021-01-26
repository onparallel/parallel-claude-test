import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Input,
  FormControl,
  Radio,
  RadioGroup,
  Stack,
  Text,
  FormLabel,
  FormErrorMessage,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogProvider";
import { ExportRepliesDialog_PetitionFieldFragment } from "@parallel/graphql/__types";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";
import escapeStringRegexp from "escape-string-regexp";
import { useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import sanitize from "sanitize-filename";
import {
  PlaceholderInput,
  PlaceholderInputRef,
} from "../common/PlaceholderInput";

export type ExportRepliesDialogProps = {
  fields: ExportRepliesDialog_PetitionFieldFragment[];
};

export type ExportType =
  | { type: "DOWNLOAD_ZIP"; pattern: string }
  | { type: "EXPORT_CUATRECASAS"; pattern: string; clientId: string };

export function ExportRepliesDialog({
  fields,
  ...props
}: DialogProps<ExportRepliesDialogProps, ExportType>) {
  const intl = useIntl();
  const [option, setOption] = useState<ExportType["type"]>("DOWNLOAD_ZIP");
  const [rename, setRename] = useState(true);
  const [pattern, setPattern] = useState("#field-title#");
  const placeholders = useMemo(
    () => [
      {
        value: "field-number",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-field-number",
          defaultMessage: "Field number",
        }),
      },
      {
        value: "field-title",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-field-title",
          defaultMessage: "Field title",
        }),
      },
      {
        value: "contact-first-name",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-contact-first-name",
          defaultMessage: "Contact first name",
        }),
      },
      {
        value: "contact-last-name",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-contact-last-name",
          defaultMessage: "Contact last name",
        }),
      },
      {
        value: "file-name",
        label: intl.formatMessage({
          id: "component.download-dialog.placeholder-file-name",
          defaultMessage: "File name",
        }),
      },
    ],
    [intl.locale]
  );
  const [clientId, setClientId] = useState("");
  const [clientIdError, setClientIdError] = useState(false);
  const clientIdRef = useRef<HTMLInputElement>(null);

  const fieldIndexValues = useFieldIndexValues(fields);
  const example = useMemo(() => {
    const field = fields.find(
      (f) => f.type === "FILE_UPLOAD" && f.replies.length > 0
    )!;
    const position = fieldIndexValues[fields.indexOf(field)];
    const reply = field.replies[0];
    const extension =
      (reply.content.filename as string).match(/\.[a-z0-9]+$/)?.[0] ?? "";
    const parts = pattern.split(
      new RegExp(
        `(#(?:${placeholders
          .map((p) => escapeStringRegexp(p.value))
          .join("|")})#)`,
        "g"
      )
    );
    const name = parts
      .map((part) => {
        if (part.startsWith("#") && part.endsWith("#")) {
          const value = part.slice(1, -1);
          switch (value) {
            case "field-number":
              return position;
            case "field-title":
              return field.title ?? "";
            case "file-name":
              // remove file extension since it's added back later
              return reply.content.filename.replace(/\.[a-z0-9]+$/, "");
            case "contact-first-name":
              return reply.access?.contact?.firstName ?? "";
            case "contact-last-name":
              return reply.access?.contact?.lastName ?? "";
          }
        }
        return part;
      })
      .join("");
    return sanitize(`${name}${extension ?? ""}`);
  }, [pattern, fields, fieldIndexValues]);

  const inputRef = useRef<PlaceholderInputRef>(null);
  const handleConfirmClick = () => {
    const _pattern = rename ? pattern : "#field-title#";
    if (option === "DOWNLOAD_ZIP") {
      props.onResolve({ type: option, pattern: _pattern });
    } else if (option === "EXPORT_CUATRECASAS") {
      if (!clientId || !/^\d{6}$/.test(clientId)) {
        setClientIdError(true);
        clientIdRef.current?.focus();
      } else {
        setClientIdError(false);
        props.onResolve({ type: option, pattern: _pattern, clientId });
      }
    }
  };

  return (
    <ConfirmDialog
      size="lg"
      initialFocusRef={inputRef as any}
      header={
        <FormattedMessage
          id="component.export-replies-dialog.header"
          defaultMessage="Export replies"
        />
      }
      body={
        <Box>
          <Text marginBottom={2}>
            <FormattedMessage
              id="component.export-replies-dialog.text"
              defaultMessage="Choose how you would like to export the replies:"
            />
          </Text>
          <RadioGroup
            value={option}
            as={Stack}
            onChange={(option) => {
              if (option === "EXPORT_CUATRECASAS") {
                setTimeout(() => clientIdRef.current?.focus());
              }
              setOption(option as any);
            }}
          >
            <Radio size="lg" value="DOWNLOAD_ZIP">
              <Text fontSize="md">
                <FormattedMessage
                  id="component.export-replies-dialog.download-files"
                  defaultMessage="Download files as a ZIP"
                />
              </Text>
              <Text fontSize="sm" color="gray.500">
                <FormattedMessage
                  id="component.export-replies-dialog.download-files-and-replies-description"
                  defaultMessage="Download all files including text replies in Excel format."
                />
              </Text>
            </Radio>
            <Radio size="lg" value="EXPORT_CUATRECASAS">
              <Text fontSize="md">
                <FormattedMessage
                  id="component.export-replies-dialog.export-cuatrecasas"
                  defaultMessage="Export to NetDocuments"
                />
              </Text>
              <Text fontSize="sm" color="gray.500">
                <FormattedMessage
                  id="component.export-replies-dialog.export-cuatrecasas-description"
                  defaultMessage="Export files to a folder in NetDocuments."
                />
              </Text>
            </Radio>
          </RadioGroup>
          <Box marginX={-1}>
            <Collapse in={option === "EXPORT_CUATRECASAS"}>
              <FormControl
                padding={1}
                paddingLeft={7}
                isInvalid={clientIdError}
              >
                <FormLabel fontWeight="normal">
                  <FormattedMessage
                    id="component.export-replies-dialog.export-cuatrecasas-client-number"
                    defaultMessage="Client number"
                  />
                  <Input
                    ref={clientIdRef}
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value);
                      setClientIdError(false);
                    }}
                    placeholder="123456"
                    pattern="[0-9]{6}"
                  />
                </FormLabel>
                <FormErrorMessage>
                  <FormattedMessage
                    id="component.export-replies-dialog.export-cuatrecasas-client-number-error"
                    defaultMessage="Client ID must be a 6 digit code"
                  />
                </FormErrorMessage>
              </FormControl>
            </Collapse>
          </Box>
          <Checkbox
            marginTop={6}
            size="lg"
            isChecked={rename}
            onChange={(e) => {
              setRename(e.target.checked);
              if (e.target.checked) {
                inputRef.current?.focus();
              }
            }}
          >
            <FormattedMessage
              id="component.export-replies-dialog.rename"
              defaultMessage="Rename files"
            />
          </Checkbox>
          <Box marginX={-1}>
            <Collapse in={rename}>
              <Box marginLeft={7} padding={1}>
                <PlaceholderInput
                  ref={inputRef}
                  value={pattern}
                  onChange={setPattern}
                  placeholders={placeholders}
                  marginBottom={2}
                />
                <Text as="div" fontSize="xs" color="gray.500">
                  <FormattedMessage
                    id="generic.for-example"
                    defaultMessage="E.g. {example}"
                    values={{ example }}
                  />
                </Text>
              </Box>
            </Collapse>
          </Box>
        </Box>
      }
      confirm={
        <Button colorScheme="purple" onClick={handleConfirmClick}>
          {option.startsWith("DOWNLOAD") ? (
            <FormattedMessage id="generic.download" defaultMessage="Download" />
          ) : (
            <FormattedMessage id="generic.export" defaultMessage="Export" />
          )}
        </Button>
      }
      {...props}
    />
  );
}

ExportRepliesDialog.fragments = {
  PetitionField: gql`
    fragment ExportRepliesDialog_PetitionField on PetitionField {
      title
      type
      replies {
        content
        access {
          contact {
            firstName
            lastName
          }
        }
      }
    }
  `,
};

export function useExportRepliesDialog() {
  return useDialog(ExportRepliesDialog);
}
