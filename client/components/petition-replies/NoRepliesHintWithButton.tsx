import { gql } from "@apollo/client";
import { Box, HStack, StackProps, Text } from "@chakra-ui/react";
import { EditSimpleIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  NoRepliesHintWithButton_PetitionFieldFragment,
  NoRepliesHintWithButton_PetitionFragment,
  NoRepliesHintWithButton_UserFragment,
} from "@parallel/graphql/__types";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/types";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { NakedLink } from "../common/Link";
import { PetitionRepliesPopoverField } from "./PetitionRepliesPopoverField";

export const NoRepliesHintWithButton = Object.assign(
  chakraForwardRef<
    "div",
    StackProps & {
      href: string;
      petition: NoRepliesHintWithButton_PetitionFragment;
      user: NoRepliesHintWithButton_UserFragment;
      field: NoRepliesHintWithButton_PetitionFieldFragment;
      fieldLogic: FieldLogicResult;
      parentReplyId?: string;
    }
  >(function NoRepliesHintWithButton(
    { href, petition, user, field, fieldLogic, parentReplyId, ...rest },
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
          <NakedLink href={href}>
            <IconButtonWithTooltip
              as="a"
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
          </NakedLink>
        </Box>
        <Box display={{ base: "none", lg: "block" }}>
          <PetitionRepliesPopoverField
            field={field}
            petition={petition}
            user={user}
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
  }),
  {
    fragments: {
      Petition: gql`
        fragment NoRepliesHintWithButton_Petition on Petition {
          id
          ...PetitionRepliesPopoverField_Petition
        }
        ${PetitionRepliesPopoverField.fragments.Petition}
      `,
      PetitionField: gql`
        fragment NoRepliesHintWithButton_PetitionField on PetitionField {
          id
          ...PetitionRepliesPopoverField_PetitionField
        }
        ${PetitionRepliesPopoverField.fragments.PetitionField}
      `,
      User: gql`
        fragment NoRepliesHintWithButton_User on User {
          ...PetitionRepliesPopoverField_User
        }
        ${PetitionRepliesPopoverField.fragments.User}
      `,
    },
  },
);
