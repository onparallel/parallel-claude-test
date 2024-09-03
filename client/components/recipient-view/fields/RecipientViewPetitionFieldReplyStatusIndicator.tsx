import { Spinner } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { CheckIcon, CloseIcon, CloudOkIcon } from "@parallel/chakra/icons";
import { FORMATS } from "@parallel/utils/dates";
import { useIntl } from "react-intl";
import { RecipientViewPetitionFieldLayout_PetitionFieldReplySelection } from "./RecipientViewPetitionFieldLayout";

export function RecipientViewPetitionFieldReplyStatusIndicator({
  reply,
  isSaving,
  showSavedIcon = true,
}: {
  reply?: RecipientViewPetitionFieldLayout_PetitionFieldReplySelection;
  isSaving: boolean;
  showSavedIcon?: boolean;
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
  ) : reply?.status === "APPROVED" ? (
    <Tooltip
      label={intl.formatMessage({
        id: "component.recipient-view-petition-field-reply.approved-reply",
        defaultMessage: "This reply has been approved",
      })}
    >
      <CheckIcon color="green.600" />
    </Tooltip>
  ) : reply?.status === "REJECTED" ? (
    <Tooltip
      label={intl.formatMessage({
        id: "component.recipient-view-petition-field-reply.rejected-reply",
        defaultMessage: "This reply has been rejected",
      })}
    >
      <CloseIcon fontSize="14px" color="red.500" />
    </Tooltip>
  ) : reply && showSavedIcon ? (
    <Tooltip
      label={intl.formatMessage(
        {
          id: "component.recipient-view-petition-field-reply.reply-saved-on",
          defaultMessage: "Reply saved on {date}",
        },
        { date: intl.formatDate(reply.updatedAt, FORMATS.LLL) },
      )}
    >
      <CloudOkIcon fontSize="18px" color="green.600" role="presentation" />
    </Tooltip>
  ) : null;
}
