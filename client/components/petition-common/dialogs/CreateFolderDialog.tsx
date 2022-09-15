import { gql, useApolloClient } from "@apollo/client";
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  CreateFolderDialog_PetitionBaseFragment,
  CreateFolderDialog_petitionsDocument,
} from "@parallel/graphql/__types";
import { useRegisterWithRef } from "@parallel/utils/react-form-hook/useRegisterWithRef";
import { genericRsComponent, useReactSelectProps } from "@parallel/utils/react-select/hooks";
import { isNotEmptyText } from "@parallel/utils/strings";
import { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { components } from "react-select";
import AsyncSelect from "react-select/async";

interface CreateFolderDialogProps {
  isTemplate: boolean;
  currentPath: string;
}

interface CreateFolderDialogData {
  name: string;
  petitions: CreateFolderDialog_PetitionBaseFragment[];
}

function CreateFolderDialog({
  isTemplate,
  currentPath,
  ...props
}: DialogProps<CreateFolderDialogProps, CreateFolderDialogData>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<CreateFolderDialogData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      petitions: [],
    },
  });

  const nameRef = useRef<HTMLInputElement>(null);
  const nameRegisterProps = useRegisterWithRef(nameRef, register, "name", {
    required: true,
    maxLength: 255,
    validate: { isNotEmptyText, noSlash: (value) => !value.includes("/") },
  });

  const reactSelectProps = useReactSelectProps<
    CreateFolderDialog_PetitionBaseFragment,
    true,
    never
  >({ components: { Option, MultiValueLabel, NoOptionsMessage } });

  const apollo = useApolloClient();
  const loadPetitions = useCallback(
    async (search) => {
      const result = await apollo.query({
        query: CreateFolderDialog_petitionsDocument,
        variables: {
          offset: 0,
          limit: 100,
          filters: {
            type: isTemplate ? "TEMPLATE" : "PETITION",
            path: currentPath,
          },
          search,
          sortBy: isTemplate ? "lastUsedAt_DESC" : "createdAt_DESC",
        },
      });

      return result.data.petitions.items.filter(
        (i) =>
          i.__typename !== "PetitionFolder" &&
          (i as any).myEffectivePermission!.permissionType !== "READ"
      ) as any;
    },
    [currentPath]
  );

  return (
    <ConfirmDialog
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      initialFocusRef={nameRef}
      content={{
        as: "form",
        onSubmit: handleSubmit(async (data) => {
          return props.onResolve(data);
        }),
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.create-folder-dialog.create-folder"
          defaultMessage="Create folder"
        />
      }
      body={
        <Stack>
          <FormControl id="folder-name" isInvalid={!!errors.name}>
            <FormLabel>
              <FormattedMessage id="generic.forms.folder-name-label" defaultMessage="Folder name" />
            </FormLabel>
            <Input {...nameRegisterProps} />
            <FormErrorMessage>
              {errors.name?.type === "maxLength" ? (
                <FormattedMessage
                  id="generic.folder-name.max-length-error"
                  defaultMessage="Name cannot exceed {max} characters"
                  values={{ max: 255 }}
                />
              ) : errors.name?.type === "noSlash" ? (
                <FormattedMessage
                  id="generic.folder-name.no-slash-error"
                  defaultMessage="Name can't contain the slash character /"
                />
              ) : (
                <FormattedMessage
                  id="generic.folder-name.required-error"
                  defaultMessage="Please enter a name"
                />
              )}
            </FormErrorMessage>
          </FormControl>
          <FormControl id="petitions" isInvalid={!!errors.petitions}>
            <FormLabel>
              {isTemplate ? (
                <FormattedMessage id="generic.root-templates" defaultMessage="Templates" />
              ) : (
                <FormattedMessage id="generic.root-petitions" defaultMessage="Parallels" />
              )}
            </FormLabel>
            <Controller
              name="petitions"
              control={control}
              rules={{
                validate: { isNotEmptyList: (petitions) => petitions.length > 0 },
              }}
              render={({ field: { onChange, value } }) => (
                <AsyncSelect<CreateFolderDialog_PetitionBaseFragment, true, never>
                  {...reactSelectProps}
                  value={value}
                  isMulti
                  inputId="petitions"
                  onChange={onChange}
                  defaultOptions
                  loadOptions={loadPetitions}
                  isSearchable
                  isClearable
                  getOptionValue={(o) => o.id}
                  getOptionLabel={(o) => o.name ?? ""}
                  placeholder={
                    isTemplate
                      ? intl.formatMessage({
                          id: "component.create-folder-dialog.placeholder-templates",
                          defaultMessage: "Select templates to add to the folder",
                        })
                      : intl.formatMessage({
                          id: "component.create-folder-dialog.placeholder-parallels",
                          defaultMessage: "Select parallels to add to the folder",
                        })
                  }
                />
              )}
            />
            <FormErrorMessage>
              <FormattedMessage
                id="component.create-folder-dialog.no-petitions-selected-error"
                defaultMessage="Please, select at least one {isTemplate, select, true{template} other{parallel}} in the current folder"
                values={{ isTemplate }}
              />
            </FormErrorMessage>
          </FormControl>
        </Stack>
      }
      confirm={
        <Button colorScheme="primary" type="submit">
          <FormattedMessage
            id="component.create-folder-dialog.create-folder"
            defaultMessage="Create folder"
          />
        </Button>
      }
    />
  );
}

const _fragments = {
  PetitionBase: gql`
    fragment CreateFolderDialog_PetitionBase on PetitionBase {
      id
      name
      myEffectivePermission {
        permissionType
      }
    }
  `,
};

const _queries = [
  gql`
    query CreateFolderDialog_petitions(
      $offset: Int!
      $limit: Int!
      $search: String
      $sortBy: [QueryPetitions_OrderBy!]
      $filters: PetitionFilter
    ) {
      petitions(
        offset: $offset
        limit: $limit
        search: $search
        sortBy: $sortBy
        filters: $filters
      ) {
        items {
          ...CreateFolderDialog_PetitionBase
        }
      }
    }
    ${_fragments.PetitionBase}
  `,
];

export function useCreateFolderDialog() {
  return useDialog(CreateFolderDialog);
}

function PetitionName({
  name,
  isTemplate,
}: {
  name: string | null | undefined;
  isTemplate: boolean;
}) {
  return name ? (
    <Text as="span">{name}</Text>
  ) : (
    <Text as="span" textStyle="hint">
      {isTemplate ? (
        <FormattedMessage id="generic.unnamed-template" defaultMessage="Unnamed template" />
      ) : (
        <FormattedMessage id="generic.unnamed-parallel" defaultMessage="Unnamed parallel" />
      )}
    </Text>
  );
}

const rsComponent = genericRsComponent<
  CreateFolderDialog_PetitionBaseFragment,
  true,
  never,
  {
    selectProps: {
      isTemplate: boolean;
    };
  }
>();

const Option = rsComponent("Option", function (props) {
  return (
    <components.Option {...props}>
      <PetitionName name={props.data.name} isTemplate={props.selectProps.isTemplate} />
    </components.Option>
  );
});

const MultiValueLabel = rsComponent("MultiValueLabel", function ({ children, ...props }) {
  return (
    <components.MultiValueLabel {...props}>
      <PetitionName name={props.data.name} isTemplate={props.selectProps.isTemplate} />
    </components.MultiValueLabel>
  );
});

const NoOptionsMessage = rsComponent("NoOptionsMessage", function (props) {
  return (
    <Box textAlign="center" color="gray.400" padding={4}>
      <Text as="div" marginTop={2}>
        <FormattedMessage
          id="component.create-folder-dialog.no-options"
          defaultMessage="We could not find any {isTemplate, select, true{template} other{parallel}} with <i>Editor</i> permission in the current folder"
          values={{
            isTemplate: props.selectProps.isTemplate,
            i: (chunks: any[]) => (
              <Text as="span" fontStyle="italic">
                {chunks}
              </Text>
            ),
          }}
        />
      </Text>
    </Box>
  );
});
