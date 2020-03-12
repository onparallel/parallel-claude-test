import { Box, Button, Input, Text } from "@chakra-ui/core";
import {
  ChangeEvent,
  KeyboardEvent,
  useRef,
  useState,
  useCallback
} from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  DialogCallbacks,
  useDialog
} from "@parallel/components/common/DialogOpenerProvider";
import { ConfirmDialog } from "@parallel/components/common/ConfirmDialog";
import { useMutation } from "@apollo/react-hooks";
import {
  useCreatePetition_createPetitionMutation,
  useCreatePetition_createPetitionMutationVariables,
  PetitionLocale
} from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { clearCache } from "./apollo";
import { useRouter } from "next/router";

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
      }
    }
  );

  const askPetitionName = useDialog(AskPetitionName, []);

  return useCallback(
    async function() {
      const name = await askPetitionName({});
      const { data, errors } = await createPetition({
        variables: {
          name,
          locale: query.locale as PetitionLocale
        }
      });
      if (errors) {
        throw errors;
      }
      return data!.createPetition.id;
    },
    [query.locale]
  );
}

function AskPetitionName(props: DialogCallbacks<string>) {
  const [name, setName] = useState("");
  const intl = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  function handleInputKeyPress(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && name.length > 0) {
      props.onResolve(name);
    }
  }

  return (
    <ConfirmDialog
      focusRef={inputRef}
      header={
        <FormattedMessage
          id="petitions.create-new-petition.header"
          defaultMessage="Create a new petition"
        />
      }
      body={
        <Box>
          <Text>
            <FormattedMessage
              id="petitions.create-new-petition.body"
              defaultMessage="Give your new petition a name"
            />
          </Text>
          <Input
            ref={inputRef}
            value={name}
            placeholder={intl.formatMessage({
              id: "generic.untitled-petition",
              defaultMessage: "Untitled petition"
            })}
            onChange={handleInputChange}
            onKeyPress={handleInputKeyPress}
            marginTop={2}
          />
        </Box>
      }
      confirm={
        <Button
          isDisabled={name.length === 0}
          variantColor="purple"
          onClick={() => props.onResolve(name)}
        >
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
