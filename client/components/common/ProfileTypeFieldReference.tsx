import { HStack, SystemStyleObject } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { ProfileTypeField } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { ProfileTypeFieldTypeIndicator } from "../organization/profiles/ProfileTypeFieldTypeIndicator";
import { LocalizableUserTextRender } from "./LocalizableUserTextRender";

export const ProfileTypeFieldReference = chakraComponent<
  "div",
  {
    field: Pick<ProfileTypeField, "name" | "type">;
    _icon?: SystemStyleObject;
  }
>(function ProfileTypeFieldReference({ ref, field, _icon, ...props }) {
  const intl = useIntl();
  return (
    <HStack ref={ref} {...props}>
      <ProfileTypeFieldTypeIndicator type={field.type} sx={_icon} />
      <OverflownText>
        <LocalizableUserTextRender
          value={field.name}
          default={intl.formatMessage({
            id: "generic.unnamed-profile-type-field",
            defaultMessage: "Unnamed property",
          })}
        />
      </OverflownText>
    </HStack>
  );
});
