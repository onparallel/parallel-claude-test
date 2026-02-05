import { Alert, AlertDescription, AlertIcon, AlertProps } from "@chakra-ui/react";
import { useHasPermission } from "@parallel/utils/useHasPermission";
import { FormattedMessage } from "react-intl";
import { Link } from "./Link";
import { Text } from "@parallel/components/ui";

export function RestrictedFeatureAlert({ children, ...props }: AlertProps) {
  const userCanListOrgUsers = useHasPermission("USERS:LIST_USERS");
  return (
    <Alert status="info" rounded="md" {...props}>
      <AlertIcon />
      <AlertDescription>
        <Text>
          {children ?? (
            <FormattedMessage
              id="component.restricted-feature-alert.restricted"
              defaultMessage="This feature is restricted."
            />
          )}
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
