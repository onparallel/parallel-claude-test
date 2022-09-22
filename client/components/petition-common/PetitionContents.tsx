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
  SignatureOrgIntegrationEnvironment,
  UpdatePetitionFieldInput,
} from "@parallel/graphql/__types";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import { filterPetitionFields, PetitionFieldFilter } from "@parallel/utils/filterPetitionFields";
import { PetitionSignatureStatus } from "@parallel/utils/getPetitionSignatureStatus";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { ComponentType, createElement, memo, MouseEvent, ReactNode } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Divider } from "../common/Divider";
import { InternalFieldBadge } from "../common/InternalFieldBadge";
import { PetitionSignatureStatusIcon } from "../common/PetitionSignatureStatusIcon";
import { AliasOptionsMenu } from "./AliasOptionsMenu";
import { CopyAliasIconButton, useBuildAliasInterpolation } from "./CopyAliasIconButton";
import { useCreateReferenceDialog } from "./dialogs/CreateReferenceDialog";

interface PetitionContentsFieldIndicatorsProps<T extends PetitionContents_PetitionFieldFragment> {
  field: T;
}

export interface PetitionContentsProps<T extends PetitionContents_PetitionFieldFragment> {
  fields: T[];
  fieldIndices: PetitionFieldIndex[];
  showAliasButtons: boolean;
  fieldVisibility?: boolean[];
  onFieldClick: (fieldId: string) => void;
  onFieldEdit?: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  filter?: PetitionFieldFilter;
  fieldIndicators?: ComponentType<PetitionContentsFieldIndicatorsProps<T>>;
  signatureStatus?: PetitionSignatureStatus;
  signatureEnvironment?: SignatureOrgIntegrationEnvironment | null;
  onSignatureStatusClick?: () => void;
  isReadOnly?: boolean;
}

export function PetitionContents<T extends PetitionContents_PetitionFieldFragment>({
  fields,
  filter,
  fieldIndices,
  showAliasButtons,
  fieldVisibility,
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
    [onFieldClick]
  );
  return (
    <Stack as="ol" spacing={1} padding={4}>
      {filterPetitionFields(fields, fieldIndices, fieldVisibility ?? [], filter).map((x, index) =>
        x.type === "FIELD" ? (
          <PetitionContentsItem
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
        ) : (
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
        )
      )}
      {signatureStatus ? (
        <SignatureStatusInfo
          status={signatureStatus}
          environment={signatureEnvironment}
          onClick={onSignatureStatusClick}
        />
      ) : null}
    </Stack>
  );
}

function SignatureStatusInfo({
  status,
  environment,
  ...props
}: BoxProps & {
  status: PetitionSignatureStatus;
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
      ...filterPetitionFields_PetitionField
      ...AliasOptionsMenu_PetitionField
      ...CopyAliasIconButton_PetitionField
    }
    ${filterPetitionFields.fragments.PetitionField}
    ${AliasOptionsMenu.fragments.PetitionField}
    ${CopyAliasIconButton.fragments.PetitionField}
  `,
};

interface PetitionContentsItemProps<T extends PetitionContents_PetitionFieldFragment> {
  field: T;
  fieldIndex: PetitionFieldIndex;
  isVisible: boolean;
  onFieldClick: () => void;
  onFieldEdit?: (fieldId: string, data: UpdatePetitionFieldInput) => void;
  showAliasButtons: boolean;
  fieldIndicators?: ComponentType<PetitionContentsFieldIndicatorsProps<T>>;
  isReadOnly?: boolean;
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
}: PetitionContentsItemProps<T>) {
  const intl = useIntl();

  const copyReference = useClipboardWithToast({
    text: intl.formatMessage({
      id: "component.petition-contents.reference-copied-alert",
      defaultMessage: "Reference copied to clipboard",
    }),
  });

  const showCreateReferenceDialog = useCreateReferenceDialog();
  const buildAliasInterpolation = useBuildAliasInterpolation(field);
  const handleAddReferenceClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    try {
      const alias = await showCreateReferenceDialog({ field, fieldIndex, onFieldEdit });
      copyReference({ value: buildAliasInterpolation(alias) });
    } catch {}
  };

  const defaultStyles = { background: "gray.100" };
  const withAliasButtonsStyles = {
    ".alias-button": { display: "flex" },
    ".internal-badge": { display: "none" },
    background: "gray.100",
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
          paddingLeft={field.type === "HEADING" ? 2 : 4}
          fontWeight={field.type === "HEADING" ? "medium" : "normal"}
          textAlign="left"
          onClick={onFieldClick}
          borderRadius="md"
          cursor="pointer"
          _hover={!showAliasButtons ? defaultStyles : withAliasButtonsStyles}
          _focus={!showAliasButtons ? defaultStyles : withAliasButtonsStyles}
          _focusWithin={!showAliasButtons ? defaultStyles : withAliasButtonsStyles}
          overflow="hidden"
        >
          <LinkOverlay
            as="div"
            flex="1"
            minWidth={0}
            isTruncated
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
              <CopyAliasIconButton
                display="none"
                className="alias-button"
                field={field}
                onClick={field.alias || isReadOnly ? undefined : handleAddReferenceClick}
                background="white"
                boxShadow="md"
                _hover={{
                  boxShadow: "lg",
                }}
              />
              <AliasOptionsMenu
                className="alias-button"
                field={field}
                background="white"
                boxShadow="md"
                _hover={{
                  boxShadow: "lg",
                }}
              />
            </>
          ) : null}
        </LinkBox>
      </Box>
    </>
  );
}

const PetitionContentsItem = memo(
  _PetitionContentsItem,
  compareWithFragments<PetitionContentsItemProps<PetitionContents_PetitionFieldFragment>>({
    field: PetitionContents.fragments.PetitionField,
  })
) as typeof _PetitionContentsItem;

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
