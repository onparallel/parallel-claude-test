import { useMutation } from "@apollo/react-hooks";
import { Button, FormControl, FormLabel, Input } from "@chakra-ui/core";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import {
  DialogCallbacks,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import {
  PetitionLocale,
  useCreatePetition_createPetitionMutation,
  useCreatePetition_createPetitionMutationVariables,
} from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { clearCache } from "./apollo";
import { useMergeRefs } from "./useMergeRefs";

export function useCreatePetition() {
  const { query } = useRouter();

  const [createPetition] = useMutation<
    useCreatePetition_createPetitionMutation,
    useCreatePetition_createPetitionMutationVariables
  >(
    gql`
      mutation useCreatePetition_createPetition(
        $name: String!
        $locale: PetitionLocale!
      ) {
        createPetition(name: $name, locale: $locale) {
          id
        }
      }
    `,
    {
      update(cache) {
        // clear caches where new item would appear
        clearCache(
          cache,
          /\$ROOT_QUERY\.petitions\(.*"status":(null|"DRAFT")[,}]/
        );
      },
    }
  );

  const askPetitionName = useDialog(AskPetitionName, []);

  return useCallback(
    async function () {
      const name = await askPetitionName({});
      const { data, errors } = await createPetition({
        variables: {
          name,
          locale: query.locale as PetitionLocale,
        },
      });
      if (errors) {
        throw errors;
      }
      return data!.createPetition.id;
    },
    [query.locale]
  );
}

type CreatePetitionFormData = {
  name: string;
};

function AskPetitionName(props: DialogCallbacks<string>) {
  const intl = useIntl();
  const {
    handleSubmit,
    register,
    errors,
    formState: { isValid },
  } = useForm<CreatePetitionFormData>({
    mode: "onChange",
    defaultValues: { name: "" },
  });
  const focusRef = useRef<HTMLInputElement>(null);
  const inputRef = useMergeRefs(focusRef, register({ required: true }));

  function onContinue({ name }: CreatePetitionFormData) {
    props.onResolve(name);
  }

  return (
    <ConfirmDialog
      as="form"
      onSubmit={handleSubmit(onContinue)}
      focusRef={focusRef}
      header={
        <FormattedMessage
          id="petitions.create-new-petition.header"
          defaultMessage="Create a new petition"
        />
      }
      body={
        <FormControl isInvalid={!!errors.name}>
          <FormLabel htmlFor="petition-name">
            <FormattedMessage
              id="petitions.create-new-petition.body"
              defaultMessage="Give your new petition a name"
            />
          </FormLabel>
          <Input
            id="petition-name"
            name="name"
            ref={inputRef}
            placeholder={intl.formatMessage({
              id: "generic.untitled-petition",
              defaultMessage: "Untitled petition",
            })}
          />
        </FormControl>
      }
      confirm={
        <Button type="submit" variantColor="purple" isDisabled={!isValid}>
          <FormattedMessage
            id="petitions.create-new-petition.continue-button"
            defaultMessage="Continue"
          />
        </Button>
      }
      {...props}
    />
  );
}
