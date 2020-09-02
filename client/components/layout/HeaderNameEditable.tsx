import { gql } from "@apollo/client";
import {
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Text,
  Tooltip,
} from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { HeaderNameEditable_PetitionBaseFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { PetitionState } from "@parallel/utils/usePetitionState";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export type HeaderNameEditableProps = ExtendChakra<{
  petition: HeaderNameEditable_PetitionBaseFragment;
  onNameChange: (value: string) => void;
  state: PetitionState;
}>;

export function HeaderNameEditable({
  petition,
  state,
  onNameChange,
  ...props
}: HeaderNameEditableProps) {
  const intl = useIntl();
  const [name, setName] = useState(petition.name ?? "");
  return (
    <Editable
      display="flex"
      fontSize="xl"
      value={name}
      onChange={setName}
      onSubmit={() => onNameChange(name)}
      onBlur={() => {
        setName(name.trim());
      }}
      {...props}
    >
      {({ isEditing }: { isEditing: boolean }) => (
        <>
          <Flex flex="1 1 auto" minWidth={0} padding={1}>
            <EditablePreview
              paddingY={1}
              paddingX={2}
              display="block"
              isTruncated
            />
            <EditableInput paddingY={1} paddingX={2} maxLength={255} />
          </Flex>
          {!isEditing && (
            <Flex
              alignItems="center"
              fontSize="sm"
              position="relative"
              display={{ base: "flex", md: "none", lg: "flex" }}
              top="3px"
            >
              {state === "SAVING" ? (
                <Text color="gray.500" fontSize="xs" fontStyle="italic">
                  <FormattedMessage
                    id="generic.saving-changes"
                    defaultMessage="Saving..."
                  />
                </Text>
              ) : state === "SAVED" ? (
                <Tooltip
                  label={intl.formatMessage(
                    {
                      id: "petition.header.last-saved-on",
                      defaultMessage: "Last saved on: {date}",
                    },
                    {
                      date: intl.formatDate(petition.updatedAt, FORMATS.FULL),
                    }
                  )}
                >
                  <Text color="gray.500" fontSize="xs" fontStyle="italic">
                    <FormattedMessage
                      id="generic.changes-saved"
                      defaultMessage="Saved"
                    />
                  </Text>
                </Tooltip>
              ) : state === "ERROR" ? (
                <Text color="red.500" fontSize="xs" fontStyle="italic">
                  <FormattedMessage
                    id="petition.status.error"
                    defaultMessage="Error"
                  />
                </Text>
              ) : null}
            </Flex>
          )}
        </>
      )}
    </Editable>
  );
}

HeaderNameEditable.fragments = {
  PetitionBase: gql`
    fragment HeaderNameEditable_PetitionBase on PetitionBase {
      name
      updatedAt
    }
  `,
};
