import { gql } from "@apollo/client";
import {
  Heading,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HelpOutlineIcon, MoreVerticalIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  MoreLiquidReferencesButton_PetitionFieldFragment,
  PetitionField,
} from "@parallel/graphql/__types";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined } from "remeda";
import { NakedHelpCenterLink } from "../common/HelpCenterLink";
import { IconButtonWithTooltip, IconButtonWithTooltipProps } from "../common/IconButtonWithTooltip";

export interface MoreLiquidReferencesButtonProps extends Omit<IconButtonWithTooltipProps, "label"> {
  field: MoreLiquidReferencesButton_PetitionFieldFragment;
  onAddAliasToField?: () => Promise<string>;
}

export const MoreLiquidReferencesButton = Object.assign(
  chakraForwardRef<"button", MoreLiquidReferencesButtonProps>(function MoreLiquidReferencesButton(
    { field, onAddAliasToField, ...props },
    ref,
  ) {
    const intl = useIntl();
    const copyReference = useClipboardWithToast({
      text: intl.formatMessage({
        id: "component.more-liquid-references-button.formula-copied-alert",
        defaultMessage: "Formula copied to clipboard",
      }),
    });
    const references = useLiquidReferences({ field });

    return (
      <Menu>
        <MenuButton
          onClick={(event) => {
            event.stopPropagation();
          }}
          ref={ref}
          as={IconButtonWithTooltip}
          label={intl.formatMessage({
            id: "component.more-liquid-references-button.formulas",
            defaultMessage: "Formulas",
          })}
          icon={<MoreVerticalIcon />}
          size="xs"
          {...props}
        />
        <Portal>
          <MenuList width="min-content" minWidth="20rem">
            <Heading
              paddingX={4}
              paddingTop={1}
              paddingBottom={1.5}
              as="h4"
              size="xs"
              textTransform="uppercase"
            >
              <FormattedMessage
                id="component.more-liquid-references-button.formulas"
                defaultMessage="Formulas"
              />
            </Heading>
            {references.map(({ title, description, builder }, index) => (
              <MenuItem
                onClick={async (event) => {
                  event.stopPropagation();
                  try {
                    const alias = field.alias ?? (await onAddAliasToField!());
                    copyReference({ value: builder(alias) });
                  } catch {}
                }}
                key={index}
              >
                <Stack spacing={1}>
                  <Text fontSize="md" fontWeight="bold">
                    {title}
                  </Text>
                  <Text fontSize="sm">{description}</Text>
                </Stack>
              </MenuItem>
            ))}
            <MenuDivider />
            <MenuItem
              icon={<HelpOutlineIcon display="block" boxSize={4} />}
              as={NakedHelpCenterLink}
              articleId={6323096}
            >
              <FormattedMessage id="generic.learn-more" defaultMessage="Learn more" />
            </MenuItem>
          </MenuList>
        </Portal>
      </Menu>
    );
  }),
  {
    fragments: {
      PetitionField: gql`
        fragment MoreLiquidReferencesButton_PetitionField on PetitionField {
          id
          alias
          type
          multiple
          options
          isChild
          children {
            id
            type
            title
            multiple
            alias
            options
          }
        }
      `,
    },
  },
);

interface LiquidReference {
  title: string;
  description: string;
  builder: (alias: string) => string;
}

function useLiquidReferences({
  field,
}: {
  field: MoreLiquidReferencesButton_PetitionFieldFragment;
}): LiquidReference[] {
  const intl = useIntl();
  return useMemo(() => {
    const buildAlias = (alias: string) => (field.multiple || field.isChild ? alias + "[0]" : alias);

    const conditionalReference = (() => {
      switch (field.type) {
        case "CHECKBOX": {
          const fieldOptions = field.options as FieldOptions["CHECKBOX"];
          const values = fieldOptions.values.length > 0 ? fieldOptions.values : ["A"];
          return (alias: string) =>
            [
              ...values.slice(0, 3).flatMap((value, index) => [
                `{% ${index === 0 ? "if" : "elsif"} ${buildAlias(alias)} contains ${JSON.stringify(value)} %}`,
                intl.formatMessage(
                  {
                    id: "component.more-liquid-references-button.sentence-for-option",
                    defaultMessage: `This sentence will be displayed when "{option}" is selected.`,
                  },
                  { option: value },
                ),
              ]),
              "{% else %}",
              intl.formatMessage({
                id: "component.more-liquid-references-button.sentence-for-other",
                defaultMessage:
                  "This sentence will be displayed if none of the previous options is selected.",
              }),
              "{% endif %}",
            ].join("\n");
        }
        case "SELECT": {
          const fieldOptions = field.options as FieldOptions["SELECT"];
          const values = fieldOptions.values.length > 0 ? fieldOptions.values : ["A"];
          return (alias: string) =>
            [
              ...values.slice(0, 3).flatMap((value, index) => [
                `{% ${index === 0 ? "if" : "elsif"} ${buildAlias(alias)} == ${JSON.stringify(
                  value,
                )} %}`,
                intl.formatMessage(
                  {
                    id: "component.more-liquid-references-button.if-option-with-sentence",
                    defaultMessage: `This sentence will be displayed when "{option}" is selected.`,
                  },
                  { option: value },
                ),
              ]),
              "{% else %}",
              intl.formatMessage({
                id: "component.more-liquid-references-button.sentence-for-other",
                defaultMessage:
                  "This sentence will be displayed if none of the previous options is selected.",
              }),
              "{% endif %}",
            ].join("\n");
        }
        default: {
          const value =
            field.type === "NUMBER"
              ? 123
              : field.type === "PHONE"
                ? "+34612312312"
                : field.type === "DATE"
                  ? "2022-05-29"
                  : intl.formatMessage({
                      id: "component.more-liquid-references-button.example-reply",
                      defaultMessage: "Example reply",
                    });
          return (alias: string) =>
            [
              `{% if ${buildAlias(alias)} == ${JSON.stringify(value)} %}`,
              intl.formatMessage(
                {
                  id: "component.more-liquid-references-button.sentence-with-reply",
                  defaultMessage: `This sentence will be displayed when the reply is "{value}".`,
                },
                { value },
              ),
              "{% else %}",
              intl.formatMessage({
                id: "component.more-liquid-references-button.sentence-no-reply",
                defaultMessage: "This sentence will be displayed if there are no added replies.",
              }),
              "{% endif %}",
            ].join("\n");
        }
      }
    })();

    const loopVariable = intl.formatMessage({
      id: "generic.liquid-loop-variable-name",
      defaultMessage: "reply",
    });

    const defaultGroupName = intl.formatMessage({
      id: "generic.default-group-name",
      defaultMessage: "Reply",
    });

    const and = intl.formatMessage({
      id: "component.more-liquid-references-button.and",
      defaultMessage: "and",
    });
    const defaultFilter =
      field.type === "DATE" ? " | date" : field.type === "NUMBER" ? " | number" : "";
    const interpolation = `{{ ${loopVariable}${defaultFilter} }}`;

    // If checkbox max is 1 we trate it like a radio button, if is unlimited we ignore the max
    const multipleFieldReferences =
      field.multiple ||
      field.isChild ||
      (field.type === "CHECKBOX" &&
        (field.options.limit.type === "UNLIMITED" || field.options.limit.max > 1))
        ? [
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.list-of-replies",
                defaultMessage: "List of replies",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.list-of-replies-description",
                defaultMessage: "Creates a list with each reply added.",
              }),
              builder: (alias: string) =>
                [
                  `{% for ${loopVariable} in ${buildAlias(alias)} -%}`,
                  `- ${interpolation}`,
                  `{% endfor %}`,
                ].join("\n"),
            },
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.one-line-replies",
                defaultMessage: "One-line replies",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.one-line-replies-description",
                defaultMessage: "Displays all replies in one line.",
              }),
              builder: (alias: string) =>
                [
                  `{% for ${loopVariable} in ${buildAlias(alias)} -%}`,
                  `{% if forloop.first %}{% elsif forloop.last %} ${and} {% else %}, {% endif %}${interpolation}`,
                  `{%- endfor %}`,
                ].join("\n"),
            },
          ]
        : [];

    const commonFormulas = [
      {
        title: intl.formatMessage({
          id: "component.more-liquid-references-button.conditional-text",
          defaultMessage: "Conditional text",
        }),
        description: intl.formatMessage({
          id: "component.more-liquid-references-button.conditional-text-description",
          defaultMessage: "Displays a sentence when an option is chosen.",
        }),
        builder: conditionalReference,
      },
      ...multipleFieldReferences,
    ];

    return (() => {
      switch (field.type) {
        case "FIELD_GROUP":
          return [
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.number-of-replies",
                defaultMessage: "Number of replies",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.number-of-replies-description",
                defaultMessage: "Show the number of groups added.",
              }),
              builder: (alias: string) => `{{ ${alias}.size }}`,
            },
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.table-of-results",
                defaultMessage: "Table of results",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.table-of-results-description",
                defaultMessage: "Show the results formatted as a table.",
              }),
              builder: (alias: string) => {
                const fields = field.children!.filter(
                  (f) => isDefined(f.alias) && !isFileTypeField(f.type),
                );
                const groupName = field.options.groupName ?? defaultGroupName;
                return [
                  `|${groupName}|${fields.map((f) => f.title ?? " ").join("|")}|`,
                  `|:-|${fields
                    .map((f) => (f.type === "NUMBER" || f.type === "DATE" ? "-:" : "-"))
                    .join("|")}|`,
                  `{%- for ${loopVariable} in ${alias} %}`,
                  `|${groupName} {{forloop.index}}|${fields
                    .map((f) => defaultFielGroupChildReference(f, `${loopVariable}.${f.alias}`))
                    .join("|")}|`,
                  `{%- endfor %}`,
                ].join("\n");
              },
            },
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.table-of-results-transposed",
                defaultMessage: "Table of results (transposed)",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.table-of-results-description",
                defaultMessage: "Show the results formatted as a table.",
              }),
              builder: (alias: string) => {
                const fields = field.children!.filter(
                  (f) => isDefined(f.alias) && !isFileTypeField(f.type),
                );
                const groupName = field.options.groupName ?? defaultGroupName;
                return [
                  `|${groupName}|{% for ${loopVariable} in ${alias} %}${groupName} {{forloop.index}}|{% endfor %}`,
                  `|-|{% for ${loopVariable} in ${alias} %}-|{% endfor %}`,
                  ...fields.map((f) =>
                    [
                      "|",
                      f.title ?? "",
                      "|",
                      `{% for ${loopVariable} in ${alias} %}`,
                      `${defaultFielGroupChildReference(f, `${loopVariable}.${f.alias}`)}|`,
                      `{% endfor %}`,
                    ].join(""),
                  ),
                ].join("\n");
              },
            },
          ];
        case "CHECKBOX":
        case "SELECT":
        case "PHONE":
        case "DATE":
        case "DATE_TIME":
          return commonFormulas;
        case "NUMBER":
          return [
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.quantity",
                defaultMessage: "Quantity",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.quantity-description",
                defaultMessage: "Displays the reply as a quantity.",
              }),
              builder: (alias) => `{{ ${buildAlias(alias)} | number }}`,
            },
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.percentage",
                defaultMessage: "Percentage",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.percentage-description",
                defaultMessage: "Displays the reply as a percentage.",
              }),
              builder: (alias) => `{{ ${buildAlias(alias)} | percent: 2 }}`,
            },
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.round-up",
                defaultMessage: "Round up",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.round-up-description",
                defaultMessage: "Rounds the amount of a field.",
              }),
              builder: (alias) => `{{ ${buildAlias(alias)} | round }}`,
            },
            ...commonFormulas,
          ];
        case "SHORT_TEXT":
        case "TEXT":
          return [
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.uppercase",
                defaultMessage: "Uppercase",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.uppercase-description",
                defaultMessage: "Displays the reply in capital letters.",
              }),
              builder: (alias) => `{{ ${buildAlias(alias)} | upcase }}`,
            },
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.lowercase",
                defaultMessage: "Lowercase",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.lowercase-description",
                defaultMessage: "Displays a lowercase reply.",
              }),
              builder: (alias) => `{{ ${buildAlias(alias)} | downcase }}`,
            },
            {
              title: intl.formatMessage({
                id: "component.more-liquid-references-button.capitalize-first-letter",
                defaultMessage: "Capitalize first letter",
              }),
              description: intl.formatMessage({
                id: "component.more-liquid-references-button.capitalize-first-letter-description",
                defaultMessage: "Displays the reply with the first letter capitalized.",
              }),
              builder: (alias) => `{{ ${buildAlias(alias)} | capitalize }}`,
            },
            ...commonFormulas,
          ];
        default:
          return [];
      }
    })();
  }, [
    field.type,
    field.options,
    field.multiple,
    field.isChild,
    field.children?.map((f) => f.alias).join(","),
  ]);
}

function defaultFielGroupChildReference(
  field: Pick<PetitionField, "id" | "type" | "title" | "multiple" | "options">,
  alias: string,
) {
  const defaultFilter =
    field.type === "DATE" ? " | date" : field.type === "NUMBER" ? " | number" : "";
  // If checkbox max is 1 we just show the only possible reply, else, we show a list of replies
  const value =
    (field.type === "CHECKBOX" &&
      (field.options.limit.type === "UNLIMITED" || field.options.limit.max > 1)) ||
    field.multiple
      ? [
          `{% for item in ${alias} %}`,
          `{% if forloop.first == false %}, {% endif %}`,
          `{{ item${defaultFilter} }}`,
          `{% endfor %}`,
        ].join("")
      : field.type === "CHECKBOX"
        ? `{{ ${alias}[0] }}`
        : field.type === "FIELD_GROUP"
          ? `{{ ${alias}.size }}`
          : `{{ ${alias}${defaultFilter} }}`;
  return value;
}
