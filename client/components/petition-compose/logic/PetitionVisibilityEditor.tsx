import { gql } from "@apollo/client";
import { Box, Flex, Grid, HStack, IconButton, Stack } from "@chakra-ui/react";
import { DeleteIcon } from "@parallel/chakra/icons";
import { Button } from "@parallel/components/ui";
import { PetitionVisibilityEditor_PetitionBaseFragment } from "@parallel/graphql/__types";
import {
  defaultFieldCondition,
  defaultVariableCondition,
} from "@parallel/utils/fieldLogic/conditions";
import {
  PetitionFieldLogicCondition,
  PetitionFieldLogicConditionLogicalJoin,
  PetitionFieldVisibility,
  PetitionFieldVisibilityType,
} from "@parallel/utils/fieldLogic/types";
import { Fragment, SetStateAction, useEffect, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { assert } from "ts-essentials";
import { PetitionFieldLogicAddConditionButton } from "./PetitionFieldLogicAddConditionButton";
import { PetitionFieldLogicConditionEditor } from "./PetitionFieldLogicConditionEditor";
import { PetitionFieldLogicConditionLogicalJoinSelect } from "./PetitionFieldLogicConditionLogicalJoinSelect";
import { PetitionFieldLogicContext } from "./PetitionFieldLogicContext";
import { PetitionFieldVisibilityTypeSelect } from "./PetitionFieldVisibilityTypeSelect";

export interface PetitionVisibilityEditorProps {
  petition: PetitionVisibilityEditor_PetitionBaseFragment;
  showErrors?: boolean;
  value?: PetitionFieldVisibility;
  onChange: (visibility: PetitionFieldVisibility) => void;
  onRemove?: () => void;
  isReadOnly?: boolean;
  visibilityOn: "FIELD" | "APPROVAL" | "ATTACHMENT";
  fieldId?: string; // Required for FIELD visibility
}

export function PetitionVisibilityEditor({
  petition,
  value,
  onChange,
  onRemove,
  showErrors,
  isReadOnly,
  visibilityOn,
  fieldId,
}: PetitionVisibilityEditorProps) {
  const intl = useIntl();

  const allFields = useMemo(
    () => petition.fields.flatMap((f) => [f, ...(f.children ?? [])]),
    [petition.fields],
  );

  // Determine reference field based on visibilityOn
  const referenceField = useMemo(() => {
    switch (visibilityOn) {
      case "FIELD":
        assert(isNonNullish(fieldId), "fieldId is required for FIELD visibility");
        return allFields.find((f) => f.id === fieldId)!;
      case "APPROVAL":
      case "ATTACHMENT":
        return allFields.filter((f) => f.type !== "HEADING").at(-1)!; // Use last non-heading field
      default:
        throw new Error(`Unknown mode: ${visibilityOn}`);
    }
  }, [visibilityOn, fieldId, allFields]);

  // Get visibility value based on visibilityOn
  const visibility = useMemo(() => {
    if (visibilityOn === "FIELD") {
      return (
        (referenceField.visibility as PetitionFieldVisibility) || {
          type: "SHOW" as PetitionFieldVisibilityType,
          operator: "AND" as PetitionFieldLogicConditionLogicalJoin,
          conditions:
            referenceField && referenceField.type !== "HEADING"
              ? [defaultFieldCondition(referenceField)]
              : ([{}] as PetitionFieldLogicCondition[]),
        }
      );
    }

    return (
      value ?? {
        type: "SHOW" as PetitionFieldVisibilityType,
        operator: "AND" as PetitionFieldLogicConditionLogicalJoin,
        conditions:
          referenceField && referenceField.type !== "HEADING"
            ? [defaultFieldCondition(referenceField)]
            : petition.variables.length
              ? ([
                  defaultVariableCondition({
                    name: petition.variables[0].name,
                    type: petition.variables[0].type,
                    defaultValue:
                      petition.variables[0].__typename === "PetitionVariableEnum"
                        ? petition.variables[0].defaultEnum
                        : undefined,
                  }),
                ] as PetitionFieldLogicCondition[])
              : ([{}] as PetitionFieldLogicCondition[]),
      }
    );
  }, [visibilityOn, value, referenceField]);

  useEffect(() => {
    // This is a workaround to ensure that the visibility is always set when the component is mounted and the value is not provided
    if (!value) {
      onChange(visibility);
    }
  }, []);

  function setVisibility(dispatch: (prev: PetitionFieldVisibility) => PetitionFieldVisibility) {
    onChange(dispatch(visibility));
  }

  function setConditions(value: SetStateAction<PetitionFieldLogicCondition[]>) {
    return setVisibility((visibility) => ({
      ...visibility,
      conditions: typeof value === "function" ? value(visibility.conditions) : value,
    }));
  }

  function setVisibilityOperator(value: SetStateAction<PetitionFieldLogicConditionLogicalJoin>) {
    return setVisibility((visibility) => ({
      ...visibility,
      operator: typeof value === "function" ? value(visibility.operator) : value,
    }));
  }

  function setVisibilityType(value: SetStateAction<PetitionFieldVisibilityType>) {
    return setVisibility((visibility) => ({
      ...visibility,
      type: typeof value === "function" ? value(visibility.type) : value,
    }));
  }

  const updateCondition = function (index: number, condition: PetitionFieldLogicCondition) {
    setConditions((conditions) => conditions.map((c, i) => (i === index ? condition : c)));
  };

  const lastCondition = visibility.conditions[visibility.conditions.length - 1];
  const lastConditionFieldId = "fieldId" in lastCondition ? lastCondition.fieldId : null;
  const lastConditionField = allFields.find((f) => f.id === lastConditionFieldId);

  // Determine includeSelf based on visibilityOn
  const includeSelf = visibilityOn === "APPROVAL" || visibilityOn === "ATTACHMENT";

  return (
    <PetitionFieldLogicContext petition={petition} field={referenceField} includeSelf={includeSelf}>
      <Stack spacing={2} padding={2} borderRadius="md" backgroundColor="gray.100">
        <Grid
          templateColumns={
            isReadOnly
              ? "auto 1fr"
              : {
                  base: "auto minmax(160px, 1fr)",
                  xl: "auto minmax(160px, 2fr) 3fr",
                }
          }
          alignItems="start"
          columnGap={2}
          rowGap={2}
        >
          {visibility.conditions.map((condition, index) => {
            return (
              <Fragment key={index}>
                {isReadOnly ? (
                  <Box justifySelf="flex-end" fontSize="sm" height="24px" lineHeight="24px">
                    {index === 0 ? (
                      <PetitionFieldVisibilityTypeSelect
                        value={visibility.type}
                        onChange={(type) => setVisibilityType(type!)}
                        isReadOnly
                      />
                    ) : (
                      <Box justifySelf="flex-end" fontSize="sm">
                        <Box as="span">
                          {visibility.operator === "AND" ? (
                            <FormattedMessage
                              id="generic.condition-logical-join-and"
                              defaultMessage="and"
                            />
                          ) : (
                            <FormattedMessage
                              id="generic.condition-logical-join-or"
                              defaultMessage="or"
                            />
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <>
                    {index === 0 ? (
                      <Box justifySelf="flex-end" fontSize="sm">
                        <PetitionFieldVisibilityTypeSelect
                          value={visibility.type}
                          onChange={(type) => setVisibilityType(type!)}
                          isReadOnly={isReadOnly}
                        />
                      </Box>
                    ) : (
                      <Stack direction="row">
                        <IconButton
                          size="sm"
                          icon={<DeleteIcon />}
                          aria-label={intl.formatMessage({
                            id: "generic.remove",
                            defaultMessage: "Remove",
                          })}
                          onClick={() =>
                            setConditions((conditions) => conditions.filter((c, i) => i !== index))
                          }
                          isDisabled={isReadOnly}
                        />
                        {index === 1 ? (
                          <Box flex="1" minWidth="0">
                            <PetitionFieldLogicConditionLogicalJoinSelect
                              value={visibility.operator}
                              onChange={(operator) => setVisibilityOperator(operator!)}
                            />
                          </Box>
                        ) : (
                          <Flex
                            flex="1"
                            alignItems="start"
                            paddingStart="11px"
                            textStyle={isReadOnly ? "muted" : undefined}
                          >
                            {visibility.operator === "AND" ? (
                              <FormattedMessage
                                id="generic.condition-logical-join-and"
                                defaultMessage="and"
                              />
                            ) : (
                              <FormattedMessage
                                id="generic.condition-logical-join-or"
                                defaultMessage="or"
                              />
                            )}
                          </Flex>
                        )}
                      </Stack>
                    )}
                  </>
                )}
                <PetitionFieldLogicConditionEditor
                  condition={condition}
                  onConditionChange={(value) => updateCondition(index, value)}
                  isReadOnly={isReadOnly}
                  showErrors={showErrors}
                />
              </Fragment>
            );
          })}
        </Grid>

        <HStack justify="space-between">
          <Box>
            {visibility.conditions.length < 15 && !isReadOnly ? (
              <PetitionFieldLogicAddConditionButton
                disabled={
                  "fieldId" in lastCondition &&
                  (!lastConditionField || lastConditionField.type === "HEADING")
                }
                conditions={visibility.conditions}
                onAddCondition={(condition) =>
                  setConditions((conditions) => [...conditions, condition])
                }
              />
            ) : null}
          </Box>

          {onRemove && visibilityOn === "APPROVAL" ? (
            <Button
              variant="ghost"
              colorPalette="red"
              onClick={onRemove}
              size="sm"
              fontSize="md"
              fontWeight={400}
            >
              <FormattedMessage id="generic.remove-condition" defaultMessage="Remove condition" />
            </Button>
          ) : null}
        </HStack>
      </Stack>
    </PetitionFieldLogicContext>
  );
}

const _fragments = {
  PetitionBase: gql`
    fragment PetitionVisibilityEditor_PetitionBase on PetitionBase {
      fields {
        id
        type
        visibility
        ...PetitionVisibilityEditor_PetitionField
        children {
          id
          type
          visibility
          ...PetitionVisibilityEditor_PetitionField
        }
      }
      ...PetitionFieldLogicContext_PetitionBase
    }
  `,
  PetitionField: gql`
    fragment PetitionVisibilityEditor_PetitionField on PetitionField {
      id
      type
      visibility
    }
  `,
};
