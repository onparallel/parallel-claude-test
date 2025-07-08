import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Center,
  Checkbox,
  FormControl,
  HStack,
  ListItem,
  OrderedList,
  Progress,
  Stack,
  Text,
  UnorderedList,
} from "@chakra-ui/react";
import { DeleteIcon, DownloadIcon, SignatureIcon } from "@parallel/chakra/icons";
import { BreakLines } from "@parallel/components/common/BreakLines";
import {
  ContactSelect,
  ContactSelectInstance,
  ContactSelectSelection,
} from "@parallel/components/common/ContactSelect";
import { DateTime } from "@parallel/components/common/DateTime";
import { Dropzone } from "@parallel/components/common/Dropzone";
import { FileIcon } from "@parallel/components/common/FileIcon";
import { FileName } from "@parallel/components/common/FileName";
import { FileSize } from "@parallel/components/common/FileSize";
import { GrowingTextarea } from "@parallel/components/common/GrowingTextarea";
import { HelpPopover } from "@parallel/components/common/HelpPopover";
import { IconButtonWithTooltip } from "@parallel/components/common/IconButtonWithTooltip";
import { PaddedCollapse } from "@parallel/components/common/PaddedCollapse";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  ConfirmPetitionSignersDialog_PetitionSignerFragment,
  ConfirmPetitionSignersDialog_SignatureConfigFragment,
  ConfirmPetitionSignersDialog_UserFragment,
  ConfirmPetitionSignersDialog_createCustomSignatureDocumentUploadLinkDocument,
  ConfirmPetitionSignersDialog_petitionDocument,
  SignatureConfigInputSigner,
} from "@parallel/graphql/__types";
import { Fragments } from "@parallel/utils/apollo/fragments";
import { FORMATS } from "@parallel/utils/dates";
import { downloadLocalFile } from "@parallel/utils/downloadLocalFile";
import { fullName } from "@parallel/utils/fullName";
import { useCreateContact } from "@parallel/utils/mutations/useCreateContact";
import { Maybe } from "@parallel/utils/types";
import { UploadFileError, uploadFile } from "@parallel/utils/uploadFile";
import { useSearchContacts } from "@parallel/utils/useSearchContacts";
import { useRef, useState } from "react";
import { FileRejection } from "react-dropzone";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, partition } from "remeda";
import { SelectedSignerRow } from "../SelectedSignerRow";
import { SuggestedSigners } from "../SuggestedSigners";
import { useConfirmSignerInfoDialog } from "./ConfirmSignerInfoDialog";

interface ConfirmPetitionSignersDialogProps {
  user: ConfirmPetitionSignersDialog_UserFragment;
  signatureConfig: ConfirmPetitionSignersDialog_SignatureConfigFragment;
  isUpdate?: boolean;
  petitionId: string;
  isInteractionWithRecipientsEnabled: boolean;
}

export interface ConfirmPetitionSignersDialogResult {
  signers: SignatureConfigInputSigner[];
  message: Maybe<string>;
  allowAdditionalSigners: boolean;
  customDocumentTemporaryFileId: Maybe<string>;
}

export type SignerSelectSelection = Omit<
  ConfirmPetitionSignersDialog_PetitionSignerFragment,
  "__typename" | "isPreset" | "fullName"
> & {
  isPreset?: boolean | null;
};

const MAX_SIGNERS_ALLOWED = 40;
const MAX_FILESIZE = 1024 * 1024 * 10;

export function ConfirmPetitionSignersDialog(
  props: DialogProps<ConfirmPetitionSignersDialogProps, ConfirmPetitionSignersDialogResult>,
) {
  const { minSigners, instructions, signingMode, useCustomDocument } = props.signatureConfig;
  const [presetSigners, otherSigners] = partition(
    props.signatureConfig.signers.filter(isNonNullish),
    (s) => s.isPreset,
  );

  const petitionId = props.petitionId;
  const { data } = useQuery(ConfirmPetitionSignersDialog_petitionDocument, {
    variables: { id: petitionId },
  });

  const petition = data?.petition;

  const isSequential = signingMode === "SEQUENTIAL";

  const {
    control,
    handleSubmit,
    watch,
    register,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ConfirmPetitionSignersDialogResult>({
    mode: "onSubmit",
    defaultValues: {
      signers: otherSigners.map((s) => ({
        ...s,
        signWithEmbeddedImageId: s.embeddedSignatureImage300?.id,
      })),
      message: null,
      allowAdditionalSigners: props.isInteractionWithRecipientsEnabled
        ? props.signatureConfig.allowAdditionalSigners
        : false,
      customDocumentTemporaryFileId: null,
    },
  });

  const [showMessage, setShowMessage] = useState(false);

  const signers = watch("signers");
  const allowAdditionalSigners = watch("allowAdditionalSigners");

  const allSigners = [
    ...presetSigners.map((s) => ({
      ...s,
      signWithEmbeddedImageId: s.embeddedSignatureImage300?.id,
    })),
    ...signers,
  ];

  const handleSearchContacts = useSearchContacts();
  const handleCreateContact = useCreateContact();
  const intl = useIntl();

  const showConfirmSignerInfo = useConfirmSignerInfoDialog();
  const [selectedContact, setSelectedContact] = useState<ContactSelectSelection | null>(null);
  const contactSelectRef = useRef<ContactSelectInstance<false>>(null);

  const handleContactSelectOnChange =
    (onChange: (...events: any[]) => void) => async (contact: ContactSelectSelection | null) => {
      try {
        const repeatedSigners = allSigners.filter((s) => s.email === contact!.email);

        onChange([
          ...signers,
          repeatedSigners.length > 0
            ? await showConfirmSignerInfo({
                selection: {
                  ...contact!,
                  signWithDigitalCertificate: false,
                },
                repeatedSigners,
                hasSignWithDigitalCertificate: props.user.hasSignWithDigitalCertificate,
                hasSignWithEmbeddedImage: props.user.hasSignWithEmbeddedImage,
                disableSignWithDigitalCertificate:
                  props.signatureConfig.integration?.provider !== "SIGNATURIT",
              })
            : contact!,
        ]);
      } catch {}
      setSelectedContact(null);
    };

  const handleSelectedSignerRowOnEditClick =
    (onChange: (...events: any[]) => void, signer: SignerSelectSelection, index: number) =>
    async () => {
      try {
        onChange([
          ...signers.slice(0, index),
          await showConfirmSignerInfo({
            selection: signer,
            repeatedSigners: [],
            hasSignWithDigitalCertificate: props.user.hasSignWithDigitalCertificate,
            hasSignWithEmbeddedImage: props.user.hasSignWithEmbeddedImage,
            disableSignWithDigitalCertificate:
              props.signatureConfig.integration?.provider !== "SIGNATURIT",
          }),
          ...signers.slice(index + 1),
        ]);
      } catch {}
    };

  const isMaxSignersReached = allSigners.length >= MAX_SIGNERS_ALLOWED;
  const showSignersAddedByRecipient = allowAdditionalSigners && (props.isUpdate ?? false);
  const ListElement = isSequential ? OrderedList : UnorderedList;

  const [createCustomSignatureDocumentUploadLink] = useMutation(
    ConfirmPetitionSignersDialog_createCustomSignatureDocumentUploadLinkDocument,
  );

  const [fileDropError, setFileDropError] = useState<string | null>(null);
  const [customDocument, setCustomDocument] = useState<Maybe<File>>(null);
  const [uploadTime, setUploadTime] = useState<Date | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const onDownloadCustomFile = () => {
    if (customDocument) {
      downloadLocalFile(customDocument);
    }
  };

  const onRemoveCustomFile = () => {
    setCustomDocument(null);
    setFileDropError(null);
    setValue("customDocumentTemporaryFileId", null);
    setUploadTime(null);
  };

  async function handleFileDrop(files: File[], rejected: FileRejection[]) {
    if (rejected.length > 0) {
      setFileDropError(rejected[0].errors[0].code);
    } else if (files.length === 1) {
      const file = files[0];

      if (isNonNullish(file)) {
        setFileDropError(null);
        setCustomDocument(file);
        const { data } = await createCustomSignatureDocumentUploadLink({
          variables: {
            petitionId,
            file: {
              contentType: file.type,
              filename: file.name,
              size: file.size,
            },
          },
        });

        try {
          await uploadFile(file, data!.createCustomSignatureDocumentUploadLink.presignedPostData, {
            onProgress: (progress) => setProgress(progress),
          });
          setUploadTime(new Date());
          setValue(
            "customDocumentTemporaryFileId",
            data!.createCustomSignatureDocumentUploadLink.temporaryFileId,
          );
        } catch (e) {
          if (e instanceof UploadFileError && e.message === "Aborted") {
            // handled when aborted
          } else {
            setCustomDocument(null);
            setValue("customDocumentTemporaryFileId", null);
            setFileDropError("error-uploading-file");
          }
          return;
        }
      }
    }
  }

  return (
    <ConfirmDialog
      size="xl"
      initialFocusRef={contactSelectRef}
      closeOnOverlayClick={!isDirty}
      hasCloseButton
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(
            ({ signers, message, allowAdditionalSigners, customDocumentTemporaryFileId }) => {
              if (
                !props.isUpdate &&
                props.signatureConfig.useCustomDocument &&
                !customDocumentTemporaryFileId
              ) {
                setFileDropError("document-not-selected");
                return;
              }

              props.onResolve({
                customDocumentTemporaryFileId,
                message: showMessage ? message : null,
                signers: [
                  ...signers.map((s) => ({
                    contactId: s.contactId,
                    email: s.email,
                    firstName: s.firstName,
                    lastName: s.lastName ?? "",
                    isPreset: s.isPreset,
                    signWithDigitalCertificate: s.signWithDigitalCertificate,
                    signWithEmbeddedImage: s.signWithEmbeddedImage,
                    signWithEmbeddedImageId: s.signWithEmbeddedImageId,
                  })),
                  ...presetSigners.map((s) => ({
                    contactId: s.contactId,
                    email: s.email,
                    firstName: s.firstName,
                    lastName: s.lastName ?? "",
                    isPreset: true,
                    signWithDigitalCertificate: s.signWithDigitalCertificate,
                    signWithEmbeddedImageId: s.embeddedSignatureImage300?.id,
                  })),
                ],
                allowAdditionalSigners: props.isInteractionWithRecipientsEnabled
                  ? !isMaxSignersReached && allowAdditionalSigners
                  : false,
              });
            },
          ),
        },
      }}
      header={
        <HStack>
          <SignatureIcon />
          {props.isUpdate ? (
            <FormattedMessage
              id="component.confirm-petition-signers-dialog.edit-signers-header"
              defaultMessage="Edit signers"
            />
          ) : (
            <FormattedMessage id="generic.start-signature" defaultMessage="Start signature" />
          )}
        </HStack>
      }
      body={
        <Stack>
          {!props.isUpdate && useCustomDocument ? (
            <>
              <Text>{`1. ${intl.formatMessage({
                id: "component.confirm-petition-signers-dialog.upload-document-sign",
                defaultMessage: "Upload the document you want to sign",
              })}:`}</Text>
              {isNonNullish(customDocument) ? (
                <HStack>
                  <Center
                    boxSize={10}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    color="gray.600"
                    boxShadow="sm"
                  >
                    <FileIcon
                      boxSize={5}
                      filename={customDocument.name}
                      contentType={customDocument.type}
                    />
                  </Center>

                  <Stack flex="1" minWidth={0} whiteSpace="nowrap" spacing={0.5}>
                    <HStack>
                      <FileName value={customDocument.name} />
                      <Text as="span">-</Text>
                      <Text as="span" fontSize="xs" color="gray.500">
                        <FileSize value={customDocument.size} />
                      </Text>
                    </HStack>
                    {isNonNullish(uploadTime) ? (
                      <DateTime
                        fontSize="xs"
                        value={uploadTime}
                        format={FORMATS.LLL}
                        useRelativeTime
                      />
                    ) : (
                      <Center height="18px">
                        <Progress
                          borderRadius="sm"
                          width="100%"
                          isIndeterminate={progress === 1}
                          value={progress * 100}
                          size="xs"
                          colorScheme="green"
                        />
                      </Center>
                    )}
                  </Stack>
                  <HStack>
                    <IconButtonWithTooltip
                      onClick={onDownloadCustomFile}
                      variant="ghost"
                      icon={<DownloadIcon />}
                      size="md"
                      placement="bottom"
                      label={intl.formatMessage({
                        id: "generic.download-file",
                        defaultMessage: "Download file",
                      })}
                    />
                    <IconButtonWithTooltip
                      onClick={onRemoveCustomFile}
                      variant="ghost"
                      icon={<DeleteIcon />}
                      size="md"
                      placement="bottom"
                      label={intl.formatMessage({
                        id: "generic.remove",
                        defaultMessage: "Remove",
                      })}
                    />
                  </HStack>
                </HStack>
              ) : (
                <Dropzone
                  as={Center}
                  accept={{ "application/pdf": [".pdf"] }}
                  maxSize={MAX_FILESIZE}
                  multiple={false}
                  onDrop={handleFileDrop}
                >
                  <Text pointerEvents="none" fontSize="sm">
                    <FormattedMessage
                      id="generic.dropzone-single-default"
                      defaultMessage="Drag the file here, or click to select it"
                    />
                  </Text>
                </Dropzone>
              )}

              {fileDropError && (
                <Text color="red.500" fontSize="sm">
                  {fileDropError === "file-too-large" ? (
                    <FormattedMessage
                      id="generic.dropzone-error-file-too-large"
                      defaultMessage="The file is too large. Maximum size allowed {size}"
                      values={{ size: <FileSize value={MAX_FILESIZE} /> }}
                    />
                  ) : fileDropError === "file-invalid-type" ? (
                    <FormattedMessage
                      id="generic.dropzone-error-file-invalid-type"
                      defaultMessage="File type not allowed. Please, attach an {extension} file"
                      values={{ extension: ".pdf" }}
                    />
                  ) : fileDropError === "error-uploading-file" ? (
                    <FormattedMessage
                      id="component.confirm-petition-signers-dialog.error-uploading-file"
                      defaultMessage="There was an error uploading the file. Please try again."
                    />
                  ) : fileDropError === "document-not-selected" ? (
                    <FormattedMessage
                      id="component.confirm-petition-signers-dialog.document-not-selected"
                      defaultMessage="Please, select the document you want to sign."
                    />
                  ) : null}
                </Text>
              )}
              <Text>{`2. ${intl.formatMessage({
                id: "component.confirm-petition-signers-dialog.add-contacts-sign-document",
                defaultMessage: "Add the contacts who need to sign the document",
              })}:`}</Text>
            </>
          ) : (
            <Text>
              {presetSigners.length > 0 ? (
                isSequential ? (
                  <FormattedMessage
                    id="component.confirm-petition-signers-dialog.preset-signers-sequential"
                    defaultMessage="{names} will sign after the other signers."
                    values={{
                      names: intl.formatList(
                        presetSigners.map((s, i) => (
                          <b key={i}>{fullName(s.firstName, s.lastName)}</b>
                        )),
                      ),
                      // eslint-disable-next-line formatjs/enforce-placeholders
                      count: presetSigners.length,
                    }}
                  />
                ) : (
                  <FormattedMessage
                    id="component.confirm-petition-signers-dialog.preset-signers"
                    defaultMessage="{names} will sign together with the signers you add."
                    values={{
                      names: intl.formatList(
                        presetSigners.map((s, i) => (
                          <b key={i}>{fullName(s.firstName, s.lastName)}</b>
                        )),
                      ),
                      // eslint-disable-next-line formatjs/enforce-placeholders
                      count: presetSigners.length,
                    }}
                  />
                )
              ) : isSequential ? (
                <FormattedMessage
                  id="component.confirm-petition-signers-dialog.no-signers-set-sequential"
                  defaultMessage="We will send the document to sign to each contact after the one before has signed:"
                />
              ) : (
                <FormattedMessage
                  id="component.confirm-petition-signers-dialog.no-signers-set"
                  defaultMessage="We will send the document to the following contacts:"
                />
              )}
            </Text>
          )}

          <FormControl id="signers" isInvalid={!!errors.signers}>
            <Controller
              name="signers"
              control={control}
              rules={{
                validate: () => {
                  return showSignersAddedByRecipient || minSigners <= allSigners.length;
                },
              }}
              render={({ field: { onChange, value: signers } }) => (
                <>
                  <ListElement
                    margin={0}
                    paddingY={1}
                    maxH="210px"
                    overflowY="auto"
                    listStylePosition="inside"
                  >
                    {showSignersAddedByRecipient && (
                      <ListItem padding={2}>
                        <Text as="span">
                          <FormattedMessage
                            id="component.confirm-petition-signers-dialog.signer-added-by-recipient"
                            defaultMessage="Signers added by the recipient"
                          />
                        </Text>
                      </ListItem>
                    )}
                    {signers.map((signer, index) => (
                      <SelectedSignerRow
                        key={index}
                        isEditable={!signer.isPreset}
                        signer={signer}
                        isMe={
                          [signer.email, signer.firstName, signer.lastName].join("") ===
                          [props.user.email, props.user.firstName, props.user.lastName].join("")
                        }
                        onRemoveClick={() => onChange(signers.filter((_, i) => index !== i))}
                        onEditClick={handleSelectedSignerRowOnEditClick(
                          onChange,
                          {
                            ...signer,
                            signWithDigitalCertificate: signer.signWithDigitalCertificate ?? false,
                          },
                          index,
                        )}
                      />
                    ))}
                  </ListElement>
                  <Stack marginTop={2}>
                    {signers.length === 0 ? (
                      <Text color="gray.500">
                        <FormattedMessage
                          id="component.confirm-petition-signers-dialog.no-signers-added"
                          defaultMessage="You have not added any signers"
                        />
                      </Text>
                    ) : null}
                    <ContactSelect
                      ref={contactSelectRef as any}
                      isDisabled={isMaxSignersReached}
                      value={selectedContact}
                      onChange={handleContactSelectOnChange(onChange)}
                      onSearchContacts={handleSearchContacts}
                      onCreateContact={handleCreateContact}
                      placeholder={intl.formatMessage({
                        id: "component.confirm-petition-signers-dialog.contact-select-placeholder",
                        defaultMessage: "Add a contact to sign",
                      })}
                    />
                    {allSigners.length < minSigners ? (
                      <Text color={!!errors.signers ? "red.500" : undefined}>
                        <FormattedMessage
                          id="component.confirm-petition-signers-dialog.min-signers"
                          defaultMessage="Add at least {count, plural, =1{# signer} other{# signers}}"
                          values={{ count: minSigners - allSigners.length }}
                        />
                      </Text>
                    ) : null}
                    {instructions ? (
                      <Alert status="info" rounded="md" backgroundColor="gray.100">
                        <AlertIcon />
                        <AlertDescription>
                          <BreakLines>{instructions}</BreakLines>
                        </AlertDescription>
                      </Alert>
                    ) : null}
                    {isNonNullish(petition) ? (
                      <SuggestedSigners
                        currentSigners={allSigners}
                        isDisabled={isMaxSignersReached}
                        petition={petition}
                        user={props.user}
                        onAddSigner={(s) => onChange([...signers, s])}
                      />
                    ) : null}
                  </Stack>
                </>
              )}
            />
          </FormControl>
          {props.isUpdate ? (
            !isMaxSignersReached &&
            props.isInteractionWithRecipientsEnabled && (
              <Checkbox marginTop={4} {...register("allowAdditionalSigners")}>
                <HStack alignContent="center">
                  <FormattedMessage
                    id="component.confirm-petition-signers-dialog.allow-additional-signers-label"
                    defaultMessage="Allow recipients to add additional signers"
                  />
                  <HelpPopover>
                    <FormattedMessage
                      id="component.confirm-petition-signers-dialog.allow-additional-signers-help"
                      defaultMessage="If this option is disabled, only the indicated people will be able to sign the document."
                    />
                  </HelpPopover>
                </HStack>
              </Checkbox>
            )
          ) : (
            <FormControl isInvalid={!!errors.message}>
              <Checkbox
                marginY={4}
                isChecked={showMessage}
                onChange={(e) => setShowMessage(e.target.checked)}
              >
                <FormattedMessage
                  id="component.confirm-petition-signers-dialog.include-message"
                  defaultMessage="Include message"
                />
              </Checkbox>
              <PaddedCollapse open={showMessage}>
                <GrowingTextarea
                  {...register("message", { required: showMessage })}
                  maxHeight="30vh"
                  aria-label={intl.formatMessage({
                    id: "component.confirm-petition-signers-dialog.message-placeholder",
                    defaultMessage: "Write here a message for the signers...",
                  })}
                  placeholder={intl.formatMessage({
                    id: "component.confirm-petition-signers-dialog.message-placeholder",
                    defaultMessage: "Write here a message for the signers...",
                  })}
                  maxLength={1_000}
                />
              </PaddedCollapse>
            </FormControl>
          )}
        </Stack>
      }
      confirm={
        <Button
          data-action="start-signature"
          colorScheme="primary"
          type="submit"
          isDisabled={
            props.isUpdate
              ? false
              : allSigners.length === 0 ||
                allSigners.every(
                  (s: any) =>
                    isNonNullish(s.signWithEmbeddedImage) ||
                    isNonNullish(s.signWithEmbeddedImageId),
                )
          }
        >
          {props.isUpdate ? (
            <FormattedMessage id="generic.save" defaultMessage="Save" />
          ) : (
            <FormattedMessage id="generic.start-signature" defaultMessage="Start signature" />
          )}
        </Button>
      }
      {...props}
    />
  );
}

ConfirmPetitionSignersDialog.fragments = {
  get User() {
    return gql`
      fragment ConfirmPetitionSignersDialog_User on User {
        id
        email
        firstName
        lastName
        ...SuggestedSigners_User
        hasSignWithDigitalCertificate: hasFeatureFlag(featureFlag: SIGN_WITH_DIGITAL_CERTIFICATE)
        hasSignWithEmbeddedImage: hasFeatureFlag(featureFlag: SIGN_WITH_EMBEDDED_IMAGE)
      }
      ${SuggestedSigners.fragments.User}
    `;
  },
  get PetitionSigner() {
    return gql`
      fragment ConfirmPetitionSignersDialog_PetitionSigner on PetitionSigner {
        ...Fragments_FullPetitionSigner
        ...SelectedSignerRow_PetitionSigner
        signWithDigitalCertificate
        embeddedSignatureImage300: embeddedSignatureImage(
          options: { resize: { height: 300, fit: inside } }
        )
      }
      ${Fragments.FullPetitionSigner}
      ${SelectedSignerRow.fragments.PetitionSigner}
    `;
  },
  get SignatureConfig() {
    return gql`
      fragment ConfirmPetitionSignersDialog_SignatureConfig on SignatureConfig {
        signingMode
        minSigners
        instructions
        allowAdditionalSigners
        useCustomDocument
        signers {
          ...ConfirmPetitionSignersDialog_PetitionSigner
        }
        integration {
          provider
        }
      }
      ${this.PetitionSigner}
    `;
  },
  get PetitionField() {
    return gql`
      fragment ConfirmPetitionSignersDialog_PetitionField on PetitionField {
        id
        type
        title
        options
        alias
        replies {
          id
          content
          children {
            field {
              id
              type
              alias
              options
            }
            replies {
              id
              content
            }
          }
        }
      }
    `;
  },
  get PetitionBase() {
    return gql`
      fragment ConfirmPetitionSignersDialog_PetitionBase on PetitionBase {
        id
        ...SuggestedSigners_PetitionBase
      }
      ${SuggestedSigners.fragments.PetitionBase}
    `;
  },
};

const _mutations = [
  gql`
    mutation ConfirmPetitionSignersDialog_createCustomSignatureDocumentUploadLink(
      $petitionId: GID!
      $file: FileUploadInput!
    ) {
      createCustomSignatureDocumentUploadLink(petitionId: $petitionId, file: $file)
    }
  `,
];

const _queries = [
  gql`
    query ConfirmPetitionSignersDialog_petition($id: GID!) {
      petition(id: $id) {
        ...ConfirmPetitionSignersDialog_PetitionBase
      }
    }
    ${ConfirmPetitionSignersDialog.fragments.PetitionBase}
  `,
];

export function useConfirmPetitionSignersDialog() {
  return useDialog(ConfirmPetitionSignersDialog);
}
