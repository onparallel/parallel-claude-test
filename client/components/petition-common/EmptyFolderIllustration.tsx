import { Center, Image, Stack } from "@chakra-ui/react";
import { chakraComponent } from "@parallel/chakra/utils";
import { FormattedMessage } from "react-intl";
import { Text } from "@parallel/components/ui";

interface EmptyFolderIllustrationProps {
  isTemplate: boolean;
}

export const EmptyFolderIllustration = chakraComponent<"div", EmptyFolderIllustrationProps>(
  function ({ ref, isTemplate, ...props }) {
    return (
      <Center ref={ref} {...props}>
        <Stack justifyContent="center" alignItems="center" minHeight="300px" paddingX={4}>
          <Image
            maxWidth="282px"
            height="80px"
            width="100%"
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/empty_folder.svg`}
          />

          <Text paddingTop={5} fontWeight="600">
            <FormattedMessage
              id="component.empty-folder-illustration.title"
              defaultMessage="The folder is empty"
            />
          </Text>
          {!isTemplate ? null : (
            <Text>
              <FormattedMessage
                id="component.empty-folder-illustration.create-new-template"
                defaultMessage="Create a new template to be saved in this folder."
              />
            </Text>
          )}
        </Stack>
      </Center>
    );
  },
);
