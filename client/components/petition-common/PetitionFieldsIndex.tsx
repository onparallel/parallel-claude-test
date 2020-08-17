import { Card, CardHeader } from "../common/Card";
import { Stack, Box, Button, Text } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { gql } from "@apollo/client";
import { PetitionFieldsIndex_PetitionFieldFragment } from "@parallel/graphql/__types";
import { PetitionFieldTypeIndicator } from "./PetitionFieldTypeIndicator";
import { FormattedMessage } from "react-intl";
import { Divider } from "../common/Divider";
import { Fragment } from "react";

export type PetitionFieldsIndexProps = ExtendChakra<{
  fields: PetitionFieldsIndex_PetitionFieldFragment[];
  onFieldClick: (fieldId: string) => void;
}>;

export function PetitionFieldsIndex({
  fields,
  onFieldClick,
  ...props
}: PetitionFieldsIndexProps) {
  return (
    <Card display="flex" flexDirection="column" {...props}>
      <CardHeader>
        <FormattedMessage
          id="petition-fields-index.header"
          defaultMessage="Contents"
        />
      </CardHeader>
      <Box overflow="auto">
        <Stack as="ol" spacing={1} padding={4}>
          {fields.map((field, index) => (
            <Fragment key={field.id}>
              {index > 0 &&
              field.type === "HEADING" &&
              field.options?.hasPageBreak ? (
                <Divider
                  role="separator"
                  position="relative"
                  paddingTop={1}
                  marginBottom={1}
                >
                  <Text
                    as="div"
                    position="absolute"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    backgroundColor="white"
                    paddingX={1}
                    fontSize="xs"
                    lineHeight={3}
                    height={3}
                    color="gray.500"
                  >
                    <FormattedMessage
                      id="generic.page-break"
                      defaultMessage="Page break"
                    />
                  </Text>
                </Divider>
              ) : null}
              <Box as="li" listStyleType="none" display="flex">
                <Button
                  flex="1"
                  variant="ghost"
                  alignItems="center"
                  height="auto"
                  padding={2}
                  paddingLeft={field.type === "HEADING" ? 2 : 4}
                  fontWeight="normal"
                  textAlign="left"
                  onClick={() => onFieldClick(field.id)}
                >
                  {field.title ? (
                    <Text as="div" flex="1" minWidth={0}>
                      <Text as="div" isTruncated>
                        {field.title}
                      </Text>
                    </Text>
                  ) : (
                    <Text as="div" flex="1" color="gray.400" fontStyle="italic">
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
                  <PetitionFieldTypeIndicator
                    as="div"
                    type={field.type}
                    index={index}
                    marginLeft={2}
                  />
                </Button>
              </Box>
            </Fragment>
          ))}
        </Stack>
      </Box>
    </Card>
  );
}

PetitionFieldsIndex.fragments = {
  PetitionField: gql`
    fragment PetitionFieldsIndex_PetitionField on PetitionField {
      id
      title
      type
      options
    }
  `,
};
