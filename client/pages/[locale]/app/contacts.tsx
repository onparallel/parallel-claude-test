import { AppLayout } from "@parallel/components/layout/AppLayout";
import { gql } from "apollo-boost";
import { ContactsQuery } from "@parallel/graphql/__types";
import { WithDataContext, withData } from "@parallel/components/withData";
import { useQuery } from "@apollo/react-hooks";

function Contacts() {
  const { data } = useQuery<ContactsQuery>(GET_CONTACTS_DATA);
  const { me } = data!;
  return <AppLayout user={me}>contacts</AppLayout>;
}

const GET_CONTACTS_DATA = gql`
  query Contacts {
    me {
      ...AppLayout_User
    }
  }
  ${AppLayout.fragments.user}
`;

Contacts.getInitialProps = async ({ apollo }: WithDataContext) => {
  await apollo.query<ContactsQuery>({ query: GET_CONTACTS_DATA });
};

export default withData(Contacts);
