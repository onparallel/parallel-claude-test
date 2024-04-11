import { gql } from "@apollo/client";
import { Center, ListItem, ListItemProps, Stack, Text } from "@chakra-ui/react";
import { DeleteIcon, EditIcon } from "@parallel/chakra/icons";
import { SelectedSignerRow_PetitionSignerFragment } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

interface SelectedSignerRowProps extends ListItemProps {
  signer: SelectedSignerRow_PetitionSignerFragment;
  isEditable?: boolean;
  onRemoveClick?: () => void;
  onEditClick?: () => void;
}

export function SelectedSignerRow({
  signer,
  isEditable,
  onRemoveClick: onRemove,
  onEditClick: onEdit,
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
        {signer.firstName} {signer.lastName} {"<"}
        {signer.email}
        {">"}
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

SelectedSignerRow.fragments = {
  PetitionSigner: gql`
    fragment SelectedSignerRow_PetitionSigner on PetitionSigner {
      firstName
      lastName
      email
    }
  `,
};
