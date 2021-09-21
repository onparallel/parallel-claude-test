import { gql } from "@apollo/client";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppPetitionsQuery, AppPetitionsQueryVariables } from "@parallel/graphql/__types";
import { compose } from "@parallel/utils/compose";

function AppRedirect() {
  return <></>;
}

AppRedirect.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  const { data } = await fetchQuery<AppPetitionsQuery, AppPetitionsQueryVariables>(
    gql`
      query AppPetitions {
        petitions {
          totalCount
        }
      }
    `
  );
  throw new RedirectError(data.petitions.totalCount ? "/app/petitions" : "/app/petitions/new");
};

export default compose(withApolloData)(AppRedirect);
