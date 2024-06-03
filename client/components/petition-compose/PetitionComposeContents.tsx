import { gql } from "@apollo/client";
import { Box, Center, LinkBox, LinkOverlay, Stack, Text } from "@chakra-ui/react";
import {
  PetitionComposeContents_PetitionFieldFragment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { memoWithFragments } from "@parallel/utils/memoWithFragments";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Divider } from "../common/Divider";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
import { CopyLiquidReferenceButton } from "../petition-common/CopyLiquidReferenceButton";
import { MoreLiquidReferencesButton } from "../petition-common/MoreLiquidReferencesButton";
import {
  AddAliasToFieldDialog,
  useAddAliasToFieldDialog,
} from "../petition-common/dialogs/AddAliasToFieldDialog";
import { ProfilesIcon } from "@parallel/chakra/icons";

export interface PetitionComposeContentsProps<
  T extends PetitionComposeContents_PetitionFieldFragment,
> {
  fieldsWithIndices: [field: T, fieldIndex: PetitionFieldIndex, childrenFieldIndices?: string[]][];
  onFieldClick: (fieldId: string) => void;
  onFieldEdit?: (fieldId: string, data: UpdatePetitionFieldInput) => Promise<void>;
  isReadOnly?: boolean;
}

export function PetitionComposeContents<T extends PetitionComposeContents_PetitionFieldFragment>({
  fieldsWithIndices,
  onFieldClick,
  onFieldEdit,
  isReadOnly,
}: PetitionComposeContentsProps<T>) {
  const handleFieldClick = useMemoFactory(
    (fieldId: string) => () => onFieldClick(fieldId),
    [onFieldClick],
  );
  return (
    <Stack as="ol" spacing={1} padding={4}>
      {fieldsWithIndices.map(([field, fieldIndex]) => {
        return (
          <PetitionComposeContentsItem
            isChildField={field.isChild}
            key={field.id}
            field={field}
            fieldIndex={fieldIndex}
            onFieldClick={handleFieldClick(field.id)}
            onFieldEdit={onFieldEdit}
            showAliasButtons={
              field.type === "HEADING" ||
              field.type === "DYNAMIC_SELECT" ||
              isFileTypeField(field.type)
                ? false
                : true
            }
            isReadOnly={isReadOnly}
          />
        );
      })}
    </Stack>
  );
}

PetitionComposeContents.fragments = {
  PetitionField: gql`
    fragment PetitionComposeContents_PetitionField on PetitionField {
      id
      title
      type
      options
      isInternal
      alias
      isChild
      isLinkedToProfileTypeField
      ...MoreLiquidReferencesButton_PetitionField
      ...CopyLiquidReferenceButton_PetitionField
      ...AddAliasToFieldDialog_PetitionField
    }
    ${MoreLiquidReferencesButton.fragments.PetitionField}
    ${CopyLiquidReferenceButton.fragments.PetitionField}
    ${AddAliasToFieldDialog.fragments.PetitionField}
  `,
};

interface PetitionComposeContentsItemProps<
  T extends PetitionComposeContents_PetitionFieldFragment,
> {
  field: T;
  fieldIndex: PetitionFieldIndex;
  onFieldClick: () => void;
  onFieldEdit?: (fieldId: string, data: UpdatePetitionFieldInput) => Promise<void>;
  showAliasButtons: boolean;
  isReadOnly?: boolean;
  isChildField?: boolean;
}

function _PetitionComposeContentsItem<T extends PetitionComposeContents_PetitionFieldFragment>({
  field,
  fieldIndex,
  onFieldClick,
  onFieldEdit,
  showAliasButtons,
  isReadOnly,
  isChildField,
}: PetitionComposeContentsItemProps<T>) {
  const showAddAliasToFieldDialog = useAddAliasToFieldDialog();
  const handleAddAliasToField = async () => {
    return await showAddAliasToFieldDialog({ field, fieldIndex, onFieldEdit });
  };
  return (
    <>
      {field.type === "HEADING" && field.options.hasPageBreak ? (
        <PetitionComposeContentsDivider>
          <FormattedMessage id="generic.page-break" defaultMessage="Page break" />
        </PetitionComposeContentsDivider>
      ) : null}
      <Box as="li" listStyleType="none" display="flex" position="relative" flex="none">
        <LinkBox
          tabIndex={0}
          as={Stack}
          direction="row"
          flex="1"
          alignItems="center"
          height="auto"
          paddingX={2}
          paddingY={1}
          paddingStart={field.type === "HEADING" ? 2 : isChildField ? 8 : 4}
          fontWeight={field.type === "HEADING" ? "medium" : "normal"}
          textAlign="left"
          onClick={onFieldClick}
          borderRadius="md"
          cursor="pointer"
          overflow="hidden"
          sx={{
            "&:hover, &:focus, &:focus-within": {
              background: "gray.100",
              ".alias-button": {
                display: "flex",
              },
            },
            ".alias-button": {
              display: "none",
              "&[data-active]": {
                display: "flex",
              },
            },
          }}
        >
          <LinkOverlay
            as="div"
            flex="1"
            minWidth={0}
            noOfLines={1}
            wordBreak="break-all"
            paddingY={1}
          >
            <Text as="span">{fieldIndex}. </Text>
            {field.title ? (
              field.title
            ) : (
              <Text as="span" flex="1" textStyle="hint">
                {field.type === "HEADING" ? (
                  <FormattedMessage id="generic.empty-heading" defaultMessage="Untitled heading" />
                ) : (
                  <FormattedMessage id="generic.untitled-field" defaultMessage="Untitled field" />
                )}
              </Text>
            )}
          </LinkOverlay>
          {field.isInternal ? <InternalFieldBadge className="internal-badge" /> : null}
          {field.isLinkedToProfileTypeField ? <ProfilesIcon boxSize={4} /> : null}
          {showAliasButtons ? (
            <>
              <CopyLiquidReferenceButton
                className="alias-button"
                field={field}
                background="white"
                boxShadow="md"
                _hover={{
                  boxShadow: "lg",
                }}
                isDisabled={!field.alias && isReadOnly}
                onAddAliasToField={handleAddAliasToField}
              />
              <MoreLiquidReferencesButton
                className="alias-button"
                field={field}
                background="white"
                boxShadow="md"
                _hover={{
                  boxShadow: "lg",
                }}
                isDisabled={!field.alias && isReadOnly}
                onAddAliasToField={handleAddAliasToField}
              />
            </>
          ) : null}
        </LinkBox>
      </Box>
    </>
  );
}

const PetitionComposeContentsItem = memoWithFragments(_PetitionComposeContentsItem, {
  field: PetitionComposeContents.fragments.PetitionField,
});

function PetitionComposeContentsDivider({
  children,
  isDashed,
}: {
  children: ReactNode;
  isDashed?: boolean;
}) {
  return (
    <Center position="relative" role="separator">
      <Divider
        position="absolute"
        top="50%"
        width="100%"
        borderStyle={isDashed ? "dashed" : "solid"}
      />
      <Text as="div" backgroundColor="white" paddingX={1} fontSize="xs" color="gray.500" zIndex="1">
        {children}
      </Text>
    </Center>
  );
}
