import { gql } from "@apollo/client";
import { AlertDescription, AlertIcon, Flex, Text } from "@chakra-ui/react";
import {
  RecipientViewPetitionStatusAlert_PublicPetitionFragment,
  RecipientViewPetitionStatusAlert_PublicUserFragment,
  Tone,
} from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish } from "remeda";
import { CloseableAlert } from "../common/CloseableAlert";

interface RecipientViewPetitionStatusAlertProps {
  petition: RecipientViewPetitionStatusAlert_PublicPetitionFragment;
  granter?: RecipientViewPetitionStatusAlert_PublicUserFragment | null;
  tone: Tone;
}

export function RecipientViewPetitionStatusAlert({
  petition,
  granter,
  tone,
}: RecipientViewPetitionStatusAlertProps) {
  const intl = useIntl();

  const name = isNonNullish(granter) ? (
    <b>{granter.fullName}</b>
  ) : (
    <i>
      {intl.formatMessage({
        id: "generic.deleted-user",
        defaultMessage: "Deleted user",
      })}
    </i>
  );

  return (
    <CloseableAlert status="success" variant="subtle" zIndex={2} paddingX={6}>
      <Flex alignItems="center" justifyContent="flex-start" marginX="auto" width="100%">
        <AlertIcon />
        <AlertDescription>
          {petition.status === "COMPLETED" ? (
            <>
              <Text>
                <FormattedMessage
                  id="component.recipient-view-petition-status-alert.petition-completed-alert-1"
                  defaultMessage="<b>Information completed!</b> We have notified {name} for review and validation."
                  values={{
                    name,
                    tone,
                  }}
                />
              </Text>
              <Text>
                <FormattedMessage
                  id="component.recipient-view-petition-status-alert.petition-completed-alert-2"
                  defaultMessage="If you make any changes, don't forget to hit the <b>Finalize</b> button again."
                  values={{ tone }}
                />
              </Text>
            </>
          ) : (
            <FormattedMessage
              id="component.recipient-view-petition-status-alert.petition-closed-alert"
              defaultMessage="This parallel has been closed. If you need to make any changes, please reach out to {name}."
              values={{
                name,
              }}
            />
          )}
        </AlertDescription>
      </Flex>
    </CloseableAlert>
  );
}

RecipientViewPetitionStatusAlert.fragments = {
  PublicPetition: gql`
    fragment RecipientViewPetitionStatusAlert_PublicPetition on PublicPetition {
      status
    }
  `,
  PublicUser: gql`
    fragment RecipientViewPetitionStatusAlert_PublicUser on PublicUser {
      fullName
    }
  `,
};
