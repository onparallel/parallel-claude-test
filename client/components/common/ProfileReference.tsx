import { gql } from "@apollo/client";
import { HTMLChakraProps, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileReference_ProfileFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { isNonNullish } from "remeda";
import { Link } from "./Link";

interface ProfileReferenceProps {
  profile?: ProfileReference_ProfileFragment | null;
  asLink?: boolean;
  _notDeleted?: HTMLChakraProps<any>["_active"];
  showNameEvenIfDeleted?: boolean;
}

export const ProfileReference = Object.assign(
  chakraForwardRef<"span" | "a", ProfileReferenceProps>(function ProfileReference(
    { profile, asLink, _notDeleted, showNameEvenIfDeleted, ...props },
    ref,
  ) {
    if (
      isNonNullish(profile) &&
      (showNameEvenIfDeleted || ["OPEN", "CLOSED"].includes(profile.status))
    ) {
      const Content = (
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
          {Content}
        </Link>
      ) : (
        <Text ref={ref} as="span" {...(props as any)}>
          {Content}
        </Text>
      );
    } else {
      return (
        <Text ref={ref} textStyle="hint" as="span" {...(props as any)}>
          <FormattedMessage id="generic.deleted-profile" defaultMessage="Deleted profile" />
        </Text>
      );
    }
  }),
  {
    fragments: {
      Profile: gql`
        fragment ProfileReference_Profile on Profile {
          id
          localizableName
          status
        }
      `,
    },
  },
);
