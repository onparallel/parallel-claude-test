import { gql } from "@apollo/client";
import { HTMLChakraProps } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileReference_ProfileFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { Link } from "./Link";
import { Text } from "@parallel/components/ui";

interface ProfileReferenceProps {
  profile?: ProfileReference_ProfileFragment | null;
  asLink?: boolean;
  target?: HTMLChakraProps<any>["target"];
  _notDeleted?: HTMLChakraProps<any>["_active"];
  showNameEvenIfDeleted?: boolean;
}

export const ProfileReference = chakraComponent<"span" | "a", ProfileReferenceProps>(
  function ProfileReference({
    ref,
    profile,
    asLink,
    _notDeleted,
    showNameEvenIfDeleted,
    ...props
  }) {
    if (
      isNonNullish(profile) &&
      (showNameEvenIfDeleted || ["OPEN", "CLOSED"].includes(profile.status))
    ) {
      const content = (
        <LocalizableUserTextRender
          value={profile.localizableName}
          default={
            <Text textStyle="hint" as="span">
              <FormattedMessage id="generic.unnamed-profile" defaultMessage="Unnamed profile" />
            </Text>
          }
        />
      );

      return asLink ? (
        <Link
          ref={ref as any}
          href={`/app/profiles/${profile.id}/general`}
          sx={_notDeleted}
          {...props}
        >
          {content}
        </Link>
      ) : (
        <Text ref={ref} as="span" {...(props as any)}>
          {content}
        </Text>
      );
    } else {
      return (
        <Text ref={ref} textStyle="hint" as="span" {...(props as any)}>
          <FormattedMessage id="generic.deleted-profile" defaultMessage="Deleted profile" />
        </Text>
      );
    }
  },
);

const _fragments = {
  Profile: gql`
    fragment ProfileReference_Profile on Profile {
      id
      localizableName
      status
    }
  `,
};
