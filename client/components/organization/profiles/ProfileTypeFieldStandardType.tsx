import { chakraForwardRef } from "@parallel/chakra/utils";
import { ProfileTypeStandardType } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { Text } from "@parallel/components/ui";

export const ProfileTypeFieldStandardType = chakraForwardRef<
  "span",
  { type: ProfileTypeStandardType }
>(function ProfileTypeFieldStandardType({ type, ...props }, ref) {
  const intl = useIntl();

  const TYPES = {
    CONTRACT: intl.formatMessage({
      id: "component.profile-type-field-standard-type.contract",
      defaultMessage: "Contract",
    }),
    INDIVIDUAL: intl.formatMessage({
      id: "component.profile-type-field-standard-type.individual",
      defaultMessage: "Individual",
    }),
    LEGAL_ENTITY: intl.formatMessage({
      id: "component.profile-type-field-standard-type.legal-entity",
      defaultMessage: "Legal entity",
    }),
  } as Record<ProfileTypeStandardType, string>;

  return (
    <Text ref={ref} as="span" {...props}>
      {TYPES[type]}
    </Text>
  );
});
