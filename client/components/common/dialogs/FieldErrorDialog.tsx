import { gql } from "@apollo/client";
import { Box, Button, Flex, List, ListItem, Stack, Text } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import {
  ConfirmDialog,
  ConfirmDialogProps,
} from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { FieldErrorDialog_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { ReactNode, useRef } from "react";
import { FormattedMessage } from "react-intl";

export interface FieldErrorDialogProps
  extends Omit<ConfirmDialogProps<void>, "body" | "header" | "confirm">,
    Partial<Pick<ConfirmDialogProps<void>, "header" | "confirm">> {
  message: ReactNode;
  showCancel?: boolean;
  fieldsWithIndices: {
    fieldIndex: PetitionFieldIndex;
    field: FieldErrorDialog_PetitionFieldFragment;
  }[];
}

export function FieldErrorDialog({
  message,
  fieldsWithIndices,
  header,
  confirm,
  showCancel,
  ...props
}: DialogProps<FieldErrorDialogProps>) {
  const focusRef = useRef(null);
  return (
    <ConfirmDialog
      initialFocusRef={focusRef}
      closeOnEsc={true}
      closeOnOverlayClick={true}
      header={
        header ?? (
          <Stack direction="row" spacing={2} align="center">
            <AlertCircleIcon role="presentation" />
            <Text>
              <FormattedMessage
                id="component.field-error-dialog.header"
                defaultMessage="Validation errors"
              />
            </Text>
          </Stack>
        )
      }
      body={
        <Stack>
          <Box>{message}</Box>
          <List paddingLeft={2}>
            {fieldsWithIndices.slice(0, 5).map(({ field, fieldIndex }) => (
              <ListItem as={Flex} key={field.id} alignItems="center">
                <PetitionFieldTypeIndicator
                  as="div"
                  type={field.type}
                  fieldIndex={fieldIndex}
                  isTooltipDisabled
                  flexShrink={0}
                />
                <Box marginLeft={2} flex="1" minWidth="0" isTruncated>
                  {field.title ? (
                    field.title
                  ) : (
                    <Text as="span" textStyle="hint">
                      <FormattedMessage
                        id="generic.untitled-field"
                        defaultMessage="Untitled field"
                      />
                    </Text>
                  )}
                </Box>
              </ListItem>
            ))}
            {fieldsWithIndices.length > 5 ? (
              <ListItem textAlign="center" fontSize="sm" fontStyle="italic">
                ...{" "}
                <FormattedMessage
                  id="generic.n-more"
                  defaultMessage="{count} more"
                  values={{ count: fieldsWithIndices.length - 5 }}
                />
              </ListItem>
            ) : null}
          </List>
        </Stack>
      }
      confirm={
        confirm ?? (
          <Button
            ref={focusRef}
            colorScheme="purple"
            minWidth={24}
            onClick={() => props.onResolve()}
          >
            <FormattedMessage id="component.error-dialog.ok-button" defaultMessage="OK" />
          </Button>
        )
      }
      cancel={showCancel ? undefined : <></>}
      {...props}
    />
  );
}

export function useFieldErrorDialog() {
  return useDialog(FieldErrorDialog);
}

FieldErrorDialog.fragments = {
  PetitionField: gql`
    fragment FieldErrorDialog_PetitionField on PetitionField {
      id
      title
      type
    }
  `,
};
