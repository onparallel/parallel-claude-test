import { Box, Grid, Stack, Text } from "@chakra-ui/react";
import { Divider } from "@parallel/components/common/Divider";
import {
  LocalizableUserText,
  localizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { Fragment } from "react";
import { useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import {
  PetitionRepliesMetadataDate,
  PetitionRepliesMetadataText,
} from "./PetitionRepliesMetadata";

interface Schema {
  type: "object" | "array" | "string" | "number";
  "@label"?: LocalizableUserText;
  "@render"?: string[];
  format?: "currency" | "date";
  properties?: { [key: string]: Schema };
  items?: Schema;
}

interface PetitionRepliesFieldFileSchemaProps {
  schema: Schema;
  data: any;
}

interface CurrencyAmount {
  value: number;
  currency: string;
}

const SHOW_DEBUG_BORDER = false;

export function PetitionRepliesFieldFileSchema({
  schema,
  data,
}: PetitionRepliesFieldFileSchemaProps) {
  const intl = useIntl();

  function formatCurrencyAmount(value: CurrencyAmount | null) {
    return isNonNullish(value)
      ? intl.formatNumber(value.value, { style: "currency", currency: value.currency })
      : null;
  }
  const title = localizableUserTextRender({
    intl,
    value: schema["@label"] ?? {},
    default: "",
  });

  const renderField = (key: string, value: any, fieldSchema: Schema) => {
    const title = localizableUserTextRender({
      intl,
      value: fieldSchema["@label"] ?? {},
      default: key,
    });

    if (fieldSchema.type === "array" && Array.isArray(value)) {
      // Render array of elements
      return (
        <Stack
          key={key}
          border={SHOW_DEBUG_BORDER ? "2px solid orange" : undefined}
          gridColumnStart={1}
          gridColumnEnd={-1}
        >
          <Text as="span" fontWeight={500} color="gray.800">
            {title}
          </Text>
          <Stack paddingX={3} spacing={3} divider={<Divider />}>
            {value.map((item: any, index: number) => (
              <Fragment key={`${key}-${index}`}>{renderContent(fieldSchema.items!, item)}</Fragment>
            ))}
          </Stack>
        </Stack>
      );
    }

    if (fieldSchema.type === "object" && fieldSchema.format === "currency") {
      // Render currency amount with value and currency format
      return (
        <PetitionRepliesMetadataText
          key={key}
          label={title}
          content={formatCurrencyAmount(value)}
        />
      );
    }

    if (fieldSchema.type === "object" && typeof value === "object") {
      // Render sub-schema
      return (
        <Stack
          key={key}
          border={SHOW_DEBUG_BORDER ? "2px solid red" : undefined}
          gridColumnStart={1}
          gridColumnEnd={-1}
        >
          <Text as="span" fontWeight={500} color="gray.800">
            {title}
          </Text>
          <Box paddingX={3}>{renderContent(fieldSchema, value)}</Box>
        </Stack>
      );
    }

    // Render a value formatted as a date
    if (fieldSchema.format === "date") {
      return <PetitionRepliesMetadataDate key={key} label={title} date={value} />;
    }

    // Render simple fields
    return <PetitionRepliesMetadataText key={key} label={title} content={value ?? "-"} />;
  };

  // Render content of the main schema or sub-schemas
  const renderContent = (currentSchema: Schema, currentData: any) => {
    if (currentSchema.type === "object" && currentSchema.properties) {
      // Determine keys to display and ensure they follow schema order
      const keysToRender = currentSchema["@render"] ?? Object.keys(currentSchema.properties);

      return (
        <Grid
          templateColumns="repeat(auto-fill, minmax(320px, 1fr))"
          gap={3}
          border={SHOW_DEBUG_BORDER ? "2px dotted grey" : undefined}
        >
          {keysToRender.map((key) => {
            // Only render if the key exists in properties
            if (currentSchema.properties![key]) {
              return renderField(key, currentData[key], currentSchema.properties![key]);
            }
            return null;
          })}
        </Grid>
      );
    }
    return null;
  };

  // Main render
  return (
    <Stack
      divider={<Divider />}
      spacing={3}
      border={SHOW_DEBUG_BORDER ? "2px solid green" : undefined}
      marginBottom={3}
    >
      {Array.isArray(data) && schema.type === "array"
        ? data.map((item, index) => {
            return (
              <Fragment key={index}>
                <>
                  {title ? (
                    <Text as="span" fontWeight={500} color="gray.800" marginBottom={2}>
                      {`${title}${data.length > 1 ? ` ${index + 1}` : ""}`}
                    </Text>
                  ) : null}
                </>
                {renderContent(schema.items!, item)}
              </Fragment>
            );
          })
        : renderContent(schema, data)}
    </Stack>
  );
}
