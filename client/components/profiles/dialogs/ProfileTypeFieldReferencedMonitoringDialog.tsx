import { gql } from "@apollo/client";

import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { Button, Text } from "@parallel/components/ui";
import {
  UserLocale,
  useProfileTypeFieldReferencedMonitoringDialog_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";

function ProfileTypeFieldReferencedMonitoringDialog({
  properties,
  profileTypeFieldIds,
  ...props
}: DialogProps<{
  properties: useProfileTypeFieldReferencedMonitoringDialog_ProfileTypeFieldFragment[];
  profileTypeFieldIds: string[];
}>) {
  const intl = useIntl();
  return (
    <ConfirmDialog
      header={
        <FormattedMessage
          id="component.profile-type-referenced-monitoring-dialog.header"
          defaultMessage="Property used for ongoing monitoring"
        />
      }
      body={
        <Text>
          {profileTypeFieldIds.length > 1 ? (
            <FormattedMessage
              id="component.profile-type-referenced-monitoring-dialog.body-multiple-selection"
              defaultMessage="Some selected property is used for monitoring in a {propertyType} property. To continue, please update the configuration first."
              values={{
                propertyType: intl.formatMessage({
                  id: "generic.profile-type-field-type-background-check",
                  defaultMessage: "Background check",
                }),
              }}
            />
          ) : (
            <FormattedMessage
              id="component.profile-type-referenced-monitoring-dialog.body"
              defaultMessage="This property is used for monitoring in {properties} {count, plural, =1 {property} other {properties}}. To continue, please update the {count, plural, =1 {configuration first} other {configuration of each property}}."
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
          colorPalette="primary"
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

const _fragments = {
  ProfileTypeField: gql`
    fragment useProfileTypeFieldReferencedMonitoringDialog_ProfileTypeField on ProfileTypeField {
      id
      name
    }
  `,
};

export function useProfileTypeFieldReferencedMonitoringDialog() {
  return useDialog(ProfileTypeFieldReferencedMonitoringDialog);
}
