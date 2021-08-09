import { Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { PetitionPermissionType } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export const PetitionPermissionTypeText = chakraForwardRef<
  "span",
  { type: PetitionPermissionType }
>(function PetitionPermissionTypeText({ type, ...props }, ref) {
  return (
    <Text ref={ref as any} as="span" {...props}>
      {type === "OWNER" ? (
        <FormattedMessage id="component.petition-permission-type.owner" defaultMessage="Owner" />
      ) : type === "WRITE" ? (
        <FormattedMessage id="component.petition-permission-type.write" defaultMessage="Editor" />
      ) : (
        <FormattedMessage id="component.petition-permission-type.read" defaultMessage="Reader" />
      )}
    </Text>
  );
});
