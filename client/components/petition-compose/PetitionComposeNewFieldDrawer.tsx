import { gql } from "@apollo/client";
import {
  Box,
  Button,
  Heading,
  Image,
  Stack,
  Text,
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Divider } from "@parallel/components/common/Divider";
import {
  PetitionComposeNewFieldDrawer_UserFragment,
  PetitionFieldType,
} from "@parallel/graphql/__types";
import { getPetitionFieldTypeLabel } from "@parallel/utils/petitionFields";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { difference } from "remeda";
import { CloseButton } from "../common/CloseButton";
import { PaidBadge } from "../common/PaidBadge";
import { SearchInput } from "../common/SearchInput";
import { SmallPopover } from "../common/SmallPopover";
import { PetitionFieldTypeLabel } from "./PetitionFieldTypeLabel";

const FIELD_GROUP_EXCLUDED_FIELD_TYPES = ["FIELD_GROUP", "HEADING"] as PetitionFieldType[];

interface PetitionComposeNewFieldDrawerProps {
  user: PetitionComposeNewFieldDrawer_UserFragment;
  onClose: () => void;
  onAddField: (type: PetitionFieldType, parentFieldId?: string) => void;
  isFieldGroupChild: boolean;
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export const PetitionComposeNewFieldDrawer = Object.assign(
  chakraForwardRef<"div", PetitionComposeNewFieldDrawerProps>(
    function PetitionComposeNewFieldDrawer({ user, onClose, onAddField, isFieldGroupChild }, ref) {
      const intl = useIntl();
      const [search, setSearch] = useState<string | null>(null);

      const searchInputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
        searchInputRef.current?.focus();
      }, []);

      const fieldCategories = useMemo(() => {
        const options = [
          {
            category: intl.formatMessage({
              id: "component.petition-compose-new-field-drawer.category-headings",
              defaultMessage: "Headings and groups",
            }),
            fields: ["HEADING", "FIELD_GROUP"],
          },
          {
            category: intl.formatMessage({
              id: "component.petition-compose-new-field-drawer.category-text",
              defaultMessage: "Text",
            }),
            fields: ["SHORT_TEXT", "TEXT"],
          },
          {
            category: intl.formatMessage({
              id: "component.petition-compose-new-field-drawer.category-options",
              defaultMessage: "Options",
            }),
            fields: ["CHECKBOX", "SELECT", "DYNAMIC_SELECT"],
          },
          {
            category: intl.formatMessage({
              id: "component.petition-compose-new-field-drawer.category-files",
              defaultMessage: "Files and external sources",
            }),
            fields: [
              "FILE_UPLOAD",
              "BACKGROUND_CHECK",
              ...(user.hasEsTaxDocumentsField ? ["ES_TAX_DOCUMENTS"] : []),
            ],
          },
          {
            category: intl.formatMessage({
              id: "component.petition-compose-new-field-drawer.category-numbers",
              defaultMessage: "Numbers",
            }),
            fields: ["NUMBER", "PHONE", "DATE", "DATE_TIME"],
          },
        ] as { category: string; fields: PetitionFieldType[] }[];

        return options.map((c) => {
          const fields = isFieldGroupChild
            ? difference(c.fields, FIELD_GROUP_EXCLUDED_FIELD_TYPES)
            : c.fields;
          return {
            category: c.category,
            fields: fields
              .map((type) => ({
                type,
                keywords: [c.category, ...getPetitionFieldTypeKeywords(type)],
                label: getPetitionFieldTypeLabel(intl, type),
                description: getPetitionFieldTypeDescription(intl, type),
              }))
              .filter(({ keywords, label, description }) =>
                search
                  ? [label, description, ...keywords].some((keyword: string) =>
                      normalize(keyword).includes(normalize(search)),
                    )
                  : true,
              ),
          };
        });
      }, [
        intl.locale,
        user.hasEsTaxDocumentsField,
        user.hasDowJonesField,
        isFieldGroupChild,
        search,
      ]);

      const filteredFieldCategories = fieldCategories.filter(({ fields }) => fields.length > 0);
      const isFullScreen = useBreakpointValue({ base: true, lg: false });
      const handleAddField = useCallback(
        async (type: PetitionFieldType) => {
          await onAddField(type);
          if (isFullScreen) {
            onClose();
          }
        },
        [onAddField, isFullScreen, onClose],
      );

      return (
        <Stack spacing={0} height="100%" width="100%" position="relative" ref={ref}>
          <Box padding={4}>
            <Heading size="sm">
              <FormattedMessage
                id="component.petition-compose-new-field.what-do-you-need"
                defaultMessage="What do you need?"
              />
            </Heading>
            <CloseButton
              position="absolute"
              top={2}
              insetEnd={4}
              size="sm"
              variant="ghost"
              onClick={onClose}
            />
          </Box>
          <Divider />
          <Stack overflow="hidden">
            <Box paddingY={2} paddingX={4}>
              <SearchInput
                ref={searchInputRef}
                value={search ?? ""}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
            {filteredFieldCategories.length ? (
              <Stack as="ol" spacing={2} overflow="auto" tabIndex={-1} paddingBottom={4}>
                {filteredFieldCategories.map(({ category, fields }, index) => {
                  return (
                    <Stack
                      key={index}
                      as="li"
                      listStyleType="none"
                      display="flex"
                      position="relative"
                      flex="none"
                      spacing={2}
                    >
                      <Text
                        fontWeight={500}
                        color="gray.600"
                        textTransform="uppercase"
                        fontSize="sm"
                        paddingX={5}
                      >
                        {category}
                      </Text>
                      <Stack as="ul" spacing={1}>
                        {fields.map(({ type, label, description }) => (
                          <Box as="li" key={type} paddingX={2}>
                            <PertitionComposeNewFieldDrawerField
                              showPopover={!isFullScreen}
                              type={type}
                              label={label}
                              description={description}
                              showPaidBadge={
                                type === "BACKGROUND_CHECK" && !user.hasBackgroundCheck
                              }
                              onAddField={handleAddField}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            ) : (
              <Stack
                justifyContent="center"
                alignItems="center"
                paddingX={4}
                paddingY={6}
                spacing={4}
              >
                <Image
                  maxWidth="135px"
                  height="64px"
                  width="100%"
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/search/empty-search.svg`}
                />
                <Text textAlign="center" paddingX={4}>
                  <FormattedMessage
                    id="component.petition-compose-new-field.empty-search-text"
                    defaultMessage="No matches found for your search."
                  />
                </Text>
              </Stack>
            )}
          </Stack>
        </Stack>
      );
    },
  ),
  {
    fragments: {
      User: gql`
        fragment PetitionComposeNewFieldDrawer_User on User {
          hasEsTaxDocumentsField: hasFeatureFlag(featureFlag: ES_TAX_DOCUMENTS_FIELD)
          hasDowJonesField: hasFeatureFlag(featureFlag: DOW_JONES_KYC)
          hasBackgroundCheck: hasFeatureFlag(featureFlag: BACKGROUND_CHECK)
        }
      `,
    },
  },
);

interface PertitionComposeNewFieldDrawerFieldProps {
  type: PetitionFieldType;
  showPopover?: boolean;
  label: string;
  description: string;
  showPaidBadge: boolean;
  onAddField: (type: PetitionFieldType, parentFieldId?: string) => Promise<void>;
}

function PertitionComposeNewFieldDrawerField({
  type,
  showPopover,
  description,
  showPaidBadge,
  onAddField,
}: PertitionComposeNewFieldDrawerFieldProps) {
  const intl = useIntl();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const openingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  return (
    <SmallPopover
      isOpen={isOpen}
      isDisabled={!showPopover}
      width="container.4xs"
      content={
        <Box paddingX={1}>
          <Box minHeight="70px">
            <Image
              color="transparent"
              alt=""
              loading="eager"
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/field-types/${type}_${intl.locale}.png`}
            />
          </Box>
          <Box fontSize="sm" id={`field-description-${type}`} marginTop={2}>
            {description}
          </Box>
          {showPaidBadge ? <PaidBadge /> : null}
        </Box>
      }
      placement="right"
    >
      <Button
        variant="ghost"
        fontWeight="400"
        width="100%"
        justifyContent="left"
        onMouseEnter={() => {
          clearTimeout(openingTimeoutRef.current);
          openingTimeoutRef.current = setTimeout(() => {
            onOpen();
          }, 500);
        }}
        onMouseLeave={() => {
          clearTimeout(openingTimeoutRef.current);
          onClose();
        }}
        onMouseDown={() => {
          clearTimeout(openingTimeoutRef.current);
          onClose();
        }}
        onFocus={() => {
          clearTimeout(openingTimeoutRef.current);
          openingTimeoutRef.current = setTimeout(() => {
            onOpen();
          }, 500);
        }}
        onBlur={() => {
          clearTimeout(openingTimeoutRef.current);
          onClose();
        }}
        onClick={async () => {
          await onAddField(type);
        }}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            clearTimeout(openingTimeoutRef.current);
            onClose();
            await onAddField(type);
          }
        }}
      >
        <PetitionFieldTypeLabel type={type} />
      </Button>
    </SmallPopover>
  );
}

function getPetitionFieldTypeDescription(intl: IntlShape, type: PetitionFieldType) {
  switch (type) {
    case "FILE_UPLOAD":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.file-upload-description",
        defaultMessage: "Set up a document or file upload field, with optional PDF annexing.",
      });
    case "SHORT_TEXT":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.short-text-description",
        defaultMessage:
          "Create a short-answer field, with optional format validation (e.g., email, IBAN).",
      });
    case "TEXT":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.text-description",
        defaultMessage:
          "Add a long-answer field for detailed input, such as descriptions, addresses, etc.",
      });
    case "NUMBER":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.number",
        defaultMessage: "Set up a numeric entry field for amounts, quantities, etc.",
      });
    case "PHONE":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.phone",
        defaultMessage: "Create a field for phone number entries.",
      });
    case "HEADING":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.heading-description",
        defaultMessage: "Insert headings, paragraphs and page breaks.",
      });
    case "SELECT":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.select-description",
        defaultMessage: "Enable selection from a dropdown list of options.",
      });
    case "DYNAMIC_SELECT":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.dynamic-select-description",
        defaultMessage:
          "Include cascading dropdowns where each selection dynamically updates the next options list.",
      });
    case "CHECKBOX":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.checkbox",
        defaultMessage: "Include a list of options to choose from.",
      });
    case "DATE":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.date",
        defaultMessage: "Create a date selection field.",
      });
    case "DATE_TIME":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.date-time",
        defaultMessage: "Set up a field for date and time entries.",
      });
    case "ES_TAX_DOCUMENTS":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.tax-documents-description",
        defaultMessage:
          "Simplify retrieval of official documents from Spanish authorities (e.g., AEAT, DGT, and Social Security).",
      });
    case "DOW_JONES_KYC":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.dow-jones-kyc-research-description",
        defaultMessage:
          "Easily search in Dow Jones to run a background check of an individual or legal entity.",
      });
    case "BACKGROUND_CHECK":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.background-check-description",
        defaultMessage: "Integrate an internal search field for sanctions lists and PEPs.",
      });
    case "FIELD_GROUP":
      return intl.formatMessage({
        id: "util.get-petition-field-type-description.field-group-description",
        defaultMessage:
          "Group fields to gather information from the same profile, or multiple profiles.",
      });
    default:
      throw new Error(`Missing description PetitionFieldType  "${type}"`);
  }
}

function getPetitionFieldTypeKeywords(type: PetitionFieldType) {
  switch (type) {
    case "FILE_UPLOAD":
      return [
        "files",
        "upload",
        "documents",
        "pdf",
        "annexes",
        "attachment",
        "adjuntar",
        "documentos",
        "subir",
        "anexos",
        "adjuntos",
        "archivos",
        "imágenes",
        "images",
      ];
    case "SHORT_TEXT":
      return [
        "texto",
        "text",
        "escribir",
        "write",
        "corto",
        "short",
        "account",
        "cuenta",
        "pasaporte",
        "passport",
        "email",
        "correo",
        "electrónico",
        "iban",
        "address",
        "dirección",
        "description",
        "descripción",
        "name",
        "nombre",
        "phone",
        "teléfono",
        "url",
        "website",
        "webpage",
        "página web",
        "dni/nie",
        "national",
        "postal code",
        "código postal",
        "zip",
        "nif",
        "tax",
        "id",
        "iban",
        "social security",
        "seguridad social",
      ];
    case "TEXT":
      return [
        "long",
        "largo",
        "dirección",
        "address",
        "write",
        "escribir",
        "textarea",
        "description",
        "descripción",
        "comments",
        "comentarios",
        "notes",
        "notas",
      ];
    case "NUMBER":
      return [
        "amount",
        "cantidad",
        "quantity",
        "cantidades",
        "quantities",
        "total",
        "total",
        "price",
        "precio",
        "discount",
        "descuento",
        "percentages",
        "porcentajes",
        "rate",
        "tasa",
        "interest",
        "interés",
        "tax",
        "impuesto",
        "números",
        "numbers",
      ];
    case "PHONE":
      return [
        "phone",
        "teléfono",
        "number",
        "número",
        "mobile",
        "móvil",
        "cell",
        "celular",
        "call",
        "llamar",
        "contact",
        "contacto",
        "contactar",
      ];
    case "HEADING":
      return [
        "help",
        "ayuda",
        "instructions",
        "instrucciones",
        "notes",
        "notas",
        "title",
        "título",
        "cláusula",
        "párrafo",
        "clause",
        "paragraph",
        "salto de página",
        "page break",
        "encabezado",
        "heading",
        "header",
        "texto",
        "text",
        "sección",
        "section",
      ];
    case "SELECT":
      return [
        "list of",
        "countries",
        "EU",
        "non-EU",
        "currencies",
        "listado",
        "países",
        "ue",
        "divisas",
        "monedas",
      ];
    case "DYNAMIC_SELECT":
      return [
        "opciones",
        "elegir",
        "desplegable múltiple",
        "encadenar",
        "escoger",
        "selección",
        "options",
        "choices",
        "select",
        "multiple",
        "chain",
      ];
    case "CHECKBOX":
      return [
        "options",
        "multiple",
        "choice",
        "choices",
        "casillas",
        "selection",
        "opciones",
        "múltiple respuesta",
        "multiple choice",
        "escoger",
        "choose",
        "radio button",
        "elección",
        "elecciones",
        "selección",
      ];
    case "DATE":
      return [
        "día",
        "day",
        "month",
        "mes",
        "year",
        "año",
        "date",
        "fecha",
        "birth",
        "nacimiento",
        "expiration",
        "caducidad",
        "start",
        "inicio",
        "end",
        "fin",
        "due",
        "vencimiento",
        "deadline",
        "plazo",
        "delivery",
        "entrega",
      ];
    case "DATE_TIME":
      return [
        "date",
        "fecha",
        "time",
        "hora",
        "start",
        "inicio",
        "end",
        "fin",
        "due",
        "vencimiento",
        "deadline",
        "plazo",
        "delivery",
        "entrega",
      ];
    case "ES_TAX_DOCUMENTS":
      return [
        "documentos oficiales",
        "official documents",
        "spanish",
        "agencia tributaria",
        "tax return",
        "vat",
        "tax",
        "documents",
        "official",
        "aeat",
        "seguridad social",
        "dgt",
        "tráfico",
        "renta",
        "irpf",
        "declaración",
        "vida laboral",
        "catastro",
        "036",
        "iva",
        "social security",
        "impuestos",
        "documentos",
      ];
    case "DOW_JONES_KYC":
      return [];
    case "BACKGROUND_CHECK":
      return [
        "sanctions",
        "PEPs",
        "background",
        "check",
        "research",
        "sanciones",
        "antecedentes",
        "comprobación",
        "investigación",
        "persona expuesta políticamente",
        "politically exposed person",
        "relaciones",
        "relationships",
        "político",
      ];
    case "FIELD_GROUP":
      return [
        "identificar",
        "identify",
        "propiedades",
        "properties",
        "party",
        "agrupar",
        "parte",
        "contacto",
        "contact",
        "group",
        "profile",
        "multiple",
        "fields",
        "perfil",
        "múltiples",
        "campos",
        "grupo",
      ];
    default:
      throw new Error(`Missing keywords PetitionFieldType  "${type}"`);
  }
}
