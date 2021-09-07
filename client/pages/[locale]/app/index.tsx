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

AppRedirect.getInitialProps = async ({ query, fetchQuery }: WithApolloDataContext) => {
  const { data } = await fetchQuery<AppPetitionsQuery, AppPetitionsQueryVariables>(
    gql`
      query AppPetitions {
        petitions {
          totalCount
        }
      }
    `
  );

  const { locale } = query;
  if (data.petitions.totalCount) {
    throw new RedirectError(`/${locale}/app/petitions`);
  } else {
    throw new RedirectError(`/${locale}/app/petitions/new`);
  }
};

export default compose(withApolloData)(AppRedirect);
