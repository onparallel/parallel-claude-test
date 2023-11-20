import { gql } from "@apollo/client";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  HStack,
  IconButton,
  Stack,
} from "@chakra-ui/react";
import { DeleteIcon, PlusCircleIcon } from "@parallel/chakra/icons";
import { useSimpleSelectOptions } from "@parallel/components/common/SimpleSelect";
import {
  PetitionFieldMathEditor_PetitionBaseFragment,
  PetitionFieldMathEditor_PetitionFieldFragment,
} from "@parallel/graphql/__types";
import { defaultFieldCondition } from "@parallel/utils/fieldLogic/conditions";
import {
  PetitionFieldLogicCondition,
  PetitionFieldLogicConditionLogicalJoin,
  PetitionFieldMath,
  PetitionFieldMathOperation,
} from "@parallel/utils/fieldLogic/types";
import { Fragment, SetStateAction, useEffect, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { noop } from "ts-essentials";
import { PetitionFieldLogicAddConditionButton } from "./PetitionFieldLogicAddConditionButton";
import { PetitionFieldLogicConditionEditor } from "./PetitionFieldLogicConditionEditor";
import { PetitionFieldLogicConditionLogicalJoinSelect } from "./PetitionFieldLogicConditionLogicalJoinSelect";
import {
  PetitionFieldLogicContext,
  usePetitionFieldLogicContext,
} from "./PetitionFieldLogicContext";
import { PetitionFieldMathOperandSelect } from "./PetitionFieldMathOperandSelect";
import { PetitionFieldMathOperatorSelect } from "./PetitionFieldMathOperatorSelect";
import { PetitionVariableSelect } from "./PetitionVariableSelect";

export interface PetitionFieldMathEditorProps {
  field: PetitionFieldMathEditor_PetitionFieldFragment;
  petition: PetitionFieldMathEditor_PetitionBaseFragment;
  onMathChange: (math: PetitionFieldMath[]) => void;
  showErrors?: boolean;
  isReadOnly?: boolean;
  onCreateVariable?: (name: string) => Promise<string>;
}

const MAX_CALCULATIONS = 10;
const MAX_CONDITIONS = 10;
const MAX_OPERATIONS = 10;

export function PetitionFieldMathEditor({
  field,
  petition,
  onMathChange,
  showErrors,
  isReadOnly,
  onCreateVariable,
}: PetitionFieldMathEditorProps) {
  const defaultOperator = {
    variable: "",
    operator: "ADDITION",
    operand: { type: "NUMBER", value: 0 },
  } as PetitionFieldMathOperation;

  const allFields = useMemo(
    () => petition.fields.flatMap((f) => [f, ...(f.children ?? [])]),
    [petition.fields],
  );
  const defaultVariableCondition = petition.variables.length
    ? {
        variableName: petition.variables[0].name,
        operator: "GREATER_THAN",
        value: 0,
      }
    : {};

  const index = allFields.findIndex((f) => f.id === field.id);
  const referencedField =
    allFields.slice(0, index).findLast((f) => !f.isReadOnly && f.parent === field.parent) ??
    allFields.slice(0, index).findLast((f) => !f.isReadOnly)!;

  const defaultCondition =
    field.type === "HEADING"
      ? (referencedField && defaultFieldCondition(referencedField)) ?? defaultVariableCondition
      : defaultFieldCondition(field);

  const defaultFieldMath = {
    operator: "AND",
    conditions: [defaultCondition],
    operations: [defaultOperator],
  } as PetitionFieldMath;

  const [math, setMath] = useState<PetitionFieldMath[]>(
    (field.math as PetitionFieldMath[]) || [defaultFieldMath],
  );

  useEffect(() => {
    // Update math if field.math changes
    if (field.math && math) {
      setMath(field.math as PetitionFieldMath[]);
    }
  }, [field.math]);

  useEffect(() => {
    onMathChange(math);
  }, [math]);

  const updateRow = function (index: number, condition: PetitionFieldMath) {
    setMath((rows) => rows.map((c, i) => (i === index ? condition : c)));
  };

  return (
    <PetitionFieldLogicContext petition={petition} field={field} includeSelf>
      <Stack spacing={isReadOnly ? 0 : undefined}>
        {math.map((row, index) =>
          isReadOnly ? (
            <PetitionFieldMathRowReadOnly key={index} row={row} />
          ) : (
            <PetitionFieldMathRow
              key={index}
              row={row}
              onRowChange={(value) => updateRow(index, value)}
              onDelete={
                index > 0 ? () => setMath((rows) => rows.filter((_, i) => i !== index)) : undefined
              }
              showErrors={showErrors}
              onCreateVariable={onCreateVariable}
            />
          ),
        )}
        {isReadOnly ? null : (
          <Button
            fontWeight="normal"
            size="sm"
            leftIcon={<PlusCircleIcon />}
            alignSelf="start"
            onClick={() => {
              setMath((rows) => [...rows, defaultFieldMath]);
            }}
            isDisabled={isReadOnly || math.length >= MAX_CALCULATIONS}
          >
            <FormattedMessage
              id="component.petition-field-math-editor.add-calculation"
              defaultMessage="Add calculation"
            />
          </Button>
        )}
      </Stack>
    </PetitionFieldLogicContext>
  );
}

function PetitionFieldMathRow({
  row,
  onRowChange,
  onDelete,
  showErrors,
  onCreateVariable,
}: {
  row: PetitionFieldMath;
  onRowChange: (value: PetitionFieldMath) => void;
  onDelete?: () => void;
  showErrors?: boolean;
  onCreateVariable?: (name: string) => Promise<string>;
}) {
  const intl = useIntl();
  function setMath(dispatch: (prev: PetitionFieldMath) => PetitionFieldMath) {
    onRowChange(dispatch(row));
  }
  function setMathOperator(value: SetStateAction<PetitionFieldLogicConditionLogicalJoin>) {
    return setMath((math) => ({
      ...math,
      operator: typeof value === "function" ? value(math.operator) : value,
    }));
  }
  function setConditions(value: SetStateAction<PetitionFieldLogicCondition[]>) {
    return setMath((math) => ({
      ...math,
      conditions: typeof value === "function" ? value(math.conditions) : value,
    }));
  }
  const updateCondition = function (index: number, condition: PetitionFieldLogicCondition) {
    setConditions((conditions) => conditions.map((c, i) => (i === index ? condition : c)));
  };
  function setOperations(value: SetStateAction<PetitionFieldMathOperation[]>) {
    return setMath((math) => ({
      ...math,
      operations: typeof value === "function" ? value(math.operations) : value,
    }));
  }
  const updateOperation = function (index: number, operation: PetitionFieldMathOperation) {
    setOperations((operations) => operations.map((o, i) => (i === index ? operation : o)));
  };

  const { variables } = usePetitionFieldLogicContext();
  const variableOptions = useSimpleSelectOptions(
    () =>
      variables.map((v) => ({
        label: v.name,
        value: v.name,
      })),
    [Object.keys(variables).join(",")],
  );

  return (
    <Stack spacing={2} padding={2} borderRadius="md" backgroundColor="purple.75">
      <Grid
        templateColumns={{
          base: "auto minmax(160px, 1fr)",
          xl: "auto minmax(160px, 2fr) 3fr",
        }}
        alignItems="start"
        columnGap={2}
        rowGap={2}
      >
        {row.conditions.map((condition, index) => {
          return (
            <Fragment key={index}>
              <Box fontSize="sm">
                {index === 0 ? (
                  <Flex height="32px" alignItems="center" paddingLeft={2}>
                    <FormattedMessage
                      id="component.petition-field-math-editor.when"
                      defaultMessage="When"
                    />
                  </Flex>
                ) : (
                  <Stack direction="row">
                    <IconButton
                      size="sm"
                      variant="ghost"
                      icon={<DeleteIcon />}
                      aria-label={intl.formatMessage({
                        id: "generic.remove",
                        defaultMessage: "Remove",
                      })}
                      onClick={() =>
                        setConditions((conditions) => conditions.filter((c, i) => i !== index))
                      }
                    />
                    {index === 1 ? (
                      <Box flex="1" minWidth="0">
                        <PetitionFieldLogicConditionLogicalJoinSelect
                          value={row.operator}
                          onChange={(operator) => setMathOperator(operator!)}
                          isInvalid={showErrors && !row.operator}
                        />
                      </Box>
                    ) : (
                      <Flex flex="1" alignItems="start" paddingLeft="11px">
                        {row.operator === "AND" ? (
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
              </Box>
              <PetitionFieldLogicConditionEditor
                condition={condition}
                onConditionChange={(value) => updateCondition(index, value)}
                showErrors={showErrors}
              />
            </Fragment>
          );
        })}
      </Grid>
      {row.conditions.length < MAX_CONDITIONS ? (
        <PetitionFieldLogicAddConditionButton
          variant="ghost"
          conditions={row.conditions}
          onAddCondition={(condition) => setConditions((conditions) => [...conditions, condition])}
        />
      ) : null}
      <Grid
        templateColumns={{
          base: "auto minmax(130px, 1fr) 2fr auto 1fr",
          xl: "auto 130px 3fr auto 2fr",
        }}
        alignItems="start"
        columnGap={2}
        rowGap={2}
      >
        {row.operations.map((operation, index) => (
          <Fragment key={index}>
            {index === 0 ? (
              <Center height="30px" fontSize="sm" paddingLeft={2}>
                <FormattedMessage
                  id="component.petition-field-math-editor.then"
                  defaultMessage="Then"
                />
              </Center>
            ) : (
              <Flex justifyContent="flex-start">
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<DeleteIcon />}
                  aria-label={intl.formatMessage({
                    id: "generic.remove",
                    defaultMessage: "Remove",
                  })}
                  onClick={() =>
                    setOperations((operations) => operations.filter((_, i) => i !== index))
                  }
                />
              </Flex>
            )}
            <PetitionFieldMathOperatorSelect
              value={operation.operator}
              onChange={(value) => updateOperation(index, { ...operation, operator: value! })}
            />
            <PetitionFieldMathOperandSelect
              value={operation.operand}
              onChange={(value) => updateOperation(index, { ...operation, operand: value! })}
            />
            <Center height="30px" fontSize="sm">
              <FormattedMessage id="component.petition-field-math-editor.to" defaultMessage="to" />
            </Center>
            <PetitionVariableSelect
              size="sm"
              options={variableOptions}
              value={operation.variable}
              onChange={(value) => updateOperation(index, { ...operation, variable: value! })}
              isInvalid={showErrors && !operation.variable}
              onCreateVariable={
                onCreateVariable &&
                (async (name) => {
                  try {
                    const value = await onCreateVariable(name);
                    updateOperation(index, { ...operation, variable: value! });
                  } catch {}
                })
              }
            />
          </Fragment>
        ))}
      </Grid>
      <HStack justify="space-between">
        {row.operations.length >= MAX_OPERATIONS ? null : (
          <Button
            fontWeight="normal"
            size="sm"
            leftIcon={<PlusCircleIcon />}
            alignSelf="start"
            onClick={() => {
              setOperations((operations) => [...operations, { ...operations.at(-1)! }]);
            }}
            variant="ghost"
          >
            <FormattedMessage
              id="component.petition-field-math-editor.add-operation"
              defaultMessage="Add action"
            />
          </Button>
        )}
        {onDelete === undefined ? null : (
          <Button
            fontWeight="normal"
            size="sm"
            colorScheme="red"
            alignSelf="start"
            onClick={onDelete}
            variant="ghost"
          >
            <FormattedMessage
              id="component.petition-field-math-editor.remove-calculation"
              defaultMessage="Remove calculation"
            />
          </Button>
        )}
      </HStack>
    </Stack>
  );
}

function PetitionFieldMathRowReadOnly({ row }: { row: PetitionFieldMath }) {
  return (
    <Stack spacing={2} padding={2} borderRadius="md" backgroundColor="purple.75">
      <Grid templateColumns="auto 1fr" alignItems="start" columnGap={2} rowGap={2}>
        {row.conditions.map((condition, index) => {
          return (
            <Fragment key={index}>
              <Box justifySelf="flex-end" fontSize="sm" height="auto">
                {index === 0 ? (
                  <Box justifySelf="flex-end" fontSize="sm">
                    <FormattedMessage
                      id="component.petition-field-math-editor.when"
                      defaultMessage="When"
                    />
                  </Box>
                ) : (
                  <Box justifySelf="flex-end" fontSize="sm">
                    <Box as="span">
                      {row.operator === "AND" ? (
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
              <PetitionFieldLogicConditionEditor
                condition={condition}
                onConditionChange={noop}
                isReadOnly={true}
              />
            </Fragment>
          );
        })}
      </Grid>
      <Grid templateColumns="auto 1fr" alignItems="start" columnGap={2} rowGap={2}>
        {row.operations.map((operation, index) => (
          <Fragment key={index}>
            <Box justifySelf="flex-end" fontSize="sm" height="auto">
              {index === 0 ? (
                <FormattedMessage
                  id="component.petition-field-math-editor.then"
                  defaultMessage="Then"
                />
              ) : null}
            </Box>
            <HStack fontSize="sm" height="auto" minWidth="0" gap={1.5} flexWrap="wrap">
              <PetitionFieldMathOperatorSelect
                value={operation.operator}
                onChange={noop}
                isReadOnly={true}
              />
              <Box as="span">
                <PetitionFieldMathOperandSelect
                  value={operation.operand}
                  onChange={noop}
                  isReadOnly={true}
                />
              </Box>
              <Box as="span">
                <FormattedMessage
                  id="component.petition-field-math-editor.to"
                  defaultMessage="to"
                />
              </Box>
              <Badge
                display="block"
                colorScheme="blue"
                fontSize="sm"
                textTransform="none"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                position="relative"
                height="auto"
                minWidth="0"
              >
                {operation.variable}
              </Badge>
            </HStack>
          </Fragment>
        ))}
      </Grid>
    </Stack>
  );
}

PetitionFieldMathEditor.fragments = {
  PetitionBase: gql`
    fragment PetitionFieldMathEditor_PetitionBase on PetitionBase {
      fields {
        ...PetitionFieldMathEditor_PetitionField
        children {
          ...PetitionFieldMathEditor_PetitionField
        }
      }
      variables {
        name
      }
      ...PetitionFieldLogicContext_PetitionBase
    }
    ${PetitionFieldLogicContext.fragments.PetitionBase}
  `,
  PetitionField: gql`
    fragment PetitionFieldMathEditor_PetitionField on PetitionField {
      id
      type
      options
      visibility
      math
      parent {
        id
      }
      ...PetitionFieldLogicContext_PetitionField
    }
    ${PetitionFieldLogicContext.fragments.PetitionField}
  `,
};
