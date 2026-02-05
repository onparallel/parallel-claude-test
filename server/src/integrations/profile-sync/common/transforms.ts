import { JSONSchema } from "json-schema-to-ts";
import {
  CountryCode,
  format as formatPhoneNumber,
  parsePhoneNumberWithError,
} from "libphonenumber-js";
import { isNonNullish, round } from "remeda";
import { never } from "../../../util/never";
import { MaybePromise } from "../../../util/types";

interface FieldTransformContext {
  definitions: Record<string, FieldTransformDefinition>;
}

interface FieldTransformDefinition {
  handler: (value: any[], options: any, context: FieldTransformContext) => MaybePromise<any[]>;
  options?: Record<string, JSONSchema>;
  required?: string[];
}

export const GENERIC_FIELD_TRANSFORMS = {
  UPPERCASE: {
    handler: (v: any[]) => v.map((v) => (typeof v === "string" ? v.toUpperCase() : undefined)),
  },
  LOWERCASE: {
    handler: (v: any[]) => v.map((v) => (typeof v === "string" ? v.toLowerCase() : undefined)),
  },
  ROUND: {
    handler: (v: any[], options: { decimals?: number }) =>
      v.map((v) => (typeof v === "number" ? round(v, options.decimals ?? 0) : undefined)),
    options: {
      properties: {
        decimals: { type: "number" },
      },
    },
  },
  PARSE_INT: {
    handler: (v: any[]) => v.map((v) => (typeof v === "string" ? parseInt(v) : undefined)),
  },
  PARSE_DECIMAL: {
    handler: (v: any[]) => v.map((v) => (typeof v === "string" ? parseFloat(v) : undefined)),
  },
  MAP: {
    handler: (
      v: any[],
      options: {
        map: { from: string; to: string }[];
        default?: "IGNORE" | "VALUE" | "SAME";
        defaultValue?: string;
      },
    ) =>
      v.map((v) => {
        if (typeof v !== "string") {
          return undefined;
        }
        const option = options.map.find((m) => m.from === v);
        if (isNonNullish(option)) {
          return option.to;
        } else if (options.default === "SAME") {
          return v;
        } else if (options.default === "VALUE") {
          return options.defaultValue;
        } else {
          return undefined;
        }
      }),
    options: {
      default: { type: "string", enum: ["IGNORE", "VALUE", "SAME"] },
      defaultValue: { type: "string" },
      map: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: { from: { type: "string" }, to: { type: "string" } },
        },
      },
    },
    required: ["map"],
  },
  REGEX_REPLACE: {
    handler: (v: any[], options: { pattern: string; replacement: string }) =>
      v.map((v) =>
        typeof v === "string"
          ? v.replace(new RegExp(options.pattern, "g"), options.replacement)
          : undefined,
      ),
    options: {
      pattern: { type: "string" },
      replacement: { type: "string" },
    },
  },
  TRIM: {
    handler: (v: any[]) => v.map((v) => (typeof v === "string" ? v.trim() : undefined)),
  },
  APPEND: {
    handler: (v: any[], options: { value: string }) =>
      v.map((v) => (typeof v === "string" ? v + options.value : undefined)),
    options: {
      value: { type: "string" },
    },
  },
  PREPEND: {
    handler: (v: any[], options: { value: string }) =>
      v.map((v) => (typeof v === "string" ? options.value + v : undefined)),
    options: {
      value: { type: "string" },
    },
  },
  IGNORE_IF: {
    handler: (v: any[], options: { value: string | number | null | boolean }) =>
      v.map((v) => (v === options.value ? undefined : v)),
    options: {
      value: { type: ["string", "number", "null", "boolean"] as const },
    },
  },
  IGNORE_IF_EMPTY_ARRAY: {
    handler: (v: any[]) =>
      v.map((v) => (Array.isArray(v) ? (v.length === 0 ? undefined : v) : undefined)),
  },
  PAD_LEFT: {
    handler: (v: any[], options: { length: number; character: string }) =>
      v.map((v) =>
        typeof v === "string" ? v.padStart(options.length, options.character) : undefined,
      ),
    options: {
      length: { type: "number" },
      character: { type: "string" },
    },
  },
  PAD_RIGHT: {
    handler: (v: any[], options: { length: number; character: string }) =>
      v.map((v) =>
        typeof v === "string" ? v.padEnd(options.length, options.character) : undefined,
      ),
    options: {
      length: { type: "number" },
      character: { type: "string" },
    },
  },
  JOIN: {
    handler: (v: any[], options: { separator?: string }) => [v.join(options.separator)],
    options: {
      separator: { type: "string" },
    },
  },
  SPLIT: {
    handler: (v: any[], options: { separator: string; limit?: number }) =>
      v.flatMap((v) => (typeof v === "string" ? v.split(options.separator, options.limit) : [])),
    options: {
      separator: { type: "string" },
      limit: { type: "number" },
    },
  },
  WRAP_IN_ARRAY: {
    handler: (v: any[]) => [v],
  },
  FLATTEN_ARRAY: {
    handler: (v: any[]) => v.flat(),
  },
  PARSE_INT_PHONE_NUMBER: {
    handler: (v: any[]) =>
      v.flatMap((v) => {
        if (typeof v === "string") {
          const { country, nationalNumber } = parsePhoneNumberWithError(v);
          return [nationalNumber, country];
        } else {
          return undefined;
        }
      }),
  },
  FORMAT_INT_PHONE_NUMBER: {
    handler: ([nationalNumber, country]: any[]) => [
      typeof nationalNumber === "string" && typeof country === "string"
        ? formatPhoneNumber(nationalNumber, country as CountryCode, "INTERNATIONAL")
        : undefined,
    ],
  },
  REVERSE_ARRAY: {
    handler: (v: any[]) => v.reverse(),
  },
  CUSTOM: {
    handler: async (value: any[], options: { transform: (values: any[]) => MaybePromise<any[]> }) =>
      await options.transform(value),
  },
  COERCE: {
    handler: (v: any[], options: { to: "string" | "number" | "boolean" }) => {
      switch (options.to) {
        case "string":
          return v.map((v) => v.toString());
        case "number":
          return v.map((v) => Number(v));
        case "boolean":
          return v.map((v) => v === "true");
      }
    },
    options: {
      to: { type: "string", enum: ["string", "number", "boolean"] },
    },
  },
  TAKE: {
    handler: (v: any[], options: { count: number }) => v.slice(0, options.count),
    options: {
      count: { type: "number" },
    },
  },
  REPEAT: {
    handler: (v: any[], options: { times: number }) =>
      v.flatMap((v) => Array(options.times).fill(v)),
    options: {
      times: { type: "number" },
    },
  },
  AT: {
    handler: never as any,
    options: {
      index: { type: "array", items: { type: "number" }, minLength: 1, maxLength: 2 },
      transforms: { type: "array" },
    },
  },
} as Record<string, FieldTransformDefinition>;

export async function applyFieldTransforms(
  definitions: Record<string, FieldTransformDefinition>,
  transforms: { type: string }[],
  values: any[],
) {
  let result = values;
  const context = { definitions };
  for (const transform of transforms) {
    if (transform.type === "AT") {
      const [from, to = from + 1] = (transform as any).index as [number, number | undefined];
      result.splice(
        from,
        to - from,
        ...(await applyFieldTransforms(
          definitions,
          (transform as any).transforms,
          result.slice(from, to),
        )),
      );
    } else {
      result = await definitions[transform.type].handler(result, transform as any, context);
    }
  }
  return result;
}
