import { PetitionPermissionType } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
export function UserPermissionType({ type }: { type: PetitionPermissionType }) {
  switch (type) {
    case "OWNER":
      return (
        <FormattedMessage id="petition-sharing.owner" defaultMessage="Owner" />
      );
    case "WRITE":
      return (
        <FormattedMessage id="petition-sharing.write" defaultMessage="Editor" />
      );
    case "READ":
      return (
        <FormattedMessage id="petition-sharing.read" defaultMessage="Reader" />
      );
  }
}
