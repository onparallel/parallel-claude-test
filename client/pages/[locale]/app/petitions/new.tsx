import { gql } from "@apollo/client";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import {
  PetitionsUserQuery,
  useNewPetitionUserQuery,
} from "@parallel/graphql/__types";
import { compose } from "@parallel/utils/compose";
import { useIntl } from "react-intl";
import { assertQuery } from "@parallel/utils/apollo";

function NewPetition() {
  const intl = useIntl();
  const {
    data: { me },
  } = assertQuery(useNewPetitionUserQuery());

  return (
    <AppLayout
      title={intl.formatMessage({
        id: "new-petition.title",
        defaultMessage: "New petition",
      })}
      user={me}
    ></AppLayout>
  );
}

NewPetition.fragments = {
  get User() {
    return gql`
      fragment NewPetition_User on User {
        ...AppLayout_User
      }
      ${AppLayout.fragments.User}
    `;
  },
};

NewPetition.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await Promise.all([
    fetchQuery<PetitionsUserQuery>(gql`
      query NewPetitionUser {
        me {
          ...NewPetition_User
        }
      }
      ${NewPetition.fragments.User}
    `),
  ]);
};

export default compose(withApolloData)(NewPetition);
