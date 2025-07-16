import { gql } from "@apollo/client";
import { Table as ChakraTable, TableContainer, Tbody, Td, Text, Tr } from "@chakra-ui/react";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { ExternalLink } from "@parallel/components/common/ExternalLink";
import { ViewMoreText } from "@parallel/components/common/ViewMoreText";
import { BackgroundCheckEntityDetailsPersonOverview_BackgroundCheckEntityDetailsPersonFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";

export function BackgroundCheckEntityDetailsPersonOverview({
  overview,
}: {
  overview: BackgroundCheckEntityDetailsPersonOverview_BackgroundCheckEntityDetailsPersonFragment;
}) {
  const separator = " · ";

  const properties = overview.properties;
  return (
    <Card>
      <CardHeader>
        <Text fontWeight={600} fontSize="xl">
          <FormattedMessage
            id="component.background-check-entity-details-person-overview.overview"
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
                paddingStart: 5,
                paddingEnd: 5,
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
                  id="component.background-check-entity-details-person-overview.full-name"
                  defaultMessage="Full name"
                />
              </Td>
              <Td>
                {properties.name ? <ViewMoreText text={properties.name.join(separator)} /> : "-"}
              </Td>
            </Tr>
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-person-overview.alias"
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
                  id="component.background-check-entity-details-person-overview.place-of-birth"
                  defaultMessage="Place of birth"
                />
              </Td>
              <Td>
                {properties.birthPlace ? (
                  <ViewMoreText text={properties.birthPlace.join(separator)} />
                ) : (
                  "-"
                )}
              </Td>
            </Tr>
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-person-overview.position"
                  defaultMessage="Position"
                />
              </Td>
              <Td>
                {properties.position ? (
                  <ViewMoreText text={properties.position.join(separator)} />
                ) : (
                  "-"
                )}
              </Td>
            </Tr>
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-person-overview.education"
                  defaultMessage="Education"
                />
              </Td>
              <Td>
                {properties.education ? (
                  <ViewMoreText text={properties.education.join(separator)} />
                ) : (
                  "-"
                )}
              </Td>
            </Tr>
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-person-overview.status"
                  defaultMessage="Status"
                />
              </Td>
              <Td>
                {properties.status ? (
                  <ViewMoreText text={properties.status.join(separator)} />
                ) : (
                  "-"
                )}
              </Td>
            </Tr>
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-person-overview.regilion"
                  defaultMessage="Religion"
                />
              </Td>
              <Td>
                {properties.religion ? (
                  <ViewMoreText text={properties.religion.join(separator)} />
                ) : (
                  "-"
                )}
              </Td>
            </Tr>
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-person-overview.ethnicity"
                  defaultMessage="Ethnicity"
                />
              </Td>
              <Td>
                {properties.ethnicity ? (
                  <ViewMoreText text={properties.ethnicity.join(separator)} />
                ) : (
                  "-"
                )}
              </Td>
            </Tr>
            <Tr>
              <Td>
                <FormattedMessage
                  id="component.background-check-entity-details-person-overview.sources-url"
                  defaultMessage="Sources"
                />
              </Td>
              <Td>
                {properties.sourceUrl
                  ? properties.sourceUrl?.map((url, i) => (
                      <ExternalLink key={i} href={url} title={url} hideIcon marginEnd={1.5}>
                        [{i + 1}]
                      </ExternalLink>
                    ))
                  : "-"}
              </Td>
            </Tr>
          </Tbody>
        </ChakraTable>
      </TableContainer>
    </Card>
  );
}

BackgroundCheckEntityDetailsPersonOverview.fragments = {
  get BackgroundCheckEntityDetailsPersonOverview() {
    return gql`
      fragment BackgroundCheckEntityDetailsPersonOverview_BackgroundCheckEntityDetailsPerson on BackgroundCheckEntityDetailsPerson {
        id
        properties {
          alias
          birthPlace
          education
          ethnicity
          name
          position
          religion
          status
          sourceUrl
        }
      }
    `;
  },
};
