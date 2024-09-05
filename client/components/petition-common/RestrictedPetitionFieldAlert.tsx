/** no-recipient */
import { Alert, AlertDescription, AlertIcon, AlertProps, HStack } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { usePetitionFieldTypeLabel } from "@parallel/utils/petitionFields";
import { FormattedMessage, useIntl } from "react-intl";
import { SupportButton } from "../common/SupportButton";

export interface RestrictedPetitionFieldAlertProps extends AlertProps {
  fieldType: PetitionFieldType;
}

export const RestrictedPetitionFieldAlert = chakraForwardRef<
  "div",
  RestrictedPetitionFieldAlertProps
>(function RestrictedPetitionFieldAlert({ fieldType, ...props }, ref) {
  const intl = useIntl();
  return (
    <Alert status="warning" rounded="md" paddingY={2} ref={ref} {...props}>
      <AlertIcon />
      <HStack flex={1}>
        <AlertDescription flex="1">
          <FormattedMessage
            id="component.petition-compose-field.update-plan-to-use-field"
            defaultMessage="Update your plan to use this field."
          />
        </AlertDescription>
        <SupportButton
          size="sm"
          fontSize="md"
          fontWeight={500}
          backgroundColor="white"
          message={intl.formatMessage(
            {
              id: "component.petition-compose-field.update-plan-to-use-field-contact-message",
              defaultMessage:
                "Hi, I would like more information about upgrade my plan to access the {fieldLabel} field.",
            },
            {
              fieldLabel: usePetitionFieldTypeLabel(fieldType),
            },
          )}
        >
          <FormattedMessage id="generic.contact" defaultMessage="Contact" />
        </SupportButton>
      </HStack>
    </Alert>
  );
});
