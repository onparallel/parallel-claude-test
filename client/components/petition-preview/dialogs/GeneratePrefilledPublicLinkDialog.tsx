import { gql, useFragment_experimental, useMutation } from "@apollo/client";
import {
  Button,
  Center,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightAddon,
  List,
  ListItem,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CopyToClipboardButton } from "@parallel/components/common/CopyToClipboardButton";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import { OverflownText } from "@parallel/components/common/OverflownText";
import { PathName } from "@parallel/components/common/PathName";
import { PetitionFieldReference } from "@parallel/components/petition-activity/PetitionFieldReference";
import { useSelectFolderDialog } from "@parallel/components/petition-common/dialogs/SelectFolderDialog";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition-common/PetitionFieldTypeIndicator";
import {
  GeneratePrefilledPublicLinkDialog_createPublicPetitionLinkPrefillDataDocument,
  GeneratePrefilledPublicLinkDialog_PetitionTemplateFragmentDoc,
} from "@parallel/graphql/__types";
import { useFieldIndices } from "@parallel/utils/fieldIndices";
import { isFileTypeField } from "@parallel/utils/isFileTypeField";
import { toCanvas } from "qrcode";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage } from "react-intl";
import { isDefined, noop, zip } from "remeda";

export function GeneratePrefilledPublicLinkDialog({
  petitionId,
  ...props
}: DialogProps<{ petitionId: string }, void>) {
  const { data } = useFragment_experimental({
    fragment: GeneratePrefilledPublicLinkDialog_PetitionTemplateFragmentDoc,
    fragmentName: "GeneratePrefilledPublicLinkDialog_PetitionTemplate",
    from: {
      __typename: "PetitionTemplate",
      id: petitionId,
    },
  });
  const [link, setLink] = useState<string | null>(null);
  const [path, setPath] = useState(data!.defaultPath);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const showSelectFolderDialog = useSelectFolderDialog();
  const handleChangePath = async function () {
    try {
      const newPath = await showSelectFolderDialog({ type: "PETITION", currentPath: path });
      setPath(newPath);
    } catch {}
  };

  const indices = useFieldIndices(data!.fields);
  const fieldsWithIndices = zip(data!.fields, indices).filter(
    ([field]) =>
      isDefined(field.alias) &&
      !isFileTypeField(field.type) &&
      !field.isReadOnly &&
      field.previewReplies.length > 0
  );

  const [createPublicPetitionLinkPrefillData, { loading }] = useMutation(
    GeneratePrefilledPublicLinkDialog_createPublicPetitionLinkPrefillDataDocument
  );

  const handleGenerateClick = async function () {
    const res = await createPublicPetitionLinkPrefillData({
      variables: {
        publicPetitionLinkId: data!.publicLink!.id,
        path,
        data: Object.fromEntries(
          fieldsWithIndices.map(([field]) => [
            field.alias!,
            field.type === "DYNAMIC_SELECT"
              ? field.previewReplies.map((r) => (r.content.value as string[]).map((v) => v[1]))
              : field.previewReplies.map((r) => r.content.value),
          ])
        ),
      },
    });
    setLink(res.data!.createPublicPetitionLinkPrefillData);
  };

  const handleDownloadQrCode = function () {
    const a = document.createElement("a");
    a.download = "qr.png";
    a.href = canvasRef.current!.toDataURL();
    a.click();
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (link) {
      setTimeout(() => toCanvas(canvasRef.current, link));
    }
  }, [link]);

  return (
    <ConfirmDialog
      {...props}
      size="lg"
      initialFocusRef={cancelRef}
      header={
        <FormattedMessage
          id="component.generate-prefilled-public-link-dialog.header"
          defaultMessage="Create prefilled link"
        />
      }
      body={
        <>
          {link ? (
            <Stack>
              <Center>
                <canvas ref={canvasRef} />
              </Center>
              <InputGroup size="sm">
                <Input size="sm" borderRadius="md" type="text" value={link} onChange={noop} />
                <InputRightAddon borderRadius="md" padding={0}>
                  <CopyToClipboardButton
                    size="sm"
                    border={"1px solid"}
                    borderColor="inherit"
                    borderLeftRadius={0}
                    text={link}
                  />
                </InputRightAddon>
              </InputGroup>
            </Stack>
          ) : (
            <Stack>
              <Text>
                <FormattedMessage
                  id="component.generate-prefilled-public-link-dialog.text"
                  defaultMessage="Click on {button} to generate a <em>prefilled</em> public link."
                  values={{
                    em: (chunks: any) => <Text as="em">{chunks}</Text>,
                    button: (
                      <Text as="strong">
                        <FormattedMessage
                          id="component.generate-prefilled-public-link-dialog.confirm-button"
                          defaultMessage="Generate link"
                        />
                      </Text>
                    ),
                  }}
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="component.generate-prefilled-public-link-dialog.text-2"
                  defaultMessage="Parallels created from this link will be prefilled with the current replies."
                />
              </Text>
              <FormControl as={HStack}>
                <FormLabel fontWeight="normal" margin={0}>
                  <FormattedMessage
                    id="component.generate-prefilled-public-link-dialog.folder"
                    defaultMessage="Folder for created parallels:"
                  />{" "}
                  <PathName as="strong" type="PETITION" path={path} />
                </FormLabel>
                <Button size="xs" onClick={handleChangePath}>
                  <FormattedMessage id="generic.change" defaultMessage="Change" />
                </Button>
              </FormControl>
              <List>
                {fieldsWithIndices.map(([field, fieldIndex]) => (
                  <ListItem as={HStack} key={field.id}>
                    <PetitionFieldTypeIndicator
                      as="div"
                      type={field.type}
                      fieldIndex={fieldIndex}
                      isTooltipDisabled
                      flexShrink={0}
                    />
                    <OverflownText>
                      <PetitionFieldReference field={field} as="span" />
                    </OverflownText>
                  </ListItem>
                ))}
              </List>
              <Text textAlign="center" fontStyle="italic">
                <FormattedMessage
                  id="component.generate-prefilled-public-link-dialog.text-3"
                  defaultMessage="Only non-file fields with a defined reference are considered."
                />
              </Text>
            </Stack>
          )}
        </>
      }
      alternative={
        link ? (
          <Button onClick={handleDownloadQrCode}>
            <FormattedMessage id="generic.download-qr" defaultMessage="Download QR code" />
          </Button>
        ) : null
      }
      cancel={
        link ? (
          <></>
        ) : (
          <Button ref={cancelRef} onClick={() => props.onReject("CANCEL")}>
            <FormattedMessage id="generic.cancel" defaultMessage="Cancel" />
          </Button>
        )
      }
      confirm={
        link ? (
          <Button colorScheme="primary" onClick={() => props.onResolve()}>
            <FormattedMessage id="generic.close" defaultMessage="Close" />
          </Button>
        ) : (
          <Button colorScheme="primary" onClick={handleGenerateClick} isLoading={loading}>
            <FormattedMessage
              id="component.generate-prefilled-public-link-dialog.confirm-button"
              defaultMessage="Generate link"
            />
          </Button>
        )
      }
    />
  );
}

const _mutations = [
  gql`
    mutation GeneratePrefilledPublicLinkDialog_createPublicPetitionLinkPrefillData(
      $data: JSONObject!
      $path: String
      $publicPetitionLinkId: GID!
    ) {
      createPublicPetitionLinkPrefillData(
        data: $data
        publicPetitionLinkId: $publicPetitionLinkId
        path: $path
      )
    }
  `,
];

GeneratePrefilledPublicLinkDialog.fragments = {
  PetitionTemplate: gql`
    fragment GeneratePrefilledPublicLinkDialog_PetitionTemplate on PetitionTemplate {
      id
      defaultPath
      publicLink {
        id
      }
      fields {
        id
        type
        multiple
        alias
        isReadOnly
        previewReplies @client {
          content
        }
        ...PetitionFieldReference_PetitionField
      }
    }
    ${PetitionFieldReference.fragments.PetitionField}
  `,
};

export function useGeneratePrefilledPublicLinkDialog() {
  return useDialog(GeneratePrefilledPublicLinkDialog);
}
