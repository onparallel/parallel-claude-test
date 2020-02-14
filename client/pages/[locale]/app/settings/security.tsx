import { AppLayout } from "@parallel/components/layout/AppLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import { gql } from "apollo-boost";
import { AppHomeQuery, SecurityQuery } from "@parallel/graphql/__types";
import { SettingsLayout } from "@parallel/components/layout/SettingsLayout";
import { FormattedMessage } from "react-intl";
import { useQuery } from "@apollo/react-hooks";

function Security() {
  const { data } = useQuery<SecurityQuery>(GET_SECURITY_DATA);
  const { me } = data!;
  return (
    <AppLayout user={me}>
      <SettingsLayout
        header={
          <FormattedMessage id="settings.security" defaultMessage="Security" />
        }
      >
        hola
      </SettingsLayout>
    </AppLayout>
  );
}

const GET_SECURITY_DATA = gql`
  query Security {
    me {
      id
      organizationRole
      email
      ...AppLayout_User
    }
  }
  ${AppLayout.fragments.user}
`;

Security.getInitialProps = async ({ apollo }: WithDataContext) => {
  await apollo.query<SecurityQuery>({ query: GET_SECURITY_DATA });
};

export default withData(Security);
