import { gql } from "@apollo/client";
import { Box, Center, HStack, Text } from "@chakra-ui/react";
import { BusinessIcon, UserIcon } from "@parallel/chakra/icons";
import { Card, CardHeader } from "@parallel/components/common/Card";
import { Table, TableColumn } from "@parallel/components/common/Table";
import { BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationshipFragment } from "@parallel/graphql/__types";
import { formatPartialDate } from "@parallel/utils/formatPartialDate";
import { getOpenSanctionsRelationship } from "@parallel/utils/getOpenSanctionsRelationship";
import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { isDefined, unique } from "remeda";

export function BackgroundCheckEntityDetailsRelationships({
  entityId,
  relationships,
}: {
  entityId: string;
  relationships: BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationshipFragment[];
}) {
  const router = useRouter();
  const { query } = router;

  /** returns the other entity in the relationship that is NOT the one with id: entityId */
  function getOtherEntity(
    entityId: string,
    relationship?: BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationshipFragment,
  ) {
    if (!isDefined(relationship)) {
      return null;
    }
    let entity: (typeof relationship)["properties"]["entityA"];
    if (
      isDefined(relationship.properties.entityA) &&
      relationship.properties.entityA.id !== entityId
    ) {
      entity = relationship.properties.entityA;
    } else if (
      isDefined(relationship.properties.entityB) &&
      relationship.properties.entityB.id !== entityId
    ) {
      entity = relationship.properties.entityB;
    } else {
      return null;
    }

    return entity;
  }

  const relationshipsColumns = useBackgroundCheckRelationshipsColumns(entityId);
  const context = useMemo(
    () => ({
      getOtherEntity,
    }),
    [entityId],
  );

  const handleRelationshipsRowClick = useCallback(
    function (
      row: BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationshipFragment,
    ) {
      const entity = getOtherEntity(entityId, row);
      if (isDefined(entity)) {
        const { token, name, date, type, readonly } = query;
        router.push(
          `/app/background-check/${entity.id}?${new URLSearchParams({
            ...(token && typeof token === "string" ? { token } : {}),
            ...(type && typeof type === "string" ? { type } : {}),
            ...(name && typeof name === "string" ? { name } : {}),
            ...(date && typeof date === "string" ? { date } : {}),
            ...(readonly === "true" ? { readonly: "true" } : {}),
          })}`,
        );
      }
    },
    [entityId],
  );

  return (
    <Card>
      <CardHeader omitDivider={relationships?.length > 0}>
        <Text as="span" fontWeight={600} fontSize="xl">
          <FormattedMessage
            id="component.background-check-entity-details-relationships.relationships"
            defaultMessage="Relationships"
          />{" "}
          {`(${relationships?.length ?? 0})`}
        </Text>
      </CardHeader>
      {relationships?.length ? (
        <Box overflowX="auto">
          <Table
            isHighlightable
            columns={relationshipsColumns}
            context={context}
            rows={relationships}
            rowKeyProp="id"
            onRowClick={handleRelationshipsRowClick}
          />
        </Box>
      ) : (
        <Center height="120px" textAlign="center">
          <Text>
            <FormattedMessage
              id="component.background-check-entity-details-relationships.no-relationships-found-message"
              defaultMessage="We have not found any relevant relationships for this entity"
            />
          </Text>
        </Center>
      )}
    </Card>
  );
}

BackgroundCheckEntityDetailsRelationships.fragments = {
  get BackgroundCheckEntityDetailsRelationship() {
    return gql`
      fragment BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationship on BackgroundCheckEntityDetailsRelationship {
        id
        type
        properties {
          entityA {
            id
            name
            type
          }
          entityB {
            id
            name
            type
          }
          startDate
          endDate
          relationship
        }
      }
    `;
  },
};

function useBackgroundCheckRelationshipsColumns(entityId: string) {
  const intl = useIntl();

  return useMemo<
    TableColumn<
      BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationshipFragment,
      {
        getOtherEntity: (
          entityId: string,
          relationship?: BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationshipFragment,
        ) => BackgroundCheckEntityDetailsRelationships_BackgroundCheckEntityDetailsRelationshipFragment["properties"]["entityA"];
      }
    >[]
  >(
    () => [
      {
        key: "name",
        label: intl.formatMessage({
          id: "page.background-check-profile-details.name",
          defaultMessage: "Name",
        }),
        CellContent: ({ row, context: { getOtherEntity } }) => {
          const entity = getOtherEntity(entityId, row);
          return <>{entity?.name}</>;
        },
      },
      {
        key: "type",
        label: intl.formatMessage({
          id: "component.dow-jones-profile-details.type",
          defaultMessage: "Type",
        }),
        CellContent: ({ row, context: { getOtherEntity } }) => {
          const entity = getOtherEntity(entityId, row);
          const type = entity?.type;

          if (type === "Company" || type === "Organization") {
            return (
              <HStack>
                <BusinessIcon />
                <Text>
                  <FormattedMessage
                    id="component.dow-jones-profile-details.entity"
                    defaultMessage="Entity"
                  />
                </Text>
              </HStack>
            );
          } else {
            return (
              <HStack>
                <UserIcon />
                <Text>
                  <FormattedMessage
                    id="component.dow-jones-profile-details.person"
                    defaultMessage="Person"
                  />
                </Text>
              </HStack>
            );
          }
        },
      },
      {
        key: "connectionType",
        label: intl.formatMessage({
          id: "page.background-check-profile-details.relation",
          defaultMessage: "Relation",
        }),
        CellContent: ({ row }) => {
          const properties = row.properties ?? {};
          return (
            <>
              {unique(
                properties.relationship?.map((relationship) =>
                  getOpenSanctionsRelationship({ relationship, intl }),
                ) ?? [],
              ).map((relationship, i) => (
                <Text
                  key={i}
                  sx={{
                    display: "block",
                    ":first-letter": {
                      textTransform: "uppercase",
                    },
                  }}
                >
                  {relationship}
                </Text>
              )) ?? "-"}
            </>
          );
        },
      },
      {
        key: "start",
        label: intl.formatMessage({
          id: "page.background-check-profile-details.start-date",
          defaultMessage: "Start date",
        }),
        cellProps: {
          whiteSpace: "nowrap",
          width: "180px",
        },
        CellContent: ({ row }) => {
          const properties = row.properties ?? {};
          return (
            <>
              {properties.startDate?.map((date, i) => (
                <Text key={i}>{formatPartialDate({ date })}</Text>
              )) ?? "-"}
            </>
          );
        },
      },
      {
        key: "end",
        label: intl.formatMessage({
          id: "page.background-check-profile-details.end-date",
          defaultMessage: "End date",
        }),
        cellProps: {
          whiteSpace: "nowrap",
          width: "180px",
        },
        CellContent: ({ row }) => {
          const properties = row.properties ?? {};
          return (
            <>
              {properties.endDate?.map((date, i) => (
                <Text key={i}>{formatPartialDate({ date })}</Text>
              )) ?? "-"}
            </>
          );
        },
      },
    ],
    [intl.locale, entityId],
  );
}
