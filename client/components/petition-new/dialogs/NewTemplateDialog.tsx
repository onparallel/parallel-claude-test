import { Box, Button, Center, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { CheckedBoxIcon, ContractIcon, FileNewIcon, PaperPlaneIcon } from "@parallel/chakra/icons";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { ReactNode, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";

type NewTemplateDialogData = string | null;

type PreviewsType = {
  key: string;
  icon: ReactNode;
  background: string;
  title: string;
  description: string;
  image: string;
  templateId: string | null;
};

export function NewTemplateDialog({ ...props }: DialogProps<{}, NewTemplateDialogData>) {
  const intl = useIntl();

  const previews = useMemo(
    () =>
      [
        {
          key: "CONTRACT",
          icon: <ContractIcon color="blue.800" boxSize={6} />,
          background: "blue.100",
          title: intl.formatMessage({
            id: "component.new-template-dialog.contract-template",
            defaultMessage: "Contract template",
          }),
          description: intl.formatMessage({
            id: "component.new-template-dialog.contract-template-description",
            defaultMessage: "Service contracts, rental and sale contracts, NDAs, etc.",
          }),
          image: "contract-preview",
          templateId:
            intl.locale === "es"
              ? process.env.NEXT_PUBLIC_TEMPLATE_CONTRACT_ES
              : process.env.NEXT_PUBLIC_TEMPLATE_CONTRACT_EN,
        },
        {
          key: "CHECKLIST",
          icon: <PaperPlaneIcon color="purple.800" boxSize={6} />,
          background: "purple.100",
          title: intl.formatMessage({
            id: "component.new-template-dialog.information-template",
            defaultMessage: "Information checklist",
          }),
          description: intl.formatMessage({
            id: "component.new-template-dialog.information-template-description",
            defaultMessage: "Customer onboarding (KYC), tax declaration, etc.",
          }),
          image: "checklist-preview",
          templateId:
            intl.locale === "es"
              ? process.env.NEXT_PUBLIC_TEMPLATE_CHECKLIST_ES
              : process.env.NEXT_PUBLIC_TEMPLATE_CHECKLIST_EN,
        },
        {
          key: "AUTHORIZATION",
          icon: <CheckedBoxIcon color="green.800" boxSize={6} />,
          background: "green.100",
          title: intl.formatMessage({
            id: "component.new-template-dialog.authorization-template",
            defaultMessage: "Authorization template",
          }),
          description: intl.formatMessage({
            id: "component.new-template-dialog.authorization-template-description",
            defaultMessage: "Power of Attorney, proxy voting at meetings, etc.",
          }),
          image: "authorization-preview",
          templateId:
            intl.locale === "es"
              ? process.env.NEXT_PUBLIC_TEMPLATE_AUTHORIZATION_ES
              : process.env.NEXT_PUBLIC_TEMPLATE_AUTHORIZATION_EN,
        },
        {
          key: "SCRATCH",
          icon: <FileNewIcon color="orange.800" boxSize={6} />,
          background: "orange.100",
          title: intl.formatMessage({
            id: "component.new-template-dialog.default-template",
            defaultMessage: "Template from scratch",
          }),
          description: intl.formatMessage({
            id: "component.new-template-dialog.default-template-description",
            defaultMessage: "Create a template as unique as your process.",
          }),
          image: "default-preview",
          templateId: null,
        },
      ] as PreviewsType[],
    [intl.locale]
  );

  const [activePreview, setActivePreview] = useState<PreviewsType>(previews[0]);

  const handleCreateTemplate = (id: string | null) => {
    props.onResolve(id);
  };
  return (
    <ConfirmDialog
      size="6xl"
      hasCloseButton
      header={
        <FormattedMessage
          id="component.new-template-dialog.title"
          defaultMessage="What do you want to create?"
        />
      }
      body={
        <HStack spacing={4} alignItems="flex-start">
          <Stack spacing={4} flex="1">
            <Text fontSize="sm">
              <FormattedMessage
                id="component.new-template-dialog.select-or-create"
                defaultMessage="Select the template that best fits your needs."
              />
            </Text>
            <Stack flex="1">
              {previews.map((preview) => {
                const { key, icon, background, title, description, templateId } = preview;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    display="block"
                    onFocus={() => setActivePreview(preview)}
                    onMouseEnter={() => setActivePreview(preview)}
                    onClick={() => handleCreateTemplate(templateId)}
                    padding={4}
                    height="auto"
                    textAlign="left"
                    fontWeight="normal"
                  >
                    <HStack spacing={4} paddingY={0.5}>
                      <Center padding={2} borderRadius="md" backgroundColor={background}>
                        {icon}
                      </Center>
                      <Stack spacing={1}>
                        <Text fontWeight="bold">{title}</Text>
                        <Text
                          fontSize="sm"
                          color="gray.600"
                          whiteSpace={{ base: "break-spaces", md: "nowrap" }}
                        >
                          {description}
                        </Text>
                      </Stack>
                    </HStack>
                  </Button>
                );
              })}
            </Stack>
          </Stack>
          <Box maxWidth="750px" display={{ base: "none", md: "block" }}>
            <Image
              color="transparent"
              alt={intl.formatMessage(
                {
                  id: "component.new-template-dialog.thumbnail-alt",
                  defaultMessage: 'Thumbnail for template example "{type}"',
                },
                { type: activePreview.title }
              )}
              src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/templates/${activePreview.image}.png`}
            />
          </Box>
        </HStack>
      }
      confirm={<></>}
      cancel={<></>}
      {...props}
    />
  );
}

export function useNewTemplateDialog() {
  return useDialog(NewTemplateDialog);
}
