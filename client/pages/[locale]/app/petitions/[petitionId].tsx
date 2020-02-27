import { useQuery } from "@apollo/react-hooks";
import { Title } from "@parallel/components/common/Title";
import { AppLayout } from "@parallel/components/layout/AppLayout";
import { withData, WithDataContext } from "@parallel/components/withData";
import {
  PetitionQuery,
  PetitionQueryVariables,
  PetitionsUserQuery,
  PetitionUserQuery,
  Petition_PetitionFragment
} from "@parallel/graphql/__types";
import { useQueryData } from "@parallel/utils/useQueryData";
import { gql } from "apollo-boost";
import { useIntl } from "react-intl";

interface PetitionProps {
  petitionId: string;
}

function Petition({ petitionId }: PetitionProps) {
  const intl = useIntl();
  const { me } = useQueryData<PetitionsUserQuery>(GET_PETITION_USER_DATA);
  const { petition } = useQueryData<PetitionQuery>(GET_PETITION_DATA, {
    variables: { id: petitionId }
  });
  console.log(petition);

  return (
    <>
      <Title>
        {petition!.name ||
          intl.formatMessage({
            id: "generic.untitled-petition",
            defaultMessage: "Untitled petition"
          })}
      </Title>
      <AppLayout user={me}>hola</AppLayout>
    </>
  );
}

type PetitionSelection = Petition_PetitionFragment;

Petition.fragments = {
  petitions: gql`
    fragment Petition_Petition on Petition {
      id
      customRef
      name
      status
      deadline
      progress {
        validated
        replied
        optional
        total
      }
      accessess {
        contact {
          id
          fullName
          email
        }
      }
    }
  `,
  user: gql`
    fragment Petitions_User on User {
      ...AppLayout_User
    }
    ${AppLayout.fragments.user}
  `
};

const GET_PETITION_DATA = gql`
  query Petition($id: ID!) {
    petition(id: $id) {
      ...Petition_Petition
    }
  }
  ${Petition.fragments.petitions}
`;

const GET_PETITION_USER_DATA = gql`
  query PetitionUser {
    me {
      ...Petitions_User
    }
  }
  ${Petition.fragments.user}
`;

Petition.getInitialProps = async ({ apollo, query }: WithDataContext) => {
  await Promise.all([
    apollo.query<PetitionQuery, PetitionQueryVariables>({
      query: GET_PETITION_DATA,
      variables: { id: query.petitionId as string }
    }),
    apollo.query<PetitionUserQuery>({ query: GET_PETITION_USER_DATA })
  ]);
  return {
    petitionId: query.petitionId as string
  };
};

export default withData(Petition);
