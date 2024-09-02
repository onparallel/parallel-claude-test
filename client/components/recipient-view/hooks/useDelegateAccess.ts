import { gql, useMutation } from "@apollo/client";
import { useToast } from "@chakra-ui/react";
import { useTone } from "@parallel/components/common/ToneProvider";
import { useDelegateAccess_publicDelegateAccessToContactDocument } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { useDelegateAccessDialog } from "../dialogs/DelegateAccessDialog";

export function useDelegateAccess() {
  const intl = useIntl();
  const tone = useTone();
  const showDelegateAccessDialog = useDelegateAccessDialog();

  const toast = useToast();

  const [publicDelegateAccessToContact] = useMutation(
    useDelegateAccess_publicDelegateAccessToContactDocument,
  );
  return async function ({
    keycode,
    contactName,
    organizationName,
  }: {
    keycode: string;
    contactName: string;
    organizationName: string;
  }) {
    try {
      const data = await showDelegateAccessDialog({
        keycode,
        contactName,
        organizationName,
        tone,
      });
      await publicDelegateAccessToContact({
        variables: {
          ...data,
          keycode,
        },
      });
      toast({
        title: intl.formatMessage({
          id: "util.recipient-view-delegate-access.toast-header",
          defaultMessage: "Access delegated",
        }),
        description: intl.formatMessage(
          {
            id: "util.recipient-view-delegate-access.toast-body",
            defaultMessage:
              "We have sent an email to {email} with instructions to access this parallel.",
          },
          { email: data.email },
        ),
        duration: 5000,
        isClosable: true,
        status: "success",
      });
    } catch {}
  };
}

const _mutations = [
  gql`
    mutation useDelegateAccess_publicDelegateAccessToContact(
      $keycode: ID!
      $email: String!
      $firstName: String!
      $lastName: String!
      $messageBody: String!
    ) {
      publicDelegateAccessToContact(
        keycode: $keycode
        email: $email
        firstName: $firstName
        lastName: $lastName
        messageBody: $messageBody
      ) {
        petition {
          id
          recipients {
            id
            fullName
            email
          }
        }
      }
    }
  `,
];
