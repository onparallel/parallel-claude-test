import { Button, FormControl, FormLabel, Text } from "@chakra-ui/react";
import { Select } from "@parallel/chakra/components";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { OrganizationStatus } from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";

interface OrganizationStatusDialogData {
  status: OrganizationStatus;
}

function OrganizationStatusDialog({
  status,
  ...props
}: DialogProps<{ status: OrganizationStatus }, OrganizationStatusDialogData>) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<OrganizationStatusDialogData>({
    mode: "onSubmit",
    defaultValues: {
      status,
    },
  });

  const statusRef = useRef<HTMLInputElement>(null);
  const statusRegisterProps = useRegisterWithRef(statusRef, register, "status", {
    required: true,
  });

  const organizationStatus = ["ACTIVE", "CHURNED", "DEMO", "DEV"] as OrganizationStatus[];

  return (
    <ConfirmDialog
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => props.onResolve(data)),
        },
      }}
      initialFocusRef={statusRef}
      header={
        <Text>
          <FormattedMessage
            id="component.organization-status-dialog.update-organization-status"
            defaultMessage="Update organization status"
          />
        </Text>
      }
      body={
        <FormControl id="status" isInvalid={!!errors.status}>
          <FormLabel>
            <FormattedMessage
              id="component.organization-status-dialog.organization-status"
              defaultMessage="Organization status"
            />
          </FormLabel>
          <Select {...statusRegisterProps}>
            {organizationStatus.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </FormControl>
      }
      confirm={
        <Button type="submit" colorScheme="primary" variant="solid">
          <FormattedMessage id="generic.save" defaultMessage="Save" />
        </Button>
      }
      {...props}
    />
  );
}

export function useOrganizationStatusDialog() {
  return useDialog(OrganizationStatusDialog);
}
