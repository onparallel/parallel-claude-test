import { Center, Stack, Text } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";
import { EmptyTemplatesIcon } from "./icons/EmptyTemplatesIcon";

interface NewPetitionEmptyTemplatesProps {
  onClickPublicTemplates: () => void;
  onClickNewTemplate: () => void;
}

export const NewPetitionEmptyTemplates = chakraForwardRef<"div", NewPetitionEmptyTemplatesProps>(
  function ({ onClickPublicTemplates, onClickNewTemplate, ...props }, ref) {
    return (
      <Center ref={ref} {...props}>
        <Stack justifyContent="center" alignItems="center" minHeight="300px" paddingX={4}>
          <EmptyTemplatesIcon maxWidth="282px" height="77px" width="100%" />
          <Text paddingTop={6}>
            <FormattedMessage
              id="new-petition.no-templates"
              defaultMessage="You don't have any templates here yet."
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.new-petition-empty-templates.try-public-or-create"
              defaultMessage="Try one of our <LinkPublic>public templates</LinkPublic> or <LinkTemplate>create your own</LinkTemplate>!"
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
          </Text>
        </Stack>
      </Center>
    );
  }
);
