import { gql } from "@apollo/client";
import { Box, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import {
  ProfileFieldValue,
  ProfileFieldValueContent_ProfileTypeFieldFragment,
} from "@parallel/graphql/__types";
import { never } from "@parallel/utils/never";
import { ProfileTypeFieldOptions } from "@parallel/utils/profileFields";
import { assertType } from "@parallel/utils/types";
import { FormattedDate, FormattedMessage, FormattedNumber } from "react-intl";
import { isNullish } from "remeda";
import { BreakLines } from "./BreakLines";
import { LocalizableUserTextRender } from "./LocalizableUserTextRender";

export const ProfileFieldValueContent = Object.assign(
  chakraForwardRef<
    "p" | "span",
    {
      field: ProfileFieldValueContent_ProfileTypeFieldFragment;
      content: ProfileFieldValue["content"];
    }
  >(function ProfileFieldValueContent({ field, content, ...props }, ref) {
    if (isNullish(content)) {
      return (
        <Box ref={ref} as="span" textStyle="hint" {...props}>
          <FormattedMessage
            id="component.profile-field-value-content.no-value"
            defaultMessage="No value"
          />
        </Box>
      );
    } else if (field.type === "SHORT_TEXT") {
      return (
        <Box as="span" ref={ref} {...props}>
          {content.value}
        </Box>
      );
    } else if (field.type === "TEXT") {
      return (
        <Text ref={ref} {...props}>
          <BreakLines>{content.value}</BreakLines>
        </Text>
      );
    } else if (field.type === "SELECT") {
      assertType<ProfileTypeFieldOptions<"SELECT">>(field.options);
      const option = field.options.values.find((o) => o.value === content.value);
      return isNullish(option) ? (
        <Box as="span" ref={ref} {...props}>
          {content.value}
        </Box>
      ) : field.options.showOptionsWithColors ? (
        <Box
          as="span"
          ref={ref}
          display="inline-block"
          color="gray.800"
          paddingInline={2}
          lineHeight={6}
          height={6}
          fontSize="sm"
          backgroundColor={option.color}
          borderRadius="full"
          {...props}
        >
          <LocalizableUserTextRender value={option.label} default={null} />
        </Box>
      ) : (
        <Box as="span" ref={ref} {...props}>
          <LocalizableUserTextRender value={option.label} default={null} />
        </Box>
      );
    } else if (field.type === "DATE") {
      return (
        <Box as="span" ref={ref} {...props}>
          <FormattedDate value={content.value} />
        </Box>
      );
    } else if (field.type === "PHONE") {
      return (
        <Box as="span" ref={ref} {...props}>
          {content.pretty}
        </Box>
      );
    } else if (field.type === "NUMBER") {
      return (
        <Box as="span" ref={ref} {...props}>
          <FormattedNumber value={content.value} />
        </Box>
      );
    } else {
      never(`ProfileTypeFieldType ${field.type} not implemented`);
    }
  }),
  {
    fragments: {
      ProfileTypeField: gql`
        fragment ProfileFieldValueContent_ProfileTypeField on ProfileTypeField {
          id
          type
          options
        }
      `,
    },
  },
);
