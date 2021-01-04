import { Spinner, Tooltip } from "@chakra-ui/react";
import { CloudOkIcon } from "@parallel/chakra/icons";
import { RecipientViewPetitionFieldReply_PublicPetitionFieldReplyFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useIntl } from "react-intl";

export function RecipientViewPetitionFieldReplySavingIndicator({
  reply,
  isSaving,
}: {
  reply?: RecipientViewPetitionFieldReply_PublicPetitionFieldReplyFragment;
  isSaving: boolean;
}) {
  const intl = useIntl();
  return isSaving ? (
    <Tooltip
      label={intl.formatMessage({
        id: "generic.saving-changes",
        defaultMessage: "Saving...",
      })}
    >
      <Spinner size="xs" thickness="1.5px" />
    </Tooltip>
  ) : reply ? (
    <Tooltip
      label={intl.formatMessage(
        {
          id: "component.recipient-view-petition-field-reply.reply-saved-on",
          defaultMessage: "Reply saved on {date}",
        },
        { date: intl.formatDate(reply.updatedAt, FORMATS.LLL) }
      )}
    >
      <CloudOkIcon color="green.600" />
    </Tooltip>
  ) : null;
}
