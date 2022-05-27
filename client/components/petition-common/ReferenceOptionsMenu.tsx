import { gql } from "@apollo/client";
import {
  HStack,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuProps,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { HelpOutlineIcon, MoreVerticalIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { ReferenceOptionsMenu_PetitionFieldFragment } from "@parallel/graphql/__types";
import { FieldOptions } from "@parallel/utils/petitionFields";
import { useClipboardWithToast } from "@parallel/utils/useClipboardWithToast";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";

export interface ReferenceOptionsMenuProps extends Omit<MenuProps, "children"> {
  field: ReferenceOptionsMenu_PetitionFieldFragment;
}

export const ReferenceOptionsMenu = Object.assign(
  chakraForwardRef<"button", ReferenceOptionsMenuProps>(function ReferenceOptionsMenu(
    { field, ...props },
    ref
  ) {
    const intl = useIntl();
    const copyFormula = useClipboardWithToast({
      text: intl.formatMessage({
        id: "component.reference-options-menu.formula-copied-alert",
        defaultMessage: "Formula copied to clipboard",
      }),
    });
    const [isOpen, setIsOpen] = useState(false);

    const formulas = getFormulasByTypeField(field);

    return (
      <Menu onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)} {...props}>
        <MenuButton
          onClick={(event) => {
            event.stopPropagation();
          }}
          ref={ref}
          display={isOpen ? undefined : "none"}
          className="references"
          as={IconButtonWithTooltip}
          label={intl.formatMessage({
            id: "component.reference-options-menu.other-options",
            defaultMessage: "Other options",
          })}
          icon={<MoreVerticalIcon />}
          size="xs"
          background="white"
          boxShadow="md"
          _hover={{
            boxShadow: "lg",
          }}
          tabIndex={0}
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
                onClick={(event) => {
                  event.stopPropagation();
                  copyFormula({ value: formula || `{{ ${field.alias} }}` });
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
              as="a"
              href={`https://help.onparallel.com/es/articles/5998723-como-generar-textos-dinamicos`}
              rel="noopener"
              target="_blank"
              alignItems="center"
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
        fragment ReferenceOptionsMenu_PetitionField on PetitionField {
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
  formula: string;
}[];

function getFormulasByTypeField(field: ReferenceOptionsMenu_PetitionFieldFragment): FormulasType {
  const intl = useIntl();

  const { type, alias, options, multiple } = field;

  const conditionalFormula = useMemo(() => {
    switch (type) {
      case "CHECKBOX":
      case "SELECT":
        const fieldOptions = options as FieldOptions["CHECKBOX"];
        let conditional = `${intl.formatMessage(
          {
            id: "component.reference-options-menu.if-option-with-sentence",
            defaultMessage: `'{'% if {alias} == "{option}" %'}{br}This is the sentence that will be displayed when {option} is chosen.{br}`,
          },
          {
            alias: type === "CHECKBOX" ? alias + "[0]" : alias,
            option: "A",
            br: `\n`,
          }
        )}${intl.formatMessage(
          {
            id: "component.reference-options-menu.elsif-with-sentence",
            defaultMessage: `'{'% elsif {alias} == "{option}" %'}{br}This is the sentence that will be displayed when {option} is chosen.{br}`,
          },
          {
            alias: type === "CHECKBOX" ? alias + "[0]" : alias,
            option: "B",
            br: `\n`,
          }
        )}`;

        fieldOptions.values.forEach((option, index) => {
          if (index === 0) {
            conditional = intl.formatMessage(
              {
                id: "component.reference-options-menu.if-option-with-sentence",
                defaultMessage: `'{'% if {alias} == "{option}" %'}{br}This is the sentence that will be displayed when {option} is chosen.{br}`,
              },
              {
                alias: type === "CHECKBOX" ? alias + "[0]" : alias,
                option,
                br: `\n`,
              }
            );
          } else {
            conditional += intl.formatMessage(
              {
                id: "component.reference-options-menu.elsif-with-sentence",
                defaultMessage: `'{'% elsif {alias} == "{option}" %'}{br}This is the sentence that will be displayed when {option} is chosen.{br}`,
              },
              {
                alias: type === "CHECKBOX" ? alias + "[0]" : alias,
                option,
                br: `\n`,
              }
            );
          }
        });

        conditional += `{% else %}\n${intl.formatMessage({
          id: "component.reference-options-menu.no-options-chosen",
          defaultMessage: "You have not chosen any known option.",
        })}\n{% endif %}`;

        return conditional;

      case "SHORT_TEXT":
      case "TEXT":
      case "NUMBER":
      case "PHONE":
      case "DATE":
      default:
        return `{% if ${multiple ? alias + "[0]" : alias} == "${intl.formatMessage({
          id: "component.reference-options-menu.reply",
          defaultMessage: "reply",
        })}" %}\n${intl.formatMessage({
          id: "component.reference-options-menu.sentence-with-reply",
          defaultMessage: "This is the sentence that will be displayed with that reply.",
        })}\n{% else %}\n${intl.formatMessage({
          id: "component.reference-options-menu.sentence-no-reply",
          defaultMessage: "This sentence will be displayed if there are no added replies.",
        })}\n{% endif %}\n`;
    }
  }, [field]);

  const multipleFieldFormulas = field.multiple
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
          formula: intl.formatMessage(
            {
              id: "component.reference-options-menu.list-of-replies-formula",
              defaultMessage:
                "'{'%- for reply in {alias} %'}'{br}- '{{' reply '}}'{br}'{'%- endfor %'}'",
            },
            {
              alias,
              br: `\n`,
            }
          ),
        },
        {
          title: intl.formatMessage({
            id: "component.reference-options-menu.one-line-replies",
            defaultMessage: "One-line replies",
          }),
          description: intl.formatMessage({
            id: "component.reference-options-menu.one-line-replies-description",
            defaultMessage: "Displays all replies on one line.",
          }),
          formula: intl.formatMessage(
            {
              id: "component.reference-options-menu.one-line-replies-formula",
              defaultMessage:
                "'{'% for reply in {alias} -%'}'{br}'{'% if forloop.first == true %'}{'% elsif forloop.last == true %'} and {'% else %'}, {'% endif %'}{{' reply '}}'{br}'{'%- endfor %'}'",
            },
            {
              alias,
              br: `\n`,
            }
          ),
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

  return useMemo(() => {
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
            formula: `{{ ${alias} | number }}`,
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
            formula: `{{ ${alias} | percent }}`,
          },
          {
            title: intl.formatMessage({
              id: "component.reference-options-menu.euros",
              defaultMessage: "Euros",
            }),
            description: intl.formatMessage({
              id: "component.reference-options-menu.euros-description",
              defaultMessage: "Displays the reply with the symbol €",
            }),
            formula: `{{ ${alias} | currency: "EUR" }}`,
          },
          {
            title: intl.formatMessage({
              id: "component.reference-options-menu.dollars",
              defaultMessage: "Dollars",
            }),
            description: intl.formatMessage({
              id: "component.reference-options-menu.dollars-description",
              defaultMessage: "Displays the reply with the symbol $",
            }),
            formula: `{{ ${alias} | currency: "USD" }}`,
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
            formula: `{{ ${alias} | round }}`,
          },
          ...commonFormulas,
        ];
      case "SHORT_TEXT":
      case "TEXT":
        return [
          {
            title: intl.formatMessage({
              id: "component.reference-options-menu.capitalization",
              defaultMessage: "Capitalization",
            }),
            description: intl.formatMessage({
              id: "component.reference-options-menu.capitalization-description",
              defaultMessage: "Displays the reply in capital letters.",
            }),
            formula: `{{ ${alias} | upcase }}`,
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
            formula: `{{ ${alias} | downcase }}`,
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
            formula: `{{ ${alias} | capitalize }}`,
          },
          ...commonFormulas,
        ];
      case "DYNAMIC_SELECT":
      case "ES_TAX_DOCUMENTS":
      case "FILE_UPLOAD":
      case "HEADING":
      default:
        return [
          {
            title: "",
            description: "",
            formula: "",
          },
        ];
    }
  }, [type, alias, options]);
}
