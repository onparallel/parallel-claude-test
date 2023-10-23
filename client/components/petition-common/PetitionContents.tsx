import { gql } from "@apollo/client";
import {
  Box,
  BoxProps,
  Button,
  Center,
  Flex,
  LinkBox,
  LinkOverlay,
  Stack,
  Text,
} from "@chakra-ui/react";
import { EyeOffIcon } from "@parallel/chakra/icons";
import {
  PetitionContents_PetitionFieldFragment,
  PetitionSignatureStatusFilter,
  SignatureOrgIntegrationEnvironment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { FieldLogicResult } from "@parallel/utils/fieldLogic/useFieldLogic";
import { PetitionFieldFilter, filterPetitionFields } from "@parallel/utils/filterPetitionFields";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { memoWithFragments } from "@parallel/utils/memoWithFragments";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { ComponentType, ReactNode, createElement } from "react";
import { FormattedMessage } from "react-intl";
import { Divider } from "../common/Divider";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
import { PetitionSignatureStatusIcon } from "../common/PetitionSignatureStatusIcon";
import { CopyLiquidReferenceButton } from "./CopyLiquidReferenceButton";
import { MoreLiquidReferencesButton } from "./MoreLiquidReferencesButton";
import { AddAliasToFieldDialog, useAddAliasToFieldDialog } from "./dialogs/AddAliasToFieldDialog";
import { isDefined } from "remeda";

interface PetitionContentsFieldIndicatorsProps<T extends PetitionContents_PetitionFieldFragment> {
  field: T;
}

export interface PetitionContentsProps<T extends PetitionContents_PetitionFieldFragment> {
  fieldsWithIndices: [field: T, fieldIndex: PetitionFieldIndex, childrenFieldIndices?: string[]][];
  showAliasButtons: boolean;
  fieldLogic?: FieldLogicResult[];
  onFieldClick: (fieldId: string) => void;
  onFieldEdit?: (fieldId: string, data: UpdatePetitionFieldInput) => Promise<void>;
  filter?: PetitionFieldFilter;
  fieldIndicators?: ComponentType<PetitionContentsFieldIndicatorsProps<T>>;
  signatureStatus?: PetitionSignatureStatusFilter;
  signatureEnvironment?: SignatureOrgIntegrationEnvironment | null;
  onSignatureStatusClick?: () => void;
  isReadOnly?: boolean;
}

export function PetitionContents<T extends PetitionContents_PetitionFieldFragment>({
  fieldsWithIndices,
  filter,
  showAliasButtons,
  fieldLogic,
  onFieldClick,
  onFieldEdit,
  fieldIndicators,
  signatureStatus,
  signatureEnvironment,
  onSignatureStatusClick,
  isReadOnly,
}: PetitionContentsProps<T>) {
  const handleFieldClick = useMemoFactory(
    (fieldId: string) => () => onFieldClick(fieldId),
    [onFieldClick],
  );
  return (
    <Stack as="ol" spacing={1} padding={4}>
      {signatureStatus ? (
        <SignatureStatusInfo
          status={signatureStatus}
          environment={signatureEnvironment}
          onClick={onSignatureStatusClick}
        />
      ) : null}
      {filterPetitionFields(fieldsWithIndices, fieldLogic, filter).map((x, index) => {
        if (x.type === "FIELD") {
          return (
            <PetitionContentsItem
              isChildField={isDefined(x.field.parent)}
              key={x.field.id}
              field={x.field}
              isVisible={true}
              fieldIndex={x.fieldIndex}
              onFieldClick={handleFieldClick(x.field.id)}
              onFieldEdit={onFieldEdit}
              fieldIndicators={fieldIndicators}
              showAliasButtons={
                x.field.type === "HEADING" ||
                x.field.type === "DYNAMIC_SELECT" ||
                isFileTypeField(x.field.type)
                  ? false
                  : showAliasButtons
              }
              isReadOnly={isReadOnly}
            />
          );
        }

        return (
          <PetitionContentsDivider key={index} isDashed>
            <Flex alignItems="center">
              <EyeOffIcon marginRight={1} />
              <FormattedMessage
                id="component.petition-contents.hidden-fields-divider"
                defaultMessage="{count, plural, =1 {1 field is} other {# fields are}} not applicable"
                values={{ count: x.count }}
              />
            </Flex>
          </PetitionContentsDivider>
        );
      })}
    </Stack>
  );
}

function SignatureStatusInfo({
  status,
  environment,
  ...props
}: BoxProps & {
  status: PetitionSignatureStatusFilter;
  environment?: SignatureOrgIntegrationEnvironment | null;
}) {
  return (
    <Box as="li" listStyleType="none" display="flex" {...props}>
      <Stack
        as={Button}
        direction="row"
        flex="1"
        variant="ghost"
        justifyContent="space-between"
        height="auto"
        padding={2}
      >
        <Text fontWeight="bold">
          <FormattedMessage id="generic.e-signature" defaultMessage="eSignature" />
        </Text>
        <PetitionSignatureStatusIcon
          status={status}
          environment={environment}
          tooltipPlacement="bottom-end"
        />
      </Stack>
    </Box>
  );
}

PetitionContents.fragments = {
  PetitionField: gql`
    fragment PetitionContents_PetitionField on PetitionField {
      id
      title
      type
      options
      isInternal
      alias
      parent {
        id
      }
      ...filterPetitionFields_PetitionField
      ...MoreLiquidReferencesButton_PetitionField
      ...CopyLiquidReferenceButton_PetitionField
      ...AddAliasToFieldDialog_PetitionField
    }
    ${filterPetitionFields.fragments.PetitionField}
    ${MoreLiquidReferencesButton.fragments.PetitionField}
    ${CopyLiquidReferenceButton.fragments.PetitionField}
    ${AddAliasToFieldDialog.fragments.PetitionField}
  `,
};

interface PetitionContentsItemProps<T extends PetitionContents_PetitionFieldFragment> {
  field: T;
  fieldIndex: PetitionFieldIndex;
  isVisible: boolean;
  onFieldClick: () => void;
  onFieldEdit?: (fieldId: string, data: UpdatePetitionFieldInput) => Promise<void>;
  showAliasButtons: boolean;
  fieldIndicators?: ComponentType<PetitionContentsFieldIndicatorsProps<T>>;
  isReadOnly?: boolean;
  isChildField?: boolean;
}

function _PetitionContentsItem<T extends PetitionContents_PetitionFieldFragment>({
  field,
  isVisible,
  fieldIndex,
  onFieldClick,
  onFieldEdit,
  showAliasButtons,
  fieldIndicators,
  isReadOnly,
  isChildField,
}: PetitionContentsItemProps<T>) {
  const showAddAliasToFieldDialog = useAddAliasToFieldDialog();
  const handleAddAliasToField = async () => {
    return await showAddAliasToFieldDialog({ field, fieldIndex, onFieldEdit });
  };
  return (
    <>
      {field.type === "HEADING" && field.options.hasPageBreak ? (
        <PetitionContentsDivider>
          <FormattedMessage id="generic.page-break" defaultMessage="Page break" />
        </PetitionContentsDivider>
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
          paddingLeft={field.type === "HEADING" ? 2 : isChildField ? 8 : 4}
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
            opacity={isVisible ? 1 : 0.6}
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
          {fieldIndicators ? createElement(fieldIndicators, { field }) : null}
          {field.isInternal ? <InternalFieldBadge className="internal-badge" /> : null}
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

const PetitionContentsItem = memoWithFragments(_PetitionContentsItem, {
  field: PetitionContents.fragments.PetitionField,
});

function PetitionContentsDivider({
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
