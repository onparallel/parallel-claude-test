import { gql, useMutation } from "@apollo/client";
import {
  AlertDescription,
  AlertIcon,
  Badge,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  Radio,
  RadioGroup,
  Select,
  Spinner,
  Stack,
  Switch,
  Text,
  useTheme,
} from "@chakra-ui/react";
import { Card } from "@parallel/components/common/Card";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ColorInput } from "@parallel/components/common/ColorInput";
import { ContactSupportAlert } from "@parallel/components/common/ContactSupportAlert";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { Divider } from "@parallel/components/common/Divider";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileSize } from "@parallel/components/common/FileSize";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { OnlyAdminsAlert } from "@parallel/components/common/OnlyAdminsAlert";
import {
  BrandingGeneralForm_updateOrganizationBrandThemeDocument,
  BrandingGeneralForm_updateOrganizationBrandThemeMutationVariables,
  BrandingGeneralForm_updateOrganizationPreferredToneDocument,
  BrandingGeneralForm_updateOrgLogoDocument,
  BrandingGeneralForm_UserFragment,
  Tone,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { isAtLeast } from "@parallel/utils/roles";
import { useDebouncedAsync } from "@parallel/utils/useDebouncedAsync";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import Color from "color";
import { useMemo, useRef, useState } from "react";
import { DropzoneRef, FileRejection } from "react-dropzone";
import { IMaskInput } from "react-imask";
import { FormattedMessage, useIntl } from "react-intl";
import fonts from "../../../utils/webSafeFonts.json";

interface BrandingGeneralFormProps {
  user: BrandingGeneralForm_UserFragment;
}

const MAX_FILE_SIZE = 1024 * 1024;

export function BrandingGeneralForm({ user }: BrandingGeneralFormProps) {
  const intl = useIntl();
  const dropzoneRef = useRef<DropzoneRef>(null);
  const hasAdminRole = isAtLeast("ADMIN", user.role);

  const logoSrc =
    user.organization.logoUrl ?? `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`;

  const tone = user.organization.preferredTone;
  const theme = user.organization.brandTheme;

  const parallelTheme = useTheme();

  const [color, setColor] = useState(theme?.color ?? parallelTheme.colors.primary[500]);
  const [invalidColor, setInvalidColor] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [fontFamily, setFontFamily] = useState(theme?.fontFamily ?? "DEFAULT");

  const genericErrorToast = useGenericErrorToast();
  const showErrorDialog = useErrorDialog();
  const [updateLogo, { loading }] = useMutation(BrandingGeneralForm_updateOrgLogoDocument);
  const handleLogoUpload = async (files: File[], rejected: FileRejection[]) => {
    if (rejected.length > 0) {
      await showErrorDialog({
        message: intl.formatMessage(
          {
            id: "organization.branding.logo-error",
            defaultMessage: "The logo must be an image file of size up to {size}.",
          },
          { size: <FileSize value={MAX_FILE_SIZE} /> }
        ),
      });
    } else {
      await updateLogo({ variables: { file: files[0] } });
    }
  };

  const [changePreferredTone] = useMutation(
    BrandingGeneralForm_updateOrganizationPreferredToneDocument
  );

  const handleToneChange = async (tone: Tone) => {
    changePreferredTone({
      variables: {
        tone,
      },
    });
  };

  const [updateOrganizationBrandTheme] = useMutation(
    BrandingGeneralForm_updateOrganizationBrandThemeDocument
  );

  const debouncedUpdateOrganizationBrandTheme = useDebouncedAsync(
    async function (
      data: BrandingGeneralForm_updateOrganizationBrandThemeMutationVariables["data"]
    ) {
      await updateOrganizationBrandTheme({
        variables: { data },
      });
    },
    500,
    []
  );

  const handleColorChange = async (color: string) => {
    try {
      setColor(color);
      const isError = !/^#[a-f\d]{6}$/i.test(color);
      if (isError) {
        setInvalidColor(true);
      } else {
        setIsLight(new Color(color).isLight());
        setInvalidColor(false);
        await debouncedUpdateOrganizationBrandTheme({
          color,
        });
      }
    } catch (error) {
      if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
        if ((error.graphQLErrors[0].extensions.extra as any).code === "INVALID_HEX_VALUE_ERROR") {
          setInvalidColor(true);
        }
      } else if (error !== "DEBOUNCED") {
        genericErrorToast();
      }
    }
  };

  const handleFontFamilyChange = async (fontFamily: string) => {
    try {
      setFontFamily(fontFamily);
      await updateOrganizationBrandTheme({
        variables: {
          data: {
            fontFamily: fontFamily === "DEFAULT" ? null : fontFamily,
          },
        },
      });
    } catch {
      genericErrorToast();
    }
  };

  const sortedFonts = useMemo(
    () =>
      fonts.sort(function (a, b) {
        return a[0].localeCompare(b[0]);
      }),
    [fonts]
  );

  return (
    <Stack spacing={8} maxWidth={{ base: "100%", xl: "container.2xs" }} width="100%">
      {!hasAdminRole ? <OnlyAdminsAlert /> : null}
      <Stack spacing={4}>
        <Stack>
          <Heading as="h4" size="md" fontWeight="semibold">
            <FormattedMessage id="organization.branding.brand" defaultMessage="Brand" />
          </Heading>
          <Text>
            <FormattedMessage
              id="organization.branding.brand-description"
              defaultMessage="Your brand will be used in the messages and petitions you send."
            />
          </Text>
        </Stack>
        <Card padding={4}>
          <Dropzone
            ref={dropzoneRef}
            as={Center}
            onDrop={handleLogoUpload}
            accept={{
              "image/gif": [".gif"],
              "image/png": [".png"],
              "image/jpeg": [".jpeg", ".jpg"],
            }}
            maxSize={MAX_FILE_SIZE}
            multiple={false}
            height="200px"
            maxWidth="100%"
            textAlign="center"
            disabled={!hasAdminRole}
          >
            {loading ? (
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="primary.500"
                size="xl"
              />
            ) : (
              <Image
                boxSize="300px"
                height="200px"
                objectFit="contain"
                alt={user.organization.name}
                src={logoSrc}
                fallback={
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="primary.500"
                    size="xl"
                  />
                }
              />
            )}
          </Dropzone>
          <Flex marginTop={4}>
            <Button
              flex="1"
              colorScheme="primary"
              onClick={() => dropzoneRef.current?.open()}
              isDisabled={!hasAdminRole}
            >
              <FormattedMessage
                id="organization.branding.upload-logo"
                defaultMessage="Upload a new logo"
              />
            </Button>
          </Flex>
        </Card>
      </Stack>
      <Stack spacing={6}>
        <FormControl>
          <HStack>
            <FormLabel display="flex" marginY={0} alignItems="center" fontWeight="normal">
              <FormattedMessage
                id="component.branding-general-form.primary-color"
                defaultMessage="Primary color"
              />
              <HelpPopover>
                <FormattedMessage
                  id="component.branding-general-form.primary-color-help"
                  defaultMessage="This color will be used in the buttons and links of your messages and petitions with recipient."
                />
              </HelpPopover>
            </FormLabel>

            <HStack>
              <Input
                as={IMaskInput}
                {...({
                  mask: "#AAAAAA",
                  definitions: { A: /[0-9A-Fa-f]/ },
                  onAccept: (value: string) => handleColorChange(value),
                } as any)}
                minWidth="102px"
                backgroundColor="white"
                value={color}
                isInvalid={invalidColor}
              />
              <FormControl height="40px">
                <ColorInput
                  width="40px"
                  minWidth="40px"
                  borderRadius="100%"
                  value={color}
                  onChange={(value) => handleColorChange(value)}
                  isInvalid={invalidColor}
                />
              </FormControl>
            </HStack>
          </HStack>
          {isLight ? (
            <CloseableAlert status="warning" backgroundColor="orange.100" marginTop={4}>
              <AlertIcon color="yellow.500" />
              <AlertDescription>
                <FormattedMessage
                  id="component.branding-general-form.primary-color-warning"
                  defaultMessage="The color you have entered is too light. We recommend using a darker color to improve readability."
                />
              </AlertDescription>
            </CloseableAlert>
          ) : null}
        </FormControl>
        <FormControl>
          <HStack align="center">
            <FormLabel display="flex" alignItems="center" fontWeight="normal" whiteSpace="nowrap">
              <FormattedMessage
                id="component.branding-general-form.main-font"
                defaultMessage="Main font"
              />
              <HelpPopover>
                <FormattedMessage
                  id="component.branding-general-form.main-font-help"
                  defaultMessage="This font will be used in your emails and petitions. The list includes only secure fonts for all email clients."
                />
              </HelpPopover>
            </FormLabel>
            <Select
              backgroundColor="white"
              value={fontFamily}
              onChange={(e) => {
                handleFontFamilyChange(e.target.value);
              }}
            >
              <option key="Default" value="DEFAULT">
                {intl.formatMessage({ id: "generic.by-default", defaultMessage: "By default" })}
              </option>
              {sortedFonts.map((font, index) => (
                <option key={index} value={font[1]}>
                  {font[0]}
                </option>
              ))}
            </Select>
          </HStack>
        </FormControl>
        <FormControl>
          <FormLabel fontWeight="normal">
            <FormattedMessage
              id="organization.branding.tone-header"
              defaultMessage="Tone of the messages"
            />
          </FormLabel>
          <RadioGroup
            as={Stack}
            spacing={2}
            onChange={handleToneChange}
            value={tone}
            isDisabled={!hasAdminRole}
          >
            <Radio backgroundColor="white" value="INFORMAL">
              <Text>
                <FormattedMessage id="generic.tone-informal" defaultMessage="Informal" />
              </Text>
            </Radio>
            <Radio backgroundColor="white" value="FORMAL">
              <Text>
                <FormattedMessage id="generic.tone-formal" defaultMessage="Formal" />
              </Text>
            </Radio>
          </RadioGroup>
        </FormControl>
      </Stack>
      <Divider borderColor="gray.300" />
      <Stack spacing={4}>
        <HStack spacing={3}>
          <Stack flex="1" spacing={2}>
            <HStack alignItems="center">
              <Heading as="h4" size="md" fontWeight="semibold">
                <FormattedMessage
                  id="organization.branding.parallel-branding-header"
                  defaultMessage="Parallel Branding"
                />
              </Heading>
              {user.hasRemovedParallelBranding ? null : (
                <Badge colorScheme="primary">
                  <FormattedMessage id="generic.plans.enterprise" defaultMessage="Enterprise" />
                </Badge>
              )}
            </HStack>
            <Text>
              <FormattedMessage
                id="organization.branding.parallel-branding-description"
                defaultMessage="Displays the Parallel branding on all emails and parallels that are sent."
              />
            </Text>
          </Stack>
          <Switch size="md" isChecked={!user.hasRemovedParallelBranding} isDisabled={true} />
        </HStack>
        {user.hasRemovedParallelBranding ? null : (
          <ContactSupportAlert
            body={
              <Text>
                {intl.formatMessage({
                  id: "generic.upgrade-to-enable",
                  defaultMessage: "Upgrade to enable this feature.",
                })}
              </Text>
            }
            contactMessage={intl.formatMessage({
              id: "organization.branding.parallel-branding-message",
              defaultMessage:
                "Hi, I would like to get more information about how to upgrade my plan to hide Parallel branding.",
            })}
          />
        )}
      </Stack>
    </Stack>
  );
}

BrandingGeneralForm.mutations = [
  gql`
    mutation BrandingGeneralForm_updateOrgLogo($file: Upload!) {
      updateOrganizationLogo(file: $file) {
        id
        logoUrl(options: { resize: { width: 600 } })
      }
    }
  `,
  gql`
    mutation BrandingGeneralForm_updateOrganizationPreferredTone($tone: Tone!) {
      updateOrganizationPreferredTone(tone: $tone) {
        id
        preferredTone
      }
    }
  `,
  gql`
    mutation BrandingGeneralForm_updateOrganizationBrandTheme($data: OrganizationBrandThemeInput!) {
      updateOrganizationBrandTheme(data: $data) {
        id
        brandTheme
      }
    }
  `,
];

BrandingGeneralForm.fragments = {
  User: gql`
    fragment BrandingGeneralForm_User on User {
      id
      role
      hasRemovedParallelBranding: hasFeatureFlag(featureFlag: REMOVE_PARALLEL_BRANDING)
      organization {
        id
        name
        preferredTone
        brandTheme
        logoUrl(options: { resize: { width: 600 } })
      }
    }
  `,
};
