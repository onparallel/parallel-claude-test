import { gql } from "@apollo/client";
import { Center, ListItem, ListItemProps, Stack, Text } from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@parallel/chakra/icons";
import { SelectedSignerRow_PetitionSignerFragment } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

interface SelectedSignerRowProps extends ListItemProps {
  signer: Pick<SelectedSignerRow_PetitionSignerFragment, "email" | "firstName" | "lastName">;
  isMe?: boolean;
  isEditable?: boolean;
  onRemoveClick?: () => void;
  onEditClick?: () => void;
}

export function SelectedSignerRow({
  signer,
  isEditable,
  onRemoveClick: onRemove,
  onEditClick: onEdit,
  isMe,
  ...props
}: SelectedSignerRowProps) {
  const intl = useIntl();
  return (
    <ListItem
      minHeight={9}
      _hover={isEditable ? { backgroundColor: "gray.75" } : undefined}
      borderRadius="md"
      paddingX={2}
      paddingY={1}
      position="relative"
      paddingEnd={24}
      {...props}
    >
      <Text as="span">
        {signer.firstName} {signer.lastName}{" "}
        {signer.email ? (
          <Text as="span">
            {"<"}
            {signer.email}
            {">"}
          </Text>
        ) : (
          <Text as="span" textStyle="hint" fontSize="sm">
            <FormattedMessage
              id="component.selected-signer-row.embedded-signature-image"
              defaultMessage="Embedded signature image"
            />
          </Text>
        )}
        {isMe ? (
          <Text as="span" fontStyle="italic">
            {"("}
            <FormattedMessage id="generic.you" defaultMessage="You" />
            {")"}
          </Text>
        ) : null}
      </Text>
      {isEditable ? (
        <Center position="absolute" insetEnd={2} top={0} height="100%">
          <Stack direction="row" spacing={1}>
            <IconButtonWithTooltip
              variant="ghost"
              size="sm"
              label={intl.formatMessage({ id: "generic.edit", defaultMessage: "Edit" })}
              icon={<EditIcon />}
              _hover={{ backgroundColor: "gray.200" }}
              onClick={onEdit}
            />
            <IconButtonWithTooltip
              variant="ghost"
              size="sm"
              label={intl.formatMessage({ id: "generic.remove", defaultMessage: "Remove" })}
              marginStart={1}
              icon={<DeleteIcon />}
              _hover={{ backgroundColor: "gray.200" }}
              onClick={onRemove}
            />
          </Stack>
        </Center>
      ) : null}
    </ListItem>
  );
}

const _fragments = {
  PetitionSigner: gql`
    fragment SelectedSignerRow_PetitionSigner on PetitionSigner {
      ...Fragments_FullPetitionSigner
    }
  `,
};
