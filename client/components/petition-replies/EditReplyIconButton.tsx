import { Box, HStack } from "@chakra-ui/react";
import { EditSimpleIcon } from "@parallel/chakra/icons";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { useBuildUrlToPetitionSection } from "@parallel/utils/goToPetition";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import NextLink from "next/link";
import { PetitionRepliesPopoverField } from "./PetitionRepliesPopoverField";

export function EditReplyIconButton({
  petitionFieldId,
  parentReplyId,
  petitionId,
  fieldLogic,
  idSuffix,
}: {
  petitionFieldId: string;
  parentReplyId?: string;
  petitionId: string;
  fieldLogic: FieldLogicResult;
  idSuffix?: string;
}) {
  const intl = useIntl();
  const buildUrlToSection = useBuildUrlToPetitionSection();

  return (
    <HStack>
      <Box display={{ base: "block", lg: "none" }}>
        <IconButtonWithTooltip
          as={NextLink}
          href={buildUrlToSection("preview", {
            field: petitionFieldId,
            ...(parentReplyId ? { parentReply: parentReplyId } : {}),
            ...(idSuffix ? { sufix: idSuffix } : {}),
          })}
          opacity={0}
          className="edit-field-reply-button"
          variant="ghost"
          size="xs"
          icon={<EditSimpleIcon />}
          label={intl.formatMessage({
            id: "component.petition-replies-field.edit-field-reply",
            defaultMessage: "Edit reply",
          })}
        />
      </Box>
      <Box display={{ base: "none", lg: "block" }}>
        <PetitionRepliesPopoverField
          petitionFieldId={petitionFieldId}
          petitionId={petitionId}
          parentReplyId={parentReplyId}
          fieldLogic={fieldLogic}
        >
          <IconButtonWithTooltip
            opacity={0}
            className="edit-field-reply-button"
            variant="ghost"
            size="xs"
            icon={<EditSimpleIcon />}
            label={intl.formatMessage({
              id: "component.petition-replies-field.edit-field-reply",
              defaultMessage: "Edit reply",
            })}
          />
        </PetitionRepliesPopoverField>
      </Box>
    </HStack>
  );
}
