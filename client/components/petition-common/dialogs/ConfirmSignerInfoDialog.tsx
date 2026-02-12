import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Image,
  Input,
  Switch,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { useErrorDialog } from "@parallel/components/common/dialogs/ErrorDialog";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileSize } from "@parallel/components/common/FileSize";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { Button, Flex, HStack, Stack, Text } from "@parallel/components/ui";
import { SignatureConfigInputSigner } from "@parallel/graphql/__types";
import { fullName } from "@parallel/utils/fullName";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { isValidEmail } from "@parallel/utils/validation";
import { useMemo, useRef } from "react";
import { DropzoneRef, FileRejection } from "react-dropzone";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import type { SignerSelectSelection } from "./ConfirmPetitionSignersDialog";

const MAX_FILE_SIZE = 1024 * 1024 * 1;

interface ConfirmSignerInfoDialogProps {
  selection: SignerSelectSelection & {
    signWithEmbeddedImage?: File | null;
  };
  repeatedSigners: { firstName: string; lastName?: string | null }[];
  isPetitionTemplate: boolean;
  hasSignWithDigitalCertificate: boolean;
  disableSignWithDigitalCertificate: boolean;
  hasSignWithEmbeddedImage: boolean;
}

function ConfirmSignerInfoDialog({
  selection,
  repeatedSigners,
  isPetitionTemplate,
  hasSignWithDigitalCertificate,
  disableSignWithDigitalCertificate,
  hasSignWithEmbeddedImage,
  ...props
}: DialogProps<
  ConfirmSignerInfoDialogProps,
  SignatureConfigInputSigner & { signWithEmbeddedImage?: File }
>) {
  const intl = useIntl();

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    watch,
  } = useForm<SignatureConfigInputSigner & { useEmbeddedSignatureImage?: boolean }>({
    mode: "onSubmit",
    defaultValues: {
      email: selection.email,
      firstName: selection.firstName,
      lastName: selection.lastName,
      isPreset: selection.isPreset ?? false,
      ...(hasSignWithDigitalCertificate &&
        !disableSignWithDigitalCertificate && {
          signWithDigitalCertificate: selection.signWithDigitalCertificate ?? false,
        }),
      ...(hasSignWithEmbeddedImage && {
        useEmbeddedSignatureImage:
          isNonNullish(selection.signWithEmbeddedImageFileUploadId) ||
          isNonNullish(selection.signWithEmbeddedImage),
        signWithEmbeddedImageFileUploadId: selection.signWithEmbeddedImageFileUploadId,
        signWithEmbeddedImage: selection.signWithEmbeddedImage ?? null,
      }),
    },
  });
  const dropzoneRef = useRef<DropzoneRef>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const firstNameProps = useRegisterWithRef(firstNameRef, register, "firstName", {
    required: true,
  });
  const showErrorDialog = useErrorDialog();

  const signWithDigitalCertificate = watch("signWithDigitalCertificate");
  const useEmbeddedSignatureImage = watch("useEmbeddedSignatureImage");
  const signWithEmbeddedImage = watch("signWithEmbeddedImage");

  const embedSignatureImageObjectUrl = useMemo(() => {
    return isNonNullish(signWithEmbeddedImage) && typeof signWithEmbeddedImage !== "string"
      ? URL.createObjectURL(signWithEmbeddedImage)
      : "";
  }, [signWithEmbeddedImage]);

  return (
    <ConfirmDialog
      initialFocusRef={firstNameRef}
      size="md"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit((data) => {
            const { useEmbeddedSignatureImage, signWithEmbeddedImage, email, ...rest } = data;
            props.onResolve({
              ...rest,
              email: useEmbeddedSignatureImage ? null : email,
              signWithEmbeddedImage: useEmbeddedSignatureImage
                ? (signWithEmbeddedImage ?? undefined)
                : undefined,
              signWithEmbeddedImageFileUploadId:
                useEmbeddedSignatureImage &&
                isNonNullish(selection.signWithEmbeddedImageFileUploadId)
                  ? selection.signWithEmbeddedImageFileUploadId
                  : undefined,
            });
          }),
        },
      }}
      header={
        <FormattedMessage
          id="component.confirm-signer-info-dialog.title"
          defaultMessage="Confirm the signer's information"
        />
      }
      body={
        <Stack>
          {repeatedSigners.length > 0 ? (
            <>
              <Text fontSize="14px">
                <FormattedMessage
                  id="component.confirm-signer-info-dialog.body"
                  defaultMessage="You already added this email for <b>{signersList}</b>. You can modify the name and add it again."
                  values={{
                    signersList: intl.formatList(
                      repeatedSigners.map((s) => fullName(s.firstName, s.lastName)),
                    ),
                  }}
                />
              </Text>
              <Alert status="warning" rounded="md">
                <AlertIcon />
                <Stack gap={1}>
                  <AlertTitle fontSize="14px">
                    <FormattedMessage
                      id="component.confirm-signer-info-dialog.alert-title"
                      defaultMessage="Each signature email includes a unique and personalized link."
                    />
                  </AlertTitle>
                  <AlertDescription fontSize="14px">
                    <FormattedMessage
                      id="component.confirm-signer-info-dialog.alert-description"
                      defaultMessage="If you add multiple signers with the same email address, they'll receive as many separate emails as the number of signers you've assigned to that address."
                    />
                  </AlertDescription>
                </Stack>
              </Alert>
            </>
          ) : null}

          {useEmbeddedSignatureImage ? null : (
            <FormControl id="email" isInvalid={!!errors.email}>
              <FormLabel fontWeight={500}>
                <FormattedMessage id="generic.email" defaultMessage="Email" />
              </FormLabel>
              <Input
                type="email"
                {...register("email", {
                  required: true,
                  validate: (v) => !!v && isValidEmail(v),
                })}
                placeholder={intl.formatMessage({
                  id: "generic.forms.company-email-placeholder",
                  defaultMessage: "example@company.com",
                })}
              />

              <FormErrorMessage>
                <FormattedMessage
                  id="generic.forms-invalid-email-error"
                  defaultMessage="Please, enter a valid email"
                />
              </FormErrorMessage>
            </FormControl>
          )}

          <FormControl isInvalid={!!errors.firstName}>
            <FormLabel fontWeight={500}>
              <FormattedMessage id="generic.forms-first-name-label" defaultMessage="First name" />
            </FormLabel>
            <Input {...firstNameProps} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.invalid-first-name-error"
                defaultMessage="Please, enter the first name"
              />
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.lastName}>
            <FormLabel fontWeight={500}>
              <FormattedMessage id="generic.forms-last-name-label" defaultMessage="Last name" />
            </FormLabel>
            <Input {...register("lastName", { required: true })} />
            <FormErrorMessage>
              <FormattedMessage
                id="generic.forms-invalid-last-name-error"
                defaultMessage="Please, enter the last name"
              />
            </FormErrorMessage>
          </FormControl>
          {isPetitionTemplate ? (
            <FormControl>
              <HStack alignItems="center" justifyContent="space-between">
                <Flex alignItems="center">
                  <FormLabel fontWeight={400} margin="auto">
                    <FormattedMessage
                      id="component.confirm-signer-info-dialog.is-preset"
                      defaultMessage="Required signer"
                    />
                  </FormLabel>
                  <HelpPopover>
                    <Text fontSize="sm">
                      <FormattedMessage
                        id="component.confirm-signer-info-dialog.is-preset-popover"
                        defaultMessage="Required signers cannot be removed once the parallel is created."
                      />
                    </Text>
                  </HelpPopover>
                </Flex>
                <Switch {...register("isPreset")} />
              </HStack>
            </FormControl>
          ) : null}
          {hasSignWithDigitalCertificate ? (
            <FormControl
              isDisabled={disableSignWithDigitalCertificate || useEmbeddedSignatureImage}
            >
              <HStack alignItems="center" justifyContent="space-between">
                <Flex alignItems="center">
                  <FormLabel fontWeight={400} margin="auto">
                    <FormattedMessage
                      id="component.confirm-signer-info-dialog.sign-with-digital-certificate"
                      defaultMessage="Sign with digital certificate"
                    />
                  </FormLabel>
                  <HelpPopover>
                    <Stack fontSize="sm">
                      <Text>
                        <FormattedMessage
                          id="component.confirm-signer-info-dialog.sign-with-digital-certificate-popover-1"
                          defaultMessage="Enable this option to require a digital certificate for signing."
                        />
                      </Text>
                      <Text>
                        <FormattedMessage
                          id="component.confirm-signer-info-dialog.sign-with-digital-certificate-popover-2"
                          defaultMessage="This setting is only recommended for signers within the organization who have a digital certificate stored in their Signaturit account or uses Ivsign."
                        />
                      </Text>
                    </Stack>
                  </HelpPopover>
                </Flex>
                <Switch {...register("signWithDigitalCertificate")} />
              </HStack>
            </FormControl>
          ) : null}
          {hasSignWithEmbeddedImage ? (
            <FormControl
              as={Stack}
              isDisabled={signWithDigitalCertificate ?? false}
              isInvalid={!!errors.signWithEmbeddedImage}
            >
              <HStack alignItems="center" justifyContent="space-between">
                <Flex alignItems="center">
                  <FormLabel fontWeight={400} margin="auto">
                    <FormattedMessage
                      id="component.confirm-signer-info-dialog.embed-signature-image"
                      defaultMessage="Embed signature image"
                    />
                  </FormLabel>
                  <HelpPopover>
                    <Stack fontSize="sm">
                      <Text>
                        <FormattedMessage
                          id="component.confirm-signer-info-dialog.embed-signature-image-popover-1"
                          defaultMessage="Enable this setting to use an image instead of signing manually."
                        />
                      </Text>
                      <Text>
                        <FormattedMessage
                          id="component.confirm-signer-info-dialog.embed-signature-image-popover-2"
                          defaultMessage="Please note that using an image does not meet the requirements to be considered an advanced electronic signature."
                        />
                      </Text>
                    </Stack>
                  </HelpPopover>
                </Flex>
                <Switch {...register("useEmbeddedSignatureImage")} />
              </HStack>
              <PaddedCollapse open={useEmbeddedSignatureImage ?? false}>
                <Stack>
                  <Controller
                    control={control}
                    name="signWithEmbeddedImage"
                    rules={{
                      required:
                        useEmbeddedSignatureImage &&
                        isNullish(selection.signWithEmbeddedImageFileUploadId),
                    }}
                    render={({ field }) => (
                      <Dropzone
                        as={Center}
                        ref={dropzoneRef}
                        onDrop={async (files: File[], rejected: FileRejection[]) => {
                          if (rejected.length > 0) {
                            await showErrorDialog({
                              message: intl.formatMessage(
                                {
                                  id: "component.confirm-signer-info-dialog.embed-signature-image-error",
                                  defaultMessage:
                                    "The signature image must be an .PNG image file of size up to {size}.",
                                },
                                { size: <FileSize value={MAX_FILE_SIZE} /> },
                              ),
                            });
                          } else {
                            field.onChange(files[0]);
                          }
                        }}
                        accept={{
                          "image/png": [".png"],
                        }}
                        maxSize={MAX_FILE_SIZE}
                        multiple={false}
                        height="160px"
                        maxWidth="100%"
                        textAlign="center"
                        disabled={false}
                        isInvalid={!!errors.signWithEmbeddedImage}
                      >
                        <Image
                          maxWidth="100%"
                          height="150px"
                          objectFit="contain"
                          alt={intl.formatMessage({
                            id: "component.confirm-signer-info-dialog.embed-signature-image-alt",
                            defaultMessage: "Signature image",
                          })}
                          src={
                            embedSignatureImageObjectUrl ||
                            selection.signWithEmbeddedImageUrl300 ||
                            undefined
                          }
                          fallback={
                            <Stack textAlign="center" gap={1}>
                              <Text fontSize="sm">
                                <FormattedMessage
                                  id="component.confirm-signer-info-dialog.embed-signature-image-fallback"
                                  defaultMessage="No image selected"
                                />
                              </Text>
                              <Text fontSize="sm">
                                (
                                <FormattedMessage
                                  id="component.confirm-signer-info-dialog.embed-signature-image-fallback-description"
                                  defaultMessage="PNG file of size up to {size}"
                                  values={{
                                    size: <FileSize value={MAX_FILE_SIZE} />,
                                  }}
                                />
                                )
                              </Text>
                            </Stack>
                          }
                        />
                      </Dropzone>
                    )}
                  />

                  <Button onClick={() => dropzoneRef.current?.open()}>
                    <FormattedMessage
                      id="component.confirm-signer-info-dialog.upload-signature-image-button"
                      defaultMessage="Upload image"
                    />
                  </Button>
                </Stack>
              </PaddedCollapse>
            </FormControl>
          ) : null}
        </Stack>
      }
      confirm={
        <Button colorPalette="primary" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
      {...props}
    />
  );
}

export function useConfirmSignerInfoDialog() {
  return useDialog(ConfirmSignerInfoDialog);
}
