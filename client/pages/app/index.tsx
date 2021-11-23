import { gql } from "@apollo/client";
import {
  RedirectError,
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppRedirect_petitionsDocument } from "@parallel/graphql/__types";
import { compose } from "@parallel/utils/compose";

function AppRedirect() {
  return <></>;
}

AppRedirect.queries = [
  gql`
    query AppRedirect_petitions {
      petitions {
        totalCount
      }
    }
  `,
];

AppRedirect.getInitialProps = async ({ fetchQuery }: WithApolloDataContext) => {
  const { data } = await fetchQuery(AppRedirect_petitionsDocument);
  throw new RedirectError(data.petitions.totalCount ? "/app/petitions" : "/app/petitions/new");
};

export default compose(withApolloData)(AppRedirect);
