import { Box, HStack, StackProps } from "@chakra-ui/react";
import { EditSimpleIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import NextLink from "next/link";
import { PetitionRepliesPopoverField } from "./PetitionRepliesPopoverField";
import { Text } from "@parallel/components/ui";

export const NoRepliesHintWithButton = chakraForwardRef<
  "div",
  StackProps & {
    href: string;
    petitionId: string;
    petitionFieldId: string;
    fieldLogic: FieldLogicResult;
    parentReplyId?: string;
  }
>(function NoRepliesHintWithButton(
  { href, petitionId, petitionFieldId, fieldLogic, parentReplyId, ...rest },
  ref,
) {
  const intl = useIntl();
  return (
    <HStack
      ref={ref}
      {...rest}
      sx={{
        "&:focus-within, &:hover": {
          ".edit-field-reply-button": {
            opacity: 1,
          },
        },
      }}
    >
      <Text textStyle="hint">
        <FormattedMessage
          id="component.petition-replies-field.no-replies"
          defaultMessage="There are no replies to this field yet"
        />
      </Text>

      <Box display={{ base: "block", lg: "none" }}>
        <IconButtonWithTooltip
          as={NextLink}
          href={href}
          opacity={0}
          className="edit-field-reply-button"
          variant="ghost"
          size="xs"
          icon={<EditSimpleIcon />}
          label={intl.formatMessage({
            id: "component.petition-replies-field.add-field-reply",
            defaultMessage: "Add reply",
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
              id: "component.petition-replies-field.add-field-reply",
              defaultMessage: "Add reply",
            })}
          />
        </PetitionRepliesPopoverField>
      </Box>
    </HStack>
  );
});
