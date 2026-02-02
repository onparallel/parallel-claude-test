import {
  buildPollingLastChangeFilter,
  buildPollingLastChangeOrderBy,
  dateToSapDatetime,
  sapDatetimeAndTimeToDate,
  serializeSapEntityFilter,
  serializeSapEntityOrderBy,
  walkSapEntitySetFilterExpression,
} from "../helpers";

describe("SAP ODATA helpers", () => {
  it("serializeSapEntityFilter", () => {
    expect(
      serializeSapEntityFilter({
        operator: "and",
        conditions: [
          {
            left: { type: "property", name: "CreatedOn" },
            operator: "gt",
            right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
          },
        ],
      }),
    ).toEqual("CreatedOn gt datetime'2025-01-01T00:00:00'");

    expect(
      serializeSapEntityFilter({
        operator: "and",
        conditions: [
          {
            operator: "or",
            conditions: [
              {
                left: { type: "property", name: "LastChangeDate" },
                operator: "gt",
                right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
              },
              {
                operator: "and",
                conditions: [
                  {
                    left: { type: "property", name: "LastChangeDate" },
                    operator: "eq",
                    right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
                  },
                  {
                    left: { type: "property", name: "LastChangeTime" },
                    operator: "gt",
                    right: { type: "literal", value: "time'PT05H30M00S'" },
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toEqual(
      "LastChangeDate gt datetime'2025-01-01T00:00:00' or (LastChangeDate eq datetime'2025-01-01T00:00:00' and LastChangeTime gt time'PT05H30M00S')",
    );

    expect(
      serializeSapEntityFilter({
        operator: "and",
        conditions: [
          {
            operator: "or",
            conditions: [
              {
                left: { type: "property", name: "LastChangeDate" },
                operator: "gt",
                right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
              },
              {
                operator: "and",
                conditions: [
                  {
                    left: { type: "property", name: "LastChangeDate" },
                    operator: "eq",
                    right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
                  },
                  {
                    left: { type: "property", name: "LastChangeTime" },
                    operator: "gt",
                    right: { type: "literal", value: "time'PT05H30M00S'" },
                  },
                ],
              },
            ],
          },
          {
            left: { type: "property", name: "BusinessPartner" },
            operator: "eq",
            right: { type: "literal", value: "'1234567890'" },
          },
        ],
      }),
    ).toEqual(
      "(LastChangeDate gt datetime'2025-01-01T00:00:00' or (LastChangeDate eq datetime'2025-01-01T00:00:00' and LastChangeTime gt time'PT05H30M00S')) and BusinessPartner eq '1234567890'",
    );

    expect(
      serializeSapEntityFilter({
        operator: "and",
        conditions: [
          {
            operator: "or",
            conditions: [
              {
                left: { type: "property", name: "LastChangeDate" },
                operator: "gt",
                right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
              },
              {
                operator: "and",
                conditions: [
                  {
                    left: { type: "property", name: "LastChangeDate" },
                    operator: "eq",
                    right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
                  },
                  {
                    left: { type: "property", name: "LastChangeTime" },
                    operator: "gt",
                    right: { type: "literal", value: "time'PT05H30M00S'" },
                  },
                ],
              },
            ],
          },
          {
            left: { type: "property", name: "BusinessPartner" },
            operator: "eq",
            right: { type: "literal", value: "'1234567890'" },
          },
          {
            left: { type: "property", name: "BusinessPartner" },
            operator: "ne",
            right: { type: "literal", value: "'X'" },
          },
          {
            operator: "or",
            conditions: [
              {
                left: { type: "property", name: "CreatedOn" },
                operator: "eq",
                right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
              },
              {
                left: { type: "property", name: "CreatedTime" },
                operator: "gt",
                right: { type: "literal", value: "time'PT05H30M00S'" },
              },
            ],
          },
        ],
      }),
    ).toEqual(
      "(LastChangeDate gt datetime'2025-01-01T00:00:00' or (LastChangeDate eq datetime'2025-01-01T00:00:00' and LastChangeTime gt time'PT05H30M00S')) and BusinessPartner eq '1234567890' and BusinessPartner ne 'X' and (CreatedOn eq datetime'2025-01-01T00:00:00' or CreatedTime gt time'PT05H30M00S')",
    );
  });

  it("serializeSapEntityOrderBy", () => {
    expect(serializeSapEntityOrderBy([["CreatedOn", "asc"]])).toEqual("CreatedOn asc");

    expect(
      serializeSapEntityOrderBy([
        ["CreatedOn", "asc"],
        ["CreatedTime", "desc"],
      ]),
    ).toEqual("CreatedOn asc, CreatedTime desc");
  });

  it("buildPollingLastChangeFilter", () => {
    expect(
      buildPollingLastChangeFilter(
        { type: "DATETIME_TIME", fields: ["CreatedOn", "CreatedTime"] },
        new Date("2025-01-01T06:30:00.000Z"),
      ),
    ).toEqual({
      operator: "or",
      conditions: [
        {
          left: { type: "property", name: "CreatedOn" },
          operator: "gt",
          right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
        },
        {
          operator: "and",
          conditions: [
            {
              left: { type: "property", name: "CreatedOn" },
              operator: "eq",
              right: { type: "literal", value: "datetime'2025-01-01T00:00:00'" },
            },
            {
              left: { type: "property", name: "CreatedTime" },
              operator: "gt",
              right: { type: "literal", value: "time'PT06H30M00S'" },
            },
          ],
        },
      ],
    });

    expect(
      buildPollingLastChangeFilter(
        { type: "DATETIME", field: "CreatedOn" },
        new Date("2025-01-01T06:30:00.000Z"),
      ),
    ).toEqual({
      left: { type: "property", name: "CreatedOn" },
      operator: "gt",
      right: { type: "literal", value: "datetime'2025-01-01T06:30:00.000'" },
    });

    expect(
      buildPollingLastChangeFilter(
        { type: "DATETIME_OFFSET", field: "CreatedOn" },
        new Date("2025-01-01T06:30:00.000Z"),
      ),
    ).toEqual({
      left: { type: "property", name: "CreatedOn" },
      operator: "gt",
      right: { type: "literal", value: "datetimeoffset'2025-01-01T06:30:00.000Z'" },
    });
  });

  it("buildPollingLastChangeOrderBy", () => {
    expect(buildPollingLastChangeOrderBy({ type: "DATETIME", field: "CreatedOn" })).toEqual([
      ["CreatedOn", "desc"],
    ]);

    expect(buildPollingLastChangeOrderBy({ type: "DATETIME_OFFSET", field: "CreatedOn" })).toEqual([
      ["CreatedOn", "desc"],
    ]);

    expect(
      buildPollingLastChangeOrderBy({
        type: "DATETIME_TIME",
        fields: ["CreatedOn", "CreatedTime"],
      }),
    ).toEqual([
      ["CreatedOn", "desc"],
      ["CreatedTime", "desc"],
    ]);
  });

  it("datetimeAndTimeToDate", () => {
    expect(sapDatetimeAndTimeToDate("/Date(1591315200000)/", "PT10H30M32S")).toEqual(
      new Date("2020-06-05T10:30:32.000Z"),
    );

    expect(sapDatetimeAndTimeToDate("/Date(1591315219400)/", "PT10H30M32S")).toEqual(
      new Date("2020-06-05T10:30:32.000Z"),
    );
  });

  it("dateToSapDatetime", () => {
    expect(dateToSapDatetime(new Date("2020-06-05T10:30:32.000Z"))).toEqual(
      "/Date(1591353032000)/",
    );

    expect(dateToSapDatetime(new Date("2020-06-05T10:30:32.000Z"))).toEqual(
      "/Date(1591353032000)/",
    );
  });

  it("walkSapEntitySetFilterExpression", () => {
    const paramValues = {
      createdOn: "2025-09-10",
    } as Record<string, string>;

    expect(
      walkSapEntitySetFilterExpression(
        {
          operator: "and",
          conditions: [
            {
              left: { type: "property", name: "CreatedOn" },
              operator: "gt",
              right: { type: "literal", value: "{{createdOn}}" },
            },
          ],
        },
        (expr) => {
          if ("type" in expr && expr.type === "literal") {
            return {
              ...expr,
              value: expr.value.replace(
                /\{\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}\}/g,
                (_, p1) => paramValues[p1] ?? "",
              ),
            };
          } else {
            return expr;
          }
        },
      ),
    ).toEqual({
      operator: "and",
      conditions: [
        {
          left: { type: "property", name: "CreatedOn" },
          operator: "gt",
          right: { type: "literal", value: "2025-09-10" },
        },
      ],
    });
  });
});
