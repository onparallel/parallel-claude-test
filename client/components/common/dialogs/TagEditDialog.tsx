import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { EditIcon } from "@parallel/chakra/icons";
import { TagEditDialog_updateTagDocument } from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { isNotEmptyText } from "@parallel/utils/strings";
import { ReactNode, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { TagColorSelect } from "../TagColorSelect";
import { TagSelect } from "../TagSelect";
import { ConfirmDialog } from "./ConfirmDialog";
import { DialogProps, useDialog } from "./DialogProvider";

interface TagEditDialogData {
  tagId: string | null;
  name: string;
  color: string | null;
}

export function TagEditDialog({ ...props }: DialogProps) {
  const {
    handleSubmit,
    register,
    reset,
    control,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<TagEditDialogData>({
    mode: "onSubmit",
    defaultValues: {
      tagId: null,
      name: "",
      color: null,
    },
  });

  const [updateTag, { loading: isUpdating }] = useMutation(TagEditDialog_updateTagDocument);
  const tagId = watch("tagId");

  const [id, setId] = useState(0);

  return (
    <ConfirmDialog
      {...props}
      content={{
        as: "form",
        onSubmit: handleSubmit(async ({ tagId, color, name }) => {
          try {
            await updateTag({
              variables: { id: tagId!, data: { color, name } },
            });
            reset({ tagId, color, name });
            setId((id) => id + 1);
          } catch (e) {
            if (isApolloError(e, "TAG_ALREADY_EXISTS")) {
              setError("name", { type: "unavailable" });
            }
          }
        }),
      }}
      hasCloseButton
      closeOnEsc
      header={
        <Stack direction="row" alignItems="center">
          <EditIcon position="relative" />
          <Text as="div" flex="1">
            <FormattedMessage id="component.tag-edit-dialog.header" defaultMessage="Edit tags" />
          </Text>
        </Stack>
      }
      body={
        <Box>
          <FormControl>
            <FormLabel>
              <FormattedMessage id="component.tag-edit-dialog.tag-label" defaultMessage="Tag" />
            </FormLabel>
            <Controller
              name="tagId"
              control={control}
              render={({ field }) => (
                <TagSelect
                  key={id}
                  value={field.value}
                  onChange={(tag) => reset({ tagId: tag!.id, name: tag!.name, color: tag!.color })}
                />
              )}
            />
          </FormControl>
          <Grid gridTemplateColumns="auto 1fr" alignItems="center" gridRowGap={2} marginTop={4}>
            <FormControl as={NoElement} isDisabled={!isDefined(tagId)} isInvalid={!!errors.name}>
              <FormLabel marginBottom="0">
                <FormattedMessage
                  id="component.tag-edit-dialog.name-label"
                  defaultMessage="Tag name"
                />
              </FormLabel>
              <Input {...register("name", { required: true, validate: { isNotEmptyText } })} />

              <FormErrorMessage gridColumn="2" marginTop={0}>
                {errors.name?.type === "unavailable" ? (
                  <FormattedMessage
                    id="component.tag-edit-dialog.existing-tag"
                    defaultMessage="A tag with the same name already exists"
                  />
                ) : (
                  <FormattedMessage
                    id="generic.forms.field-required-error"
                    defaultMessage="This field is required"
                  />
                )}
              </FormErrorMessage>
            </FormControl>
            <FormControl as={NoElement} isDisabled={!isDefined(tagId)}>
              <FormLabel marginBottom="0">
                <FormattedMessage
                  id="component.tag-edit-dialog.color-label"
                  defaultMessage="Color"
                />
              </FormLabel>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <TagColorSelect
                    value={field.value}
                    onChange={(color) => {
                      field.onChange(color);
                    }}
                  />
                )}
              />
            </FormControl>
          </Grid>
        </Box>
      }
      confirm={
        <Button isLoading={isUpdating} isDisabled={!isDirty} type="submit" colorScheme="primary">
          <FormattedMessage id="generic.save-changes" defaultMessage="Save changes" />
        </Button>
      }
      cancel={<></>}
    />
  );
}

function NoElement({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

TagEditDialog.mutations = [
  gql`
    mutation TagEditDialog_updateTag($id: GID!, $data: UpdateTagInput!) {
      updateTag(id: $id, data: $data) {
        ...TagSelect_Tag
      }
    }
    ${TagSelect.fragments.Tag}
  `,
];

export function useTagEditDialog() {
  return useDialog(TagEditDialog);
}
