import { gql } from "@apollo/client";
import { Box, Button, HStack, List, ListItem, Stack } from "@chakra-ui/react";
import { AlertCircleIcon } from "@parallel/chakra/icons";
import {
  ConfirmDialog,
  ConfirmDialogProps,
} from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { PetitionFieldReference } from "@parallel/components/common/PetitionFieldReference";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import { FieldErrorDialog_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { ReactNode, useRef } from "react";
import { FormattedMessage } from "react-intl";
import { OverflownText } from "../OverflownText";
import { Text } from "@parallel/components/ui";

export interface FieldErrorDialogProps
  extends Omit<ConfirmDialogProps<void>, "body" | "header" | "confirm">,
    Partial<Pick<ConfirmDialogProps<void>, "header" | "cancel">> {
  message: ReactNode;
  footer?: ReactNode;
  showCancel?: boolean;
  confirmText?: ReactNode;
  fieldsWithIndices: (
    | [field: FieldErrorDialog_PetitionFieldFragment, fieldIndex: PetitionFieldIndex]
    | { field: FieldErrorDialog_PetitionFieldFragment; fieldIndex: PetitionFieldIndex }
  )[];
}

export function FieldErrorDialog({
  message,
  footer,
  fieldsWithIndices,
  header,
  confirmText,
  showCancel,
  cancel,
  ...props
}: DialogProps<FieldErrorDialogProps>) {
  const focusRef = useRef<HTMLButtonElement>(null);
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
          <List>
            {fieldsWithIndices.slice(0, 5).map((fieldWithIndex) => {
              const [field, fieldIndex] = Array.isArray(fieldWithIndex)
                ? fieldWithIndex
                : ([fieldWithIndex.field, fieldWithIndex.fieldIndex] as const);
              return (
                <ListItem as={HStack} key={field.id}>
                  <PetitionFieldTypeIndicator
                    as="div"
                    type={field.type}
                    fieldIndex={fieldIndex}
                    isTooltipDisabled
                    flexShrink={0}
                  />

                  <OverflownText>
                    <PetitionFieldReference field={field} as="span" />
                  </OverflownText>
                </ListItem>
              );
            })}
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
          <Box>{footer}</Box>
        </Stack>
      }
      confirm={
        <Button
          ref={focusRef}
          colorScheme="primary"
          minWidth={24}
          onClick={() => props.onResolve()}
        >
          {confirmText ?? <FormattedMessage id="generic.ok" defaultMessage="OK" />}
        </Button>
      }
      cancel={showCancel || cancel ? cancel : <></>}
      {...props}
    />
  );
}

export function useFieldErrorDialog() {
  return useDialog(FieldErrorDialog);
}

const _fragments = {
  PetitionField: gql`
    fragment FieldErrorDialog_PetitionField on PetitionField {
      id
      title
      type
    }
  `,
};
