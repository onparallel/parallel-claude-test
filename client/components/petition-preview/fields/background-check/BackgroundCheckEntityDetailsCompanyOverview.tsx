import { gql } from "@apollo/client";
import { Table as ChakraTable, TableContainer, Tbody, Td, Text, Tr } from "@chakra-ui/react";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { ViewMoreText } from "@parallel/components/common/ViewMoreText";
import { BackgroundCheckEntityDetailsCompanyOverview_BackgroundCheckEntityDetailsCompanyFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export function BackgroundCheckEntityDetailsCompanyOverview({
  overview,
}: {
  overview: BackgroundCheckEntityDetailsCompanyOverview_BackgroundCheckEntityDetailsCompanyFragment;
}) {
  const separator = " · ";

  const properties = overview.properties;

  return (
    <Card>
      <CardHeader>
        <Text fontWeight={600} fontSize="xl">
          <FormattedMessage
            id="component.background-check-entity-details-company-overview.overview"
            defaultMessage="Overview"
          />
        </Text>
      </CardHeader>

      <TableContainer whiteSpace="normal">
        <ChakraTable>
          <Tbody
            sx={{
              "& td": {
                paddingTop: 2,
                paddingBottom: 2,
                paddingLeft: 5,
                paddingRight: 5,
                verticalAlign: "top",
              },
              "& td:first-of-type": {
                fontWeight: 500,
                color: "gray.600",
                whiteSpace: "nowrap",
              },
            }}
          >
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-company-overview.name"
                  defaultMessage="Name"
                />
              </Td>
              <Td>
                {properties.name ? <ViewMoreText text={properties.name.join(separator)} /> : "-"}
              </Td>
            </Tr>
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-company-overview.alias"
                  defaultMessage="Alias"
                />
              </Td>
              <Td>
                {properties.alias ? <ViewMoreText text={properties.alias.join(separator)} /> : "-"}
              </Td>
            </Tr>
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-company-overview.address"
                  defaultMessage="Address"
                />
              </Td>
              <Td>
                {properties.address ? (
                  <ViewMoreText text={properties.address.join(separator)} />
                ) : (
                  "-"
                )}
              </Td>
            </Tr>
          </Tbody>
        </ChakraTable>
      </TableContainer>
    </Card>
  );
}

BackgroundCheckEntityDetailsCompanyOverview.fragments = {
  get BackgroundCheckEntityDetailsCompanyOverview() {
    return gql`
      fragment BackgroundCheckEntityDetailsCompanyOverview_BackgroundCheckEntityDetailsCompany on BackgroundCheckEntityDetailsCompany {
        id
        properties {
          name
          alias
          address
        }
      }
    `;
  },
};
