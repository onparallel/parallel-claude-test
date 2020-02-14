import { AppLayout } from "@parallel/components/layout/AppLayout";
import { Flex, Box } from "@chakra-ui/core";
import { PetitionsQuery } from "@parallel/graphql/__types";
import { WithDataContext, withData } from "@parallel/components/withData";
import { gql } from "apollo-boost";
import { useQuery } from "@apollo/react-hooks";

function Petitions() {
  const { data } = useQuery<PetitionsQuery>(GET_PETITIONS_DATA);
  const { me } = data!;
  return (
    <AppLayout user={me}>
      petition
      <Flex>
        <Box>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
            <Box
              key={shade}
              width={20}
              height={20}
              backgroundColor={"purple." + shade}
            ></Box>
          ))}
        </Box>
        <Box>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
            <Box
              key={shade}
              width={20}
              height={20}
              backgroundColor={"green." + shade}
            ></Box>
          ))}
        </Box>
        <Box>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
            <Box
              key={shade}
              width={20}
              height={20}
              backgroundColor={"blue." + shade}
            ></Box>
          ))}
        </Box>
      </Flex>
    </AppLayout>
  );
}

const GET_PETITIONS_DATA = gql`
  query Petitions {
    me {
      ...AppLayout_User
    }
  }
  ${AppLayout.fragments.user}
`;

Petitions.getInitialProps = async ({ apollo }: WithDataContext) => {
  await apollo.query<PetitionsQuery>({ query: GET_PETITIONS_DATA });
};

export default withData(Petitions);
