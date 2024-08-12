/** no-recipient */
import { Alert, AlertIcon, AlertProps, Box, HStack } from "@chakra-ui/react";
import { FormattedMessage, useIntl } from "react-intl";
import { SupportButton } from "../common/SupportButton";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionFieldType } from "@parallel/graphql/__types";
import { usePetitionFieldTypeLabel } from "@parallel/utils/petitionFields";

export interface RestrictedPetitionFieldAlertProps extends AlertProps {
  fieldType: PetitionFieldType;
}

export const RestrictedPetitionFieldAlert = chakraForwardRef<
  "div",
  RestrictedPetitionFieldAlertProps
>(function RestrictedPetitionFieldAlert({ fieldType, ...props }, ref) {
  const intl = useIntl();
  return (
    <Alert status="warning" rounded="md" paddingX={4} paddingY={2} ref={ref} {...props}>
      <AlertIcon color="yellow.500" />
      <HStack spacing={4} width="100%">
        <Box flex="1">
          <FormattedMessage
            id="component.petition-compose-field.update-plan-to-use-field"
            defaultMessage="Update your plan to use this field. "
          />
        </Box>
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
