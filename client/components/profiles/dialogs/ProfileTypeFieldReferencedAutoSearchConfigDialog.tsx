import { gql } from "@apollo/client";
import { Button, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  UserLocale,
  useProfileTypeFieldReferencedAutoSearchConfigDialog_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";

function ProfileTypeFieldReferencedAutoSearchConfigDialog({
  properties,
  profileTypeFieldIds,
  ...props
}: DialogProps<{
  properties: useProfileTypeFieldReferencedAutoSearchConfigDialog_ProfileTypeFieldFragment[];
  profileTypeFieldIds: string[];
}>) {
  const intl = useIntl();
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.profile-type-referenced-auto-search-config-dialog.header"
          defaultMessage="Property used in auto search configuration"
        />
      }
      body={
        <Text>
          {profileTypeFieldIds.length > 1 ? (
            <FormattedMessage
              id="component.profile-type-referenced-auto-search-config-dialog.body-multiple-selection"
              defaultMessage="Some selected property is used in automate search configuration in a {propertyType} property. To continue, please update the configuration first."
              values={{
                propertyType: intl.formatMessage({
                  id: "generic.profile-type-field-type-background-check",
                  defaultMessage: "Background check",
                }),
              }}
            />
          ) : (
            <FormattedMessage
              id="component.profile-type-referenced-auto-search-config-dialog.body"
              defaultMessage="This property is used in automate search configuration in {properties} {count, plural, =1 {property} other {properties}}. To continue, please update the {count, plural, =1 {configuration first} other {configuration of each property}}."
              values={{
                properties: intl.formatList(
                  properties.map((s, i) => <i key={i}>{s.name[intl.locale as UserLocale]}</i>),
                ),
                count: properties.length,
              }}
            />
          )}
        </Text>
      }
      cancel={<></>}
      confirm={
        <Button
          colorScheme="primary"
          onClick={() => {
            props.onResolve();
          }}
        >
          <FormattedMessage id="generic.ok" defaultMessage="OK" />
        </Button>
      }
      {...props}
    />
  );
}

useProfileTypeFieldReferencedAutoSearchConfigDialog.fragments = {
  ProfileTypeField: gql`
    fragment useProfileTypeFieldReferencedAutoSearchConfigDialog_ProfileTypeField on ProfileTypeField {
      id
      name
    }
  `,
};

export function useProfileTypeFieldReferencedAutoSearchConfigDialog() {
  return useDialog(ProfileTypeFieldReferencedAutoSearchConfigDialog);
}
