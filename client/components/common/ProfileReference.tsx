import { gql } from "@apollo/client";
import { HTMLChakraProps, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ProfileLink_ProfileFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { Link } from "./Link";

interface ProfileReferenceProps {
  profile?: ProfileLink_ProfileFragment | null;
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
      isDefined(profile) &&
      (showNameEvenIfDeleted || ["OPEN", "CLOSED"].includes(profile.status))
    ) {
      const content = profile.name || (
        <Text textStyle="hint" as="span">
          <FormattedMessage id="generic.unnamed-profile" defaultMessage="Unnamed profile" />
        </Text>
      );
      return asLink ? (
        <Link ref={ref as any} href={`/app/profiles/${profile.id}`} sx={_notDeleted} {...props}>
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
  }),
  {
    fragments: {
      Profile: gql`
        fragment ProfileLink_Profile on Profile {
          id
          name
          status
        }
      `,
    },
  },
);
