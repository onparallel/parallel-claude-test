import { identity } from "remeda";
import { assert } from "ts-essentials";
import { never } from "../../../util/never";
import {
  SapEntitySetFilterExpression,
  SapEntitySetFilterFunctionCall,
  SapEntitySetFilterLeaf,
  SapEntitySetFilterRootExpression,
  SapEntitySetOrderBy,
  SapPollingLastChangeStrategy,
} from "./types";

export function serializeSapEntityFilter(
  filter:
    | SapEntitySetFilterRootExpression
    | SapEntitySetFilterFunctionCall
    | SapEntitySetFilterLeaf,
  depth = 0,
): string {
  if ("conditions" in filter) {
    if (filter.conditions.length === 1) {
      return serializeSapEntityFilter(filter.conditions[0], depth);
    } else {
      const serialized = filter.conditions
        .map((c) => serializeSapEntityFilter(c, depth + 1))
        .join(` ${filter.operator} `);
      return depth === 0 ? serialized : `(${serialized})`;
    }
  } else if ("operator" in filter) {
    if (filter.operator === "not") {
      return `not ${serializeSapEntityFilter(filter.expr, depth + 1)}`;
    } else {
      return `${serializeSapEntityFilter(filter.left, depth + 1)} ${filter.operator} ${serializeSapEntityFilter(filter.right, depth + 1)}`;
    }
  } else if ("function" in filter) {
    return `${filter.function}(${filter.args.map((a) => serializeSapEntityFilter(a, depth + 1)).join(", ")})`;
  } else if (filter.type === "property") {
    return filter.name;
  } else if (filter.type === "literal") {
    return filter.value;
  } else {
    never("Unimplemented filter node");
  }
}

export function serializeSapEntityOrderBy(orderBy: SapEntitySetOrderBy): string {
  return orderBy.map(([field, order]) => `${field} ${order}`).join(", ");
}

export function buildPollingLastChangeFilter(
  strategy: SapPollingLastChangeStrategy,
  changedAfter: Date,
): SapEntitySetFilterRootExpression {
  switch (strategy.type) {
    case "DATETIME_TIME": {
      const [dateField, timeField] = strategy.fields;
      const [dateOnly, timeOnly] = changedAfter.toISOString().split("T");
      const dateValue = `datetime'${dateOnly}T00:00:00'`;
      const timeValue = timeOnly.replace(/^(\d{2}):(\d{2}):(\d{2}).\d{3}Z$/, (_, h, m, s) => {
        return `time'PT${h}H${m}M${s}S'`;
      });
      return {
        operator: "or",
        conditions: [
          {
            left: { type: "property", name: dateField },
            operator: "gt",
            right: { type: "literal", value: dateValue },
          },
          {
            operator: "and",
            conditions: [
              {
                left: { type: "property", name: dateField },
                operator: "eq",
                right: { type: "literal", value: dateValue },
              },
              {
                left: { type: "property", name: timeField },
                operator: "gt",
                right: { type: "literal", value: timeValue },
              },
            ],
          },
        ],
      };
    }
    case "DATETIME":
    case "DATETIME_OFFSET": {
      const type = strategy.type === "DATETIME" ? "datetime" : "datetimeoffset";
      let value = changedAfter.toISOString();
      if (strategy.type === "DATETIME") {
        value = value.replace(/Z$/, "");
      }
      return {
        operator: "gt",
        left: { type: "property", name: strategy.field },
        right: {
          type: "literal",
          value: `${type}'${value}'`,
        },
      };
    }
    default:
      never("Unimplemented polling last change strategy");
  }
}

export function buildPollingLastChangeOrderBy(
  strategy: SapPollingLastChangeStrategy,
): SapEntitySetOrderBy {
  switch (strategy.type) {
    case "DATETIME_TIME": {
      const [dateField, timeField] = strategy.fields;
      return [
        [dateField, "desc"],
        [timeField, "desc"],
      ];
    }
    case "DATETIME":
    case "DATETIME_OFFSET": {
      return [[strategy.field, "desc"]];
    }
    default:
      never("Unimplemented polling last change strategy");
  }
}

export function sapDatetimeAndTimeToDate(datetime: string, time: string) {
  // datetime: "/Date(1591315200000)/", time: "PT10H30M32S"
  const datetimeMatch = datetime.match(/^\/Date\((\d+)(\+0000)?\)\/$/);
  return new Date(
    new Date(parseInt(datetimeMatch![1])).toISOString().replace(/(?<=T).*/, "") +
      time.replaceAll(/(PT|S)/g, "").replaceAll(/[HM]/g, ":") +
      "Z",
  );
}

export function sapDatetimeToDate(datetime: string) {
  // datetime: "/Date(1591315200000)/"
  const datetimeMatch = datetime.match(/^\/Date\((\d+)(\+0000)?\)\/$/);
  return new Date(parseInt(datetimeMatch![1]));
}

export function dateToSapDatetime(date: Date) {
  return `/Date(${date.valueOf()})/`;
}

type ExpressionHandler = (expr: SapEntitySetFilterExpression) => SapEntitySetFilterExpression;

export function walkSapEntitySetFilterExpression(
  expr: SapEntitySetFilterExpression,
  handler: ExpressionHandler | { before?: ExpressionHandler; after?: ExpressionHandler },
): SapEntitySetFilterExpression {
  const handlers = typeof handler === "function" ? { before: handler } : handler;
  const { before = identity, after = identity } = handlers;
  expr = before(expr);
  if ("conditions" in expr) {
    return after({
      ...expr,
      conditions: expr.conditions.map((c) => {
        const result = walkSapEntitySetFilterExpression(c, { before, after });
        assert("operator" in result, "expression must be a root expression");
        return result;
      }),
    });
  } else if ("operator" in expr) {
    if (expr.operator === "not") {
      const result = walkSapEntitySetFilterExpression(expr.expr, { before, after });
      assert(
        "operator" in result || "function" in result,
        "child expression must be a root expression or a function expression",
      );
      return after({
        ...expr,
        expr: result,
      });
    } else {
      const left = walkSapEntitySetFilterExpression(expr.left, { before, after });
      assert("function" in left || "type" in left, "left must be a function expression or a leaf");
      const right = walkSapEntitySetFilterExpression(expr.right, { before, after });
      assert(
        "function" in right || "type" in right,
        "right must be a function expression or a leaf",
      );
      return after({ ...expr, left, right });
    }
  } else if ("function" in expr) {
    return after({
      ...expr,
      args: expr.args.map((a) => {
        const result = walkSapEntitySetFilterExpression(a, { before, after });
        assert("type" in result, "arg must be a leaf");
        return result;
      }),
    });
  } else if ("type" in expr) {
    return after(expr);
  } else {
    never("Unimplemented filter node");
  }
}
