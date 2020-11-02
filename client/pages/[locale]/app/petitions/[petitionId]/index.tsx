import { gql } from "@apollo/client";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { compose } from "@parallel/utils/compose";
import Router from "next/router";
import {
  PetitionQuery,
  PetitionQueryVariables,
} from "@parallel/graphql/__types";

function Petition() {
  return <></>;
}

Petition.getInitialProps = async ({
  query,
  apollo,
  res,
}: WithApolloDataContext) => {
  const { data } = await apollo.query<PetitionQuery, PetitionQueryVariables>({
    query: gql`
      query Petition($id: GID!) {
        petition(id: $id) {
          id
          ... on Petition {
            status
          }
        }
      }
    `,
    variables: { id: query.petitionId as string },
  });
  const section =
    data?.petition?.__typename === "Petition" &&
    data.petition.status !== "DRAFT"
      ? "replies"
      : "compose";
  const { locale, petitionId } = query;
  throw new RedirectError(`/${locale}/app/petitions/${petitionId}/${section}`);
};

export default compose(withApolloData)(Petition);
