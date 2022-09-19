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
  Radio,
  RadioGroup,
  Select,
  Spinner,
  Stack,
  Switch,
  Text,
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
  BrandingGeneral_updateOrganizationBrandThemeDocument,
  BrandingGeneral_updateOrgLogoDocument,
  BrandingGeneral_UserFragment,
  Maybe,
  Tone,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { isAtLeast } from "@parallel/utils/roles";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import Color from "color";
import { useMemo, useRef } from "react";
import { DropzoneRef, FileRejection } from "react-dropzone";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import fonts from "../../../utils/webSafeFonts.json";
import { useAutoConfirmDiscardChangesDialog } from "../dialogs/ConfirmDiscardChangesDialog";
import { BrandingGeneralPreview } from "./BrandingGeneralPreview";

interface BrandingGeneralProps {
  user: BrandingGeneral_UserFragment;
}

interface BrandingGeneralData {
  preferredTone: Tone;
  color: string;
  fontFamily: string | null;
  logo: Maybe<File> | string;
}

const MAX_FILE_SIZE = 1024 * 1024;

export function BrandingGeneral({ user }: BrandingGeneralProps) {
  const intl = useIntl();
  const dropzoneRef = useRef<DropzoneRef>(null);
  const {
    handleSubmit,
    register,
    formState: { errors, isDirty, isValid, dirtyFields },
    setError,
    control,
    reset,
    watch,
  } = useForm<BrandingGeneralData>({
    mode: "onChange",
    defaultValues: {
      preferredTone: user.organization.brandTheme.preferredTone,
      color: user.organization.brandTheme.color,
      fontFamily: user.organization.brandTheme.fontFamily ?? "DEFAULT",
      logo: user.organization.logoUrl,
    },
  });
  useAutoConfirmDiscardChangesDialog(isDirty);

  const { preferredTone, color, logo, fontFamily } = watch();

  const isLight =
    /^#[a-f\d]{6}$/i.test(color) && new Color(color).contrast(new Color("#ffffff")) < 3;

  const hasAdminRole = isAtLeast("ADMIN", user.role);
  const sortedFonts = useMemo(
    () =>
      fonts.sort(function (a, b) {
        return a[0].localeCompare(b[0]);
      }),
    [fonts]
  );

  const objectUrl = useMemo(() => {
    return logo && typeof logo !== "string"
      ? URL.createObjectURL(logo)
      : logo ?? `${process.env.NEXT_PUBLIC_ASSETS_URL}/static/emails/logo.png`;
  }, [logo]);

  const showGenericErrorToast = useGenericErrorToast();
  const showErrorDialog = useErrorDialog();
  const [updateLogo, { loading: updateLogoLoading }] = useMutation(
    BrandingGeneral_updateOrgLogoDocument
  );
  const [updateOrganizationBrandTheme, { loading: updateBrandLoading }] = useMutation(
    BrandingGeneral_updateOrganizationBrandThemeDocument
  );

  return (
    <Stack
      padding={6}
      flexDirection={{ base: "column", xl: "row" }}
      gridGap={{ base: 8, xl: 16 }}
      paddingBottom={16}
      as="form"
      onSubmit={handleSubmit(async (data) => {
        const { color, fontFamily, preferredTone, logo } = dirtyFields;

        try {
          if (color || fontFamily || preferredTone) {
            await updateOrganizationBrandTheme({
              variables: {
                data: {
                  color: data.color,
                  fontFamily: data.fontFamily !== "DEFAULT" ? data.fontFamily : null,
                  preferredTone: data.preferredTone,
                },
              },
            });
          }
          if (logo && data.logo && typeof data.logo !== "string") {
            await updateLogo({ variables: { file: data.logo } });
          }
          reset(data);
        } catch (error) {
          if (isApolloError(error, "ARG_VALIDATION_ERROR")) {
            if (
              (error.graphQLErrors[0].extensions.extra as any).code === "INVALID_HEX_VALUE_ERROR"
            ) {
              setError("color", { type: "validate" });
            }
          } else {
            showGenericErrorToast(error);
          }
        }
      })}
      noValidate
    >
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
                defaultMessage="Your brand will be used in the messages and parallels you send."
              />
            </Text>
          </Stack>

          <Controller
            name="logo"
            control={control}
            render={({ field: { onChange } }) => (
              <Card padding={4}>
                <Dropzone
                  as={Center}
                  ref={dropzoneRef}
                  onDrop={async (files: File[], rejected: FileRejection[]) => {
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
                      onChange(files[0]);
                    }
                  }}
                  accept={{
                    "image/png": [".png"],
                    "image/gif": [".gif"],
                    "image/jpeg": [".jpeg", ".jpg"],
                  }}
                  maxSize={MAX_FILE_SIZE}
                  multiple={false}
                  height="200px"
                  maxWidth="100%"
                  textAlign="center"
                  disabled={!hasAdminRole}
                >
                  <Image
                    boxSize="300px"
                    height="200px"
                    objectFit="contain"
                    alt={user.organization.name}
                    src={objectUrl}
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
            )}
          />
        </Stack>

        <Stack spacing={6}>
          <FormControl isInvalid={!!errors.color}>
            <HStack>
              <FormLabel
                display="flex"
                marginY={0}
                alignItems="center"
                fontWeight="normal"
                whiteSpace="nowrap"
              >
                <FormattedMessage
                  id="component.branding-general.primary-color"
                  defaultMessage="Primary color"
                />
                <HelpPopover>
                  <FormattedMessage
                    id="component.branding-general.primary-color-help"
                    defaultMessage="This color will be used in the buttons and links of your messages and parallels with recipient."
                  />
                </HelpPopover>
              </FormLabel>
              <Controller
                name="color"
                control={control}
                rules={{
                  validate: (v) => /^#[a-f\d]{6}$/i.test(v),
                }}
                render={({ field: { onChange, value } }) => (
                  <ColorInput value={value} onChange={onChange} />
                )}
              />
            </HStack>
            {isLight ? (
              <CloseableAlert status="warning" backgroundColor="orange.100" marginTop={4}>
                <AlertIcon color="yellow.500" />
                <AlertDescription>
                  <FormattedMessage
                    id="component.branding-general.primary-color-warning"
                    defaultMessage="The color you have entered is a bit too light. We recommend using a darker color to improve readability."
                  />
                </AlertDescription>
              </CloseableAlert>
            ) : null}
          </FormControl>
          <FormControl>
            <HStack align="center">
              <FormLabel
                display="flex"
                alignItems="center"
                marginY={0}
                fontWeight="normal"
                whiteSpace="nowrap"
              >
                <FormattedMessage
                  id="component.branding-general.main-font"
                  defaultMessage="Main font"
                />
                <HelpPopover>
                  <FormattedMessage
                    id="component.branding-general.main-font-help"
                    defaultMessage="This font will be used in your emails and parallels. The list includes only secure fonts for all email clients."
                  />
                </HelpPopover>
              </FormLabel>
              <Select backgroundColor="white" {...register("fontFamily")}>
                <option key="Default" value="DEFAULT">
                  {intl.formatMessage({
                    id: "generic.default-font-name",
                    defaultMessage: "Default",
                  })}
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
            <Controller
              name="preferredTone"
              control={control}
              render={({ field: { onChange, value } }) => (
                <RadioGroup
                  as={Stack}
                  spacing={2}
                  isDisabled={!hasAdminRole}
                  onChange={onChange}
                  value={value}
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
              )}
            />
          </FormControl>
          <Button
            type="submit"
            width={{ base: "auto", sm: "fit-content" }}
            colorScheme="primary"
            isDisabled={!isDirty || !isValid}
            isLoading={updateBrandLoading || updateLogoLoading}
          >
            <FormattedMessage
              id="component.branding-general.save-changes"
              defaultMessage="Save changes"
            />
          </Button>
        </Stack>
        <Divider borderColor="gray.300" />
        <ParallelBrandingSwitch hasRemovedParallelBranding={user.hasRemovedParallelBranding} />
      </Stack>
      <BrandingGeneralPreview
        user={user}
        brand={{ color, fontFamily, preferredTone }}
        logo={logo}
      />
    </Stack>
  );
}

BrandingGeneral.fragments = {
  User: gql`
    fragment BrandingGeneral_User on User {
      id
      role
      hasRemovedParallelBranding: hasFeatureFlag(featureFlag: REMOVE_PARALLEL_BRANDING)
      organization {
        id
        name
        brandTheme {
          color
          fontFamily
          preferredTone
        }
        logoUrl(options: { resize: { width: 600 } })
      }
      ...BrandingGeneralPreview_User
    }
    ${BrandingGeneralPreview.fragments.User}
  `,
};

BrandingGeneral.mutations = [
  gql`
    mutation BrandingGeneral_updateOrgLogo($file: Upload!) {
      updateOrganizationLogo(file: $file) {
        id
        logoUrl(options: { resize: { width: 600 } })
      }
    }
  `,
  gql`
    mutation BrandingGeneral_updateOrganizationBrandTheme($data: OrganizationBrandThemeInput!) {
      updateOrganizationBrandTheme(data: $data) {
        id
        brandTheme {
          color
          fontFamily
          preferredTone
        }
      }
    }
  `,
];

function ParallelBrandingSwitch({
  hasRemovedParallelBranding,
}: {
  hasRemovedParallelBranding: boolean;
}) {
  const intl = useIntl();
  return (
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
            {hasRemovedParallelBranding ? null : (
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
        <Switch size="md" isChecked={!hasRemovedParallelBranding} isDisabled={true} />
      </HStack>
      {hasRemovedParallelBranding ? null : (
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
  );
}
