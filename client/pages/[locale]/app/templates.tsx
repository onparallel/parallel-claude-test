import { AppLayout } from "@parallel/components/layout/AppLayout";
import { useQuery } from "@apollo/react-hooks";
import { gql } from "apollo-boost";
import { TemplatesQuery } from "@parallel/graphql/__types";
import {
  WithDataContext,
  withData,
} from "@parallel/components/common/withData";

function Templates() {
  const { data } = useQuery<TemplatesQuery>(GET_SENDOUTS_DATA);
  const { me } = data!;
  return <AppLayout user={me}>sendouts</AppLayout>;
}

const GET_SENDOUTS_DATA = gql`
  query Templates {
    me {
      ...AppLayout_User
    }
  }
  ${AppLayout.fragments.user}
`;

Templates.getInitialProps = async ({ apollo }: WithDataContext) => {
  await apollo.query<TemplatesQuery>({ query: GET_SENDOUTS_DATA });
};

export default withData(Templates);
