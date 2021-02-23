import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import { withDialogs } from "@parallel/components/common/DialogProvider";
import {
  withApolloData,
  WithApolloDataContext,
} from "@parallel/components/common/withApolloData";
import { PetitionFieldCondition } from "@parallel/components/petition-compose/PetitionFieldCondition";
import {
  PruebasQuery,
  PruebasQueryVariables,
  usePruebasQuery,
} from "@parallel/graphql/__types";
import { assertQuery } from "@parallel/utils/apollo/assertQuery";
import { compose } from "@parallel/utils/compose";
import { UnwrapPromise } from "@parallel/utils/types";

function Pruebas({
  petitionId,
}: UnwrapPromise<ReturnType<typeof Pruebas.getInitialProps>>) {
  const {
    data: { petition },
  } = assertQuery(usePruebasQuery({ variables: { id: petitionId } }));
  console.log(petition);
  return (
    <Box padding={8}>
      <PetitionFieldCondition showError={true} fields={petition!.fields} />
    </Box>
  );
}

Pruebas.fragments = {
  get Petition() {
    return gql`
      fragment Pruebas_Petition on PetitionBase {
        id
        fields {
          ...PetitionFieldCondition_PetitionField
        }
      }
      ${PetitionFieldCondition.fragments.PetitionField}
    `;
  },
};

Pruebas.getInitialProps = async ({
  query,
  fetchQuery,
}: WithApolloDataContext) => {
  await fetchQuery<PruebasQuery, PruebasQueryVariables>(
    gql`
      query Pruebas($id: GID!) {
        petition(id: $id) {
          ...Pruebas_Petition
        }
      }
      ${Pruebas.fragments.Petition}
    `,
    {
      variables: {
        id: query.petitionId as string,
      },
      ignoreCache: true,
    }
  );

  return {
    petitionId: query.petitionId as string,
  };
};

export default compose(withDialogs, withApolloData)(Pruebas);
