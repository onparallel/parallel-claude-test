import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Center,
  Flex,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  AlertCircleIcon,
  EyeOffIcon,
  SignatureIcon,
} from "@parallel/chakra/icons";
import {
  PetitionContents_PetitionFieldFragment,
  PetitionSignatureRequestStatus,
} from "@parallel/graphql/__types";
import { compareWithFragments } from "@parallel/utils/compareWithFragments";
import { PetitionFieldIndex } from "@parallel/utils/fieldIndices";
import {
  filterPetitionFields,
  PetitionFieldFilter,
} from "@parallel/utils/filterPetitionFields";
import { useMemoFactory } from "@parallel/utils/useMemoFactory";
import { usePetitionSignatureStatusLabels } from "@parallel/utils/usePetitionSignatureStatusLabels";
import { ComponentType, createElement, memo, ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { Divider } from "../common/Divider";

interface PetitionContentsFieldIndicatorsProps<
  T extends PetitionContents_PetitionFieldFragment
> {
  field: T;
  isVisible: boolean;
}

type PetitionContentsSignatureStatus = "START" | PetitionSignatureRequestStatus;

export interface PetitionContentsProps<
  T extends PetitionContents_PetitionFieldFragment
> {
  fields: T[];
  fieldIndices: PetitionFieldIndex[];
  fieldVisibility?: boolean[];
  onFieldClick: (fieldId: string) => void;
  filter?: PetitionFieldFilter;
  fieldIndicators?: ComponentType<PetitionContentsFieldIndicatorsProps<T>>;
  signatureStatus?: PetitionContentsSignatureStatus | null;
}

export function PetitionContents<
  T extends PetitionContents_PetitionFieldFragment
>({
  fields,
  filter,
  fieldIndices,
  fieldVisibility,
  onFieldClick,
  fieldIndicators,
  signatureStatus,
}: PetitionContentsProps<T>) {
  const handleFieldClick = useMemoFactory(
    (fieldId: string) => () => onFieldClick(fieldId),
    [onFieldClick]
  );
  return (
    <Stack as="ol" spacing={1} padding={4}>
      {filterPetitionFields(
        fields,
        fieldIndices,
        fieldVisibility ?? [],
        filter
      ).map((x, index) =>
        x.type === "FIELD" ? (
          <PetitionContentsItem
            key={x.field.id}
            field={x.field}
            isVisible={true}
            fieldIndex={x.fieldIndex}
            onFieldClick={handleFieldClick(x.field.id)}
            fieldIndicators={fieldIndicators}
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
        <SignatureStatusInfo status={signatureStatus} />
      ) : null}
    </Stack>
  );
}

function SignatureStatusInfo({
  status,
}: {
  status: PetitionContentsSignatureStatus;
}) {
  const labels = usePetitionSignatureStatusLabels();
  return (
    <Flex justifyContent="space-between" alignItems="center">
      <Text fontWeight="bold">
        <FormattedMessage
          id="component.petition-contents.signature-status"
          defaultMessage="Petition eSignature"
        />
      </Text>
      <Tooltip label={labels[status]}>
        <Flex alignItems="center">
          <Box
            hidden={status !== "START"}
            width="4px"
            height="4px"
            borderColor="purple.500"
            borderWidth="4px"
            borderRadius="100%"
            marginRight={2}
          ></Box>
          <SignatureIcon
            color={status === "COMPLETED" ? "gray.700" : "gray.400"}
          />
          {status === "CANCELLED" ? (
            <AlertCircleIcon
              color="red.500"
              fontSize="14px"
              position="relative"
              bottom={2}
              right={2}
            />
          ) : null}
        </Flex>
      </Tooltip>
    </Flex>
  );
}

PetitionContents.fragments = {
  PetitionField: gql`
    fragment PetitionContents_PetitionField on PetitionField {
      id
      title
      type
      options
      ...filterPetitionFields_PetitionField
    }
    ${filterPetitionFields.fragments.PetitionField}
  `,
};

interface PetitionContentsItemProps<
  T extends PetitionContents_PetitionFieldFragment
> {
  field: T;
  fieldIndex: PetitionFieldIndex;
  isVisible: boolean;
  onFieldClick: () => void;
  fieldIndicators?: ComponentType<PetitionContentsFieldIndicatorsProps<T>>;
}

function _PetitionContentsItem<
  T extends PetitionContents_PetitionFieldFragment
>({
  field,
  isVisible,
  fieldIndex,
  onFieldClick,
  fieldIndicators,
}: PetitionContentsItemProps<T>) {
  return (
    <>
      {field.type === "HEADING" && field.options.hasPageBreak ? (
        <PetitionContentsDivider>
          <FormattedMessage
            id="generic.page-break"
            defaultMessage="Page break"
          />
        </PetitionContentsDivider>
      ) : null}
      <Box as="li" listStyleType="none" display="flex">
        <Stack
          as={Button}
          direction="row"
          flex="1"
          variant="ghost"
          alignItems="center"
          height="auto"
          padding={2}
          paddingLeft={field.type === "HEADING" ? 2 : 4}
          fontWeight={field.type === "HEADING" ? "medium" : "normal"}
          textAlign="left"
          onClick={onFieldClick}
        >
          <Text
            as="div"
            flex="1"
            minWidth={0}
            isTruncated
            opacity={isVisible ? 1 : 0.6}
          >
            <Text as="span">{fieldIndex}. </Text>
            {field.title ? (
              field.title
            ) : (
              <Text as="span" flex="1" textStyle="hint">
                {field.type === "HEADING" ? (
                  <FormattedMessage
                    id="generic.empty-heading"
                    defaultMessage="Untitled heading"
                  />
                ) : (
                  <FormattedMessage
                    id="generic.untitled-field"
                    defaultMessage="Untitled field"
                  />
                )}
              </Text>
            )}
          </Text>
          {fieldIndicators
            ? createElement(fieldIndicators, { field, isVisible })
            : null}
        </Stack>
      </Box>
    </>
  );
}

const PetitionContentsItem = memo(
  _PetitionContentsItem,
  compareWithFragments<
    PetitionContentsItemProps<PetitionContents_PetitionFieldFragment>
  >({
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
      <Text
        as="div"
        backgroundColor="white"
        paddingX={1}
        fontSize="xs"
        color="gray.500"
        zIndex="1"
      >
        {children}
      </Text>
    </Center>
  );
}
