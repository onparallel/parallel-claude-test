import { Box, Button, Radio, RadioGroup, Text } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { DownloadAllDialog_PetitionFieldFragment } from "@parallel/graphql/__types";
import { gql } from "@apollo/client";
import escapeStringRegexp from "escape-string-regexp";
import { useMemo, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import sanitize from "sanitize-filename";
import {
  PlaceholderInput,
  PlaceholderInputRef,
} from "../common/PlaceholderInput";
import { useFieldIndexValues } from "@parallel/utils/fieldIndexValues";

export type DownloadAllDialogProps = {
  fields: DownloadAllDialog_PetitionFieldFragment[];
};

export function DownloadAllDialog({
  fields,
  ...props
}: DialogProps<DownloadAllDialogProps, string>) {
  const intl = useIntl();
  const [option, setOption] = useState<"ORIGINAL" | "RENAME">("RENAME");
  const [pattern, setPattern] = useState("#field-number#_#field-title#");
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
    if (option === "ORIGINAL") {
      props.onResolve("#file-name#");
    } else {
      props.onResolve(pattern);
    }
  };

  return (
    <ConfirmDialog
      initialFocusRef={inputRef as any}
      header={
        <FormattedMessage
          id="component.download-all-dialog.header"
          defaultMessage="Download all files"
        />
      }
      body={
        <>
          <Text>
            <FormattedMessage
              id="component.download-all-dialog.description"
              defaultMessage="Select if you want to rename the individual files."
            />
          </Text>
          <RadioGroup
            marginTop={2}
            onChange={(option: string) => {
              if (option === "RENAME") {
                setTimeout(() => inputRef.current?.focus());
              }
              setOption(option as any);
            }}
            value={option}
          >
            <Radio value="RENAME">
              <FormattedMessage
                id="component.download-all-dialog.rename"
                defaultMessage="Rename files"
              />
            </Radio>
            <Box marginLeft={6}>
              <PlaceholderInput
                ref={inputRef}
                isDisabled={option !== "RENAME"}
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
            <Radio value="ORIGINAL">
              <FormattedMessage
                id="component.download-all-dialog.keep-original"
                defaultMessage="Keep the original name"
              />
            </Radio>
          </RadioGroup>
        </>
      }
      confirm={
        <Button colorScheme="purple" onClick={handleConfirmClick}>
          <FormattedMessage
            id="component.download-all-dialog.download-button"
            defaultMessage="Download files"
          />
        </Button>
      }
      {...props}
    />
  );
}

DownloadAllDialog.fragments = {
  PetitionField: gql`
    fragment DownloadAllDialog_PetitionField on PetitionField {
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

export function useDownloadAllDialog() {
  return useDialog(DownloadAllDialog);
}
