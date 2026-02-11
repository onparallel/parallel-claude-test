import { chakraComponent } from "@parallel/chakra/utils";
import { PetitionPermissionType } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

export const PetitionPermissionTypeText = chakraComponent<
  "span",
  { type: PetitionPermissionType }
>(function PetitionPermissionTypeText({ ref, type, ...props }) {
  return (
    <Text ref={ref as any} as="span" {...props}>
      {type === "OWNER" ? (
        <FormattedMessage id="generic.petition-permission-type-owner" defaultMessage="Owner" />
      ) : type === "WRITE" ? (
        <FormattedMessage id="generic.petition-permission-type-write" defaultMessage="Editor" />
      ) : (
        <FormattedMessage id="generic.petition-permission-type-read" defaultMessage="Reader" />
      )}
    </Text>
  );
});
