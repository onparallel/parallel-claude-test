import { Center, Stack, Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { EmptySearchTemplatesIcon } from "./icons/EmtpySearchTemplatesIcon";

export const NewPetitionEmptySearch = ({
  onClickPublicTemplates,
  onClickNewTemplate,
}: {
  onClickPublicTemplates?: () => void;
  onClickNewTemplate: () => void;
}) => {
  return (
    <Center>
      <Stack justifyContent="center" alignItems="center" minHeight="300px">
        <EmptySearchTemplatesIcon width="166px" height="77px" />
        <Text paddingTop={6}>
          <FormattedMessage
            id="component.new-petition-empty-search.no-results"
            defaultMessage="There are no results for your search."
          />
        </Text>
        <Text>
          {onClickPublicTemplates ? (
            <FormattedMessage
              id="component.new-petition-empty-search.try-public-or-create"
              defaultMessage="Try on our <LinkPublic>public templates</LinkPublic> or <LinkTemplate>create your own</LinkTemplate>"
              values={{
                LinkTemplate: (chunks: any) => (
                  <Text
                    as="strong"
                    color="purple.500"
                    onClick={onClickNewTemplate}
                    _hover={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    {chunks}
                  </Text>
                ),
                LinkPublic: (chunks: any) => (
                  <Text
                    as="strong"
                    color="purple.500"
                    onClick={onClickPublicTemplates}
                    _hover={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    {chunks}
                  </Text>
                ),
              }}
            />
          ) : (
            <FormattedMessage
              id="component.new-petition-empty-search.other-terms-or-create"
              defaultMessage="Try other terms or <LinkTemplate>create a new template</LinkTemplate>"
              values={{
                LinkTemplate: (chunks: any) => (
                  <Text
                    as="strong"
                    color="purple.500"
                    onClick={onClickNewTemplate}
                    _hover={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    {chunks}
                  </Text>
                ),
              }}
            />
          )}
        </Text>
      </Stack>
    </Center>
  );
};
