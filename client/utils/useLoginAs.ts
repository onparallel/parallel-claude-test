import { gql, useApolloClient, useMutation } from "@apollo/client";
import {
  useLoginAs_loginAsDocument,
  useLoginAs_restoreLoginDocument,
} from "@parallel/graphql/__types";
import { isDefined } from "remeda";

const _mutations = [
  gql`
    mutation useLoginAs_loginAs($userId: GID!) {
      loginAs(userId: $userId)
    }
  `,
  gql`
    mutation useLoginAs_restoreLogin {
      restoreLogin
    }
  `,
];

export function useLoginAs() {
  const [loginAs] = useMutation(useLoginAs_loginAsDocument);
  const [restoreLogin] = useMutation(useLoginAs_restoreLoginDocument);
  const apollo = useApolloClient();
  return async function (userId: string | null) {
    if (isDefined(userId)) {
      await loginAs({ variables: { userId } });
    } else {
      await restoreLogin();
    }
    await apollo.clearStore();
    // reload removing anything after /app
    window.location.href = window.location.pathname.replace(/(?<=(\/(en|es))?\/app).*/, "");
  };
}
