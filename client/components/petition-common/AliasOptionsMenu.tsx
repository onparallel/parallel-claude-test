import { gql } from "@apollo/client";
import {
  ButtonProps,
  HStack,
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
import { AliasOptionsMenu_PetitionFieldFragment } from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedHelpCenterLink } from "../common/HelpCenterLink";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

export interface AliasOptionsMenuProps extends Omit<ButtonProps, "children"> {
  field: AliasOptionsMenu_PetitionFieldFragment;
  onCreateAlias?: () => Promise<string>;
}

export const AliasOptionsMenu = Object.assign(
  chakraForwardRef<"button", AliasOptionsMenuProps>(function AliasOptionsMenu(
    { field, onCreateAlias, ...props },
    ref
  ) {
    const intl = useIntl();
    const copyFormula = useClipboardWithToast({
      text: intl.formatMessage({
        id: "component.reference-options-menu.formula-copied-alert",
        defaultMessage: "Formula copied to clipboard",
      }),
    });
    const formulas = useFormulasByTypeField(field);

    return (
      <Menu>
        <MenuButton
          onClick={(event) => {
            event.stopPropagation();
          }}
          ref={ref}
          as={IconButtonWithTooltip}
          label={intl.formatMessage({
            id: "component.reference-options-menu.formulas",
            defaultMessage: "Formulas",
          })}
          icon={<MoreVerticalIcon />}
          size="xs"
          {...props}
        />
        <Portal>
          <MenuList width="min-content" minWidth="20rem">
            <HStack paddingX={4} paddingTop={1} paddingBottom={1.5} alignItems="center">
              <Text fontSize="sm" textTransform="uppercase" flex="1">
                <FormattedMessage
                  id="component.reference-options-menu.formulas"
                  defaultMessage="Formulas"
                />
              </Text>
            </HStack>
            {formulas.map(({ title, description, formula }, index) => (
              <MenuItem
                onClick={async (event) => {
                  event.stopPropagation();
                  const alias = field.alias ?? (await onCreateAlias?.());
                  copyFormula({ value: formula(alias ?? "") });
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
              articleId={5998723}
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
        fragment AliasOptionsMenu_PetitionField on PetitionField {
          id
          alias
          type
          multiple
          options
        }
      `,
    },
  }
);

type FormulasType = {
  title: string;
  description: string;
  formula: (alias: string) => string;
}[];

function useFormulasByTypeField({
  type,
  alias,
  options,
  multiple,
}: AliasOptionsMenu_PetitionFieldFragment): FormulasType {
  const intl = useIntl();
  return useMemo(() => {
    const buildAlias = (alias: string) => (multiple ? alias + "[0]" : alias);

    const conditionalFormula = (() => {
      switch (type) {
        case "CHECKBOX": {
          const fieldOptions = options as FieldOptions["CHECKBOX"];
          const values = fieldOptions.values.length > 0 ? fieldOptions.values : ["A"];
          return (alias: string) =>
            [
              ...values.slice(0, 3).flatMap((value, index) => [
                `{% ${index === 0 ? "if" : "elsif"} ${alias} contains ${JSON.stringify(value)} %}`,
                intl.formatMessage(
                  {
                    id: "component.reference-options-menu.sentence-for-option",
                    defaultMessage: `This sentence will be displayed when "{option}" is selected.`,
                  },
                  { option: value }
                ),
              ]),
              "{% else %}",
              intl.formatMessage({
                id: "component.reference-options-menu.sentence-for-other",
                defaultMessage:
                  "This sentence will be displayed if none of the previous options is selected.",
              }),
              "{% endif %}",
            ].join("\n");
        }
        case "SELECT": {
          const fieldOptions = options as FieldOptions["SELECT"];
          const values = fieldOptions.values.length > 0 ? fieldOptions.values : ["A"];
          return (alias: string) =>
            [
              ...values.slice(0, 3).flatMap((value, index) => [
                `{% ${index === 0 ? "if" : "elsif"} ${buildAlias(alias)} == ${JSON.stringify(
                  value
                )} %}`,
                intl.formatMessage(
                  {
                    id: "component.reference-options-menu.if-option-with-sentence",
                    defaultMessage: `This sentence will be displayed when "{option}" is selected.`,
                  },
                  { option: value }
                ),
              ]),
              "{% else %}",
              intl.formatMessage({
                id: "component.reference-options-menu.sentence-for-other",
                defaultMessage:
                  "This sentence will be displayed if none of the previous options is selected.",
              }),
              "{% endif %}",
            ].join("\n");
        }
        default: {
          const value =
            type === "NUMBER"
              ? 123
              : type === "PHONE"
              ? "+34612312312"
              : type === "DATE"
              ? "2022-05-29"
              : intl.formatMessage({
                  id: "component.reference-options-menu.example-reply",
                  defaultMessage: "Example reply",
                });
          return (alias: string) =>
            [
              `{% if ${buildAlias(alias)} == ${JSON.stringify(value)} %}`,
              intl.formatMessage(
                {
                  id: "component.reference-options-menu.sentence-with-reply",
                  defaultMessage: `This sentence will be displayed when the reply is "{value}".`,
                },
                { value }
              ),
              "{% else %}",
              intl.formatMessage({
                id: "component.reference-options-menu.sentence-no-reply",
                defaultMessage: "This sentence will be displayed if there are no added replies.",
              }),
              "{% endif %}",
            ].join("\n");
        }
      }
    })();

    const loopVariable = intl.formatMessage({
      id: "component.reference-options-menu.loop-variable",
      defaultMessage: "reply",
    });
    const and = intl.formatMessage({
      id: "component.reference-options-menu.and",
      defaultMessage: "and",
    });
    const defaultFilter = type === "DATE" ? " | date" : type === "NUMBER" ? " | number" : "";
    const interpolation = `{{ ${loopVariable}${defaultFilter} }}`;

    // If checkbox max is 1 we trate it like a radio button, if is unlimited we ignore the max
    const multipleFieldFormulas =
      multiple ||
      (type === "CHECKBOX" && (options.limit.type === "UNLIMITED" || options.limit.max > 1))
        ? [
            {
              title: intl.formatMessage({
                id: "component.reference-options-menu.list-of-replies",
                defaultMessage: "List of replies",
              }),
              description: intl.formatMessage({
                id: "component.reference-options-menu.list-of-replies-description",
                defaultMessage: "Creates a list with each reply added.",
              }),
              formula: (alias: string) =>
                [
                  `{% for ${loopVariable} in ${alias} -%}`,
                  `- ${interpolation}`,
                  `{% endfor %}`,
                ].join("\n"),
            },
            {
              title: intl.formatMessage({
                id: "component.reference-options-menu.one-line-replies",
                defaultMessage: "One-line replies",
              }),
              description: intl.formatMessage({
                id: "component.reference-options-menu.one-line-replies-description",
                defaultMessage: "Displays all replies in one line.",
              }),
              formula: (alias: string) =>
                [
                  `{% for ${loopVariable} in ${alias} -%}`,
                  `{% if forloop.first == true %}{% elsif forloop.last == true %} ${and} {% else %}, {% endif %}${interpolation}`,
                  `{%- endfor %}`,
                ].join("\n"),
            },
          ]
        : [];

    const commonFormulas = [
      {
        title: intl.formatMessage({
          id: "component.reference-options-menu.conditional-text",
          defaultMessage: "Conditional text",
        }),
        description: intl.formatMessage({
          id: "component.reference-options-menu.conditional-text-description",
          defaultMessage: "Displays a sentence when an option is chosen.",
        }),
        formula: conditionalFormula,
      },
      ...multipleFieldFormulas,
    ];

    return (() => {
      switch (type) {
        case "CHECKBOX":
        case "SELECT":
        case "PHONE":
        case "DATE":
          return commonFormulas;
        case "NUMBER":
          return [
            {
              title: intl.formatMessage({
                id: "component.reference-options-menu.quantities",
                defaultMessage: "Quantities",
              }),
              description: intl.formatMessage({
                id: "component.reference-options-menu.quantities-description",
                defaultMessage: "Displays the reply as quantity.",
              }),
              formula: (alias) => `{{ ${buildAlias(alias)} | number }}`,
            },
            {
              title: intl.formatMessage({
                id: "component.reference-options-menu.percentage",
                defaultMessage: "Percentage",
              }),
              description: intl.formatMessage({
                id: "component.reference-options-menu.percentage-description",
                defaultMessage: "Displays the reply as a percentage.",
              }),
              formula: (alias) => `{{ ${buildAlias(alias)} | percent: 2 }}`,
            },
            {
              title: intl.formatMessage({
                id: "component.reference-options-menu.round-up",
                defaultMessage: "Round up",
              }),
              description: intl.formatMessage({
                id: "component.reference-options-menu.round-up-description",
                defaultMessage: "Rounds the amount of a field.",
              }),
              formula: (alias) => `{{ ${buildAlias(alias)} | round }}`,
            },
            ...commonFormulas,
          ];
        case "SHORT_TEXT":
        case "TEXT":
          return [
            {
              title: intl.formatMessage({
                id: "component.reference-options-menu.uppercase",
                defaultMessage: "Uppercase",
              }),
              description: intl.formatMessage({
                id: "component.reference-options-menu.uppercase-description",
                defaultMessage: "Displays the reply in capital letters.",
              }),
              formula: (alias) => `{{ ${buildAlias(alias)} | upcase }}`,
            },
            {
              title: intl.formatMessage({
                id: "component.reference-options-menu.lowercase",
                defaultMessage: "Lowercase",
              }),
              description: intl.formatMessage({
                id: "component.reference-options-menu.lowercase-description",
                defaultMessage: "Displays a lowercase reply.",
              }),
              formula: (alias) => `{{ ${buildAlias(alias)} | downcase }}`,
            },
            {
              title: intl.formatMessage({
                id: "component.reference-options-menu.capitalize-first-letter",
                defaultMessage: "Capitalize first letter",
              }),
              description: intl.formatMessage({
                id: "component.reference-options-menu.capitalize-first-letter-description",
                defaultMessage: "Displays the reply with the first letter capitalized.",
              }),
              formula: (alias) => `{{ ${buildAlias(alias)} | capitalize }}`,
            },
            ...commonFormulas,
          ];
        default:
          return [];
      }
    })();
  }, [type, alias, options, multiple]);
}
