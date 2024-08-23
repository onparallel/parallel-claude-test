import { Alert, AlertDescription, AlertIcon, Text } from "@chakra-ui/react";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { FormattedMessage } from "react-intl";
import { Link } from "./Link";

export function RestrictedFeatureAlert() {
  const userCanListOrgUsers = useHasPermission("USERS:LIST_USERS");
  return (
    <Alert status="info" rounded="md">
      <AlertIcon />
      <AlertDescription>
        <Text>
          <FormattedMessage
            id="component.restricted-feature-alert.restricted"
            defaultMessage="This feature is restricted."
          />
        </Text>
        <Text>
          <FormattedMessage
            id="component.restricted-feature-alert.contact-org-owner"
            defaultMessage="<a>Contact the owner</a> of your organization if you need to change these permissions."
            values={{
              a: (chunks: any) =>
                userCanListOrgUsers ? (
                  <Link href={`/app/organization/users`}>{chunks}</Link>
                ) : (
                  chunks
                ),
            }}
          />
        </Text>
      </AlertDescription>
    </Alert>
  );
}
