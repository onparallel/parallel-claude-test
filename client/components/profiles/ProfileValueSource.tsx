import { ProfileFieldPropertyValueSource } from "@parallel/graphql/__types";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useCallback } from "react";
import { FormattedMessage } from "react-intl";
import { Button, Text } from "../ui";

export function ProfileValueSource({
  source,
  externalSourceName,
  createdBy,
  petitionId,
  parentReplyId,
}: {
  source?: ProfileFieldPropertyValueSource | null;
  externalSourceName?: string | null;
  createdBy?: React.ReactNode;
  petitionId?: string | null;
  parentReplyId?: string | null;
}) {
  const goToPetition = useGoToPetition();
  const handleClick = useCallback(() => {
    if (parentReplyId && petitionId) {
      goToPetition(petitionId, "replies", { query: { parentReply: parentReplyId } });
    }
  }, [parentReplyId, petitionId]);

  return source === "EXTERNAL" ? (
    externalSourceName ? (
      <FormattedMessage
        id="component.profile-value-source.external-with-external-source-name"
        defaultMessage="Imported from {externalSourceName} by {createdBy}"
        values={{ externalSourceName, createdBy }}
      />
    ) : (
      <FormattedMessage
        id="component.profile-value-source.external"
        defaultMessage="Imported from external source by {createdBy}"
        values={{ createdBy }}
      />
    )
  ) : source === "MANUAL" ? (
    <FormattedMessage
      id="component.profile-value-source.manual"
      defaultMessage="Manually edited by {createdBy}"
      values={{ createdBy }}
    />
  ) : source === "EXCEL_IMPORT" ? (
    <FormattedMessage
      id="component.profile-value-source.excel-import"
      defaultMessage="Manually imported by {createdBy}"
      values={{ createdBy }}
    />
  ) : source === "PARALLEL_API" ? (
    <FormattedMessage
      id="component.profile-value-source.parallel-api"
      defaultMessage="Edited by API by {createdBy}"
      values={{ createdBy }}
    />
  ) : source === "PARALLEL_MONITORING" ? (
    <FormattedMessage
      id="component.profile-value-source.parallel-monitoring"
      defaultMessage="Automatically edited by Parallel"
    />
  ) : source === "PETITION_FIELD_REPLY" ? (
    <FormattedMessage
      id="component.profile-value-source.petition-field-reply"
      defaultMessage="Imported from {parallelLink} by {createdBy}"
      values={{
        parallelLink: (
          <Button as="a" variant="link" onClick={handleClick}>
            {"parallel"}
          </Button>
        ),
        createdBy,
      }}
    />
  ) : source === "PROFILE_SYNC" ? (
    <FormattedMessage
      id="component.profile-value-source.profile-sync"
      defaultMessage="Imported from {externalSourceName}"
      values={{ externalSourceName }}
    />
  ) : (
    <Text textStyle="hint">{"-"}</Text>
  );
}
