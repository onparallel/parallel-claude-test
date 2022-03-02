import { FormControlOptions, Input, ThemingProps } from "@chakra-ui/react";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { Maybe } from "graphql/jsutils/Maybe";
import { useImperativeHandle, useMemo, useRef, useState } from "react";
import { IMaskInput } from "react-imask";
import { isDefined } from "remeda";

interface MaskedInputProps extends ThemingProps<"Input">, FormControlOptions {
  onChange: (value: string) => void;
  format?: Maybe<string>;
  value: string | undefined;
}

export const MaskedInput = chakraForwardRef<"input", MaskedInputProps>(function MaskedInput(
  { value, onChange, format, ...props },
  ref
) {
  const [_value, setValue] = useState(value ?? "");

  const inputRef = useRef<any>();

  useImperativeHandle(ref, () => {
    return inputRef.current?.element;
  });

  const handleOnAccept = (value: string) => {
    setValue(value);
    onChange(value);
  };

  const options = useMemo(() => {
    return isDefined(format) ? getInputFormatMaskOptions(format, _value) : {};
  }, [format, _value]);

  return (
    <Input
      as={IMaskInput}
      value={_value}
      onAccept={handleOnAccept}
      ref={inputRef}
      autoComplete="off"
      {...props}
      {...options}
    />
  );
});

function getInputFormatMaskOptions(format: string, value: string) {
  const prepare = (str: string) => {
    return str.toUpperCase();
  };

  const masks = {
    DNI: (value: string) => {
      if (/^[KLMXYZ][A-Za-z0-9 -]*$/.test(value)) {
        return { mask: "#0000000-a", definitions: { "#": /[KLMXYZ]/ }, prepare };
      } else {
        return { mask: "#0000000a", definitions: { "#": /[1234567890KLMXYZ]/ }, prepare };
      }
    },
    CIF: (value: string) => {
      if (/^[ABCDEFGHJUV][A-Za-z0-9 -]*$/.test(value)) {
        return { mask: "#00000000", definitions: { "#": /[ABCDEFGHJUV]/ }, prepare };
      } else {
        return { mask: "#0000000a", definitions: { "#": /[ABCDEFGHJUVPQRSNW]/ }, prepare };
      }
    },
    IBAN: (value: string) => {
      const ibanMasks = [
        ["AD", "F04F04A12"],
        ["AE", "F03F16"],
        ["AL", "F08A16"],
        ["AT", "F05F11"],
        ["AZ", "U04A20"],
        ["BA", "F03F03F08F02"],
        ["BE", "F03F07F02"],
        ["BG", "U04F04F02A08"],
        ["BH", "U04A14"],
        ["BR", "F08F05F10U01A01"],
        ["BY", "A04F04A16"],
        ["CH", "F05A12"],
        ["CR", "F04F14"],
        ["CY", "F03F05A16"],
        ["CZ", "F04F06F10"],
        ["DE", "F08F10"],
        ["DK", "F04F09F01"],
        ["DO", "U04F20"],
        ["EE", "F02F02F11F01"],
        ["EG", "F04F04F17"],
        ["ES", "F04F04F01F01F10"],
        ["FI", "F06F07F01"],
        ["FO", "F04F09F01"],
        ["FR", "F05F05A11F02"],
        ["GB", "U04F06F08"],
        ["GE", "U02F16"],
        ["GI", "U04A15"],
        ["GL", "F04F09F01"],
        ["GR", "F03F04A16"],
        ["GT", "A04A20"],
        ["HR", "F07F10"],
        ["HU", "F03F04F01F15F01"],
        ["IE", "U04F06F08"],
        ["IL", "F03F03F13"],
        ["IS", "F04F02F06F10"],
        ["IT", "U01F05F05A12"],
        ["IQ", "U04F03A12"],
        ["JO", "A04F22"],
        ["KW", "U04A22"],
        ["KZ", "F03A13"],
        ["LB", "F04A20"],
        ["LC", "U04F24"],
        ["LI", "F05A12"],
        ["LT", "F05F11"],
        ["LU", "F03A13"],
        ["LV", "U04A13"],
        ["MC", "F05F05A11F02"],
        ["MD", "U02A18"],
        ["ME", "F03F13F02"],
        ["MK", "F03A10F02"],
        ["MR", "F05F05F11F02"],
        ["MT", "U04F05A18"],
        ["MU", "U04F02F02F12F03U03"],
        ["NL", "U04F10"],
        ["NO", "F04F06F01"],
        ["PK", "U04A16"],
        ["PL", "F08F16"],
        ["PS", "U04A21"],
        ["PT", "F04F04F11F02"],
        ["QA", "U04A21"],
        ["RO", "U04A16"],
        ["RS", "F03F13F02"],
        ["SA", "F02A18"],
        ["SC", "U04F04F16U03"],
        ["SE", "F03F16F01"],
        ["SI", "F05F08F02"],
        ["SK", "F04F06F10"],
        ["SM", "U01F05F05A12"],
        ["ST", "F08F11F02"],
        ["SV", "U04F20"],
        ["TL", "F03F14F02"],
        ["TN", "F02F03F13F02"],
        ["TR", "F05F01A16"],
        ["UA", "F25"],
        ["VA", "F18"],
        ["VG", "U04F16"],
        ["XK", "F04F10F02"],
        // The following countries are not included in the official IBAN registry but use the IBAN specification
        ["AO", "F21"],
        ["BF", "F23"],
        ["BI", "F12"],
        ["BJ", "F24"],
        ["CI", "U02F22"],
        ["CM", "F23"],
        ["CV", "F21"],
        ["DZ", "F20"],
        ["IR", "F22"],
        ["MG", "F23"],
        ["ML", "U01F23"],
        ["MZ", "F21"],
        ["SN", "U01F23"],
        // The following are regional and administrative French Republic subdivision IBAN specification (same structure as FR, only country code vary)
        ["GF", "F05F05A11F02"],
        ["GP", "F05F05A11F02"],
        ["MQ", "F05F05A11F02"],
        ["RE", "F05F05A11F02"],
        ["PF", "F05F05A11F02"],
        ["TF", "F05F05A11F02"],
        ["YT", "F05F05A11F02"],
        ["NC", "F05F05A11F02"],
        ["BL", "F05F05A11F02"],
        ["MF", "F05F05A11F02"],
        ["PM", "F05F05A11F02"],
        ["WF", "F05F05A11F02"],
      ].map(([country, format]) => {
        let full = format
          .match(/(.{3})/g)
          ?.map(function (block) {
            const pattern = block.slice(0, 1);
            const repeats = parseInt(block.slice(1), 10);
            return pattern.repeat(repeats);
          })
          .join("");
        let mask = `{${country}}00`;
        if (full) {
          while (full.length) {
            mask += " " + full.slice(0, 4);
            full = full.slice(4);
          }
        }

        return { mask, definitions: { A: /[0-9A-Z]/, F: /[0-9]/, U: /[A-Z]/ } };
      });

      const match = ibanMasks.find((options) =>
        options.mask.startsWith("{" + value.slice(0, 2).toUpperCase())
      );

      if (value && value.length > 1 && match) {
        return { mask: match.mask, definitions: match.definitions, prepare };
      } else {
        return {
          mask: "aa00 AAAA AAAA AAAA AAAA AAAA AAAA AAAA",
          definitions: { A: /[0-9A-Z]/ },
          prepare,
        };
      }
    },
    SSN_SPAIN: () => ({
      mask: "00 00000000 00",
      type: "tel",
    }),
    SSN_USA: () => ({
      mask: "000-00-0000",
      type: "tel",
    }),
    POSTAL_SPAIN: () => ({
      mask: "00000",
      type: "tel",
    }),
    POSTAL_USA: () => ({
      mask: "00000",
      type: "tel",
    }),
  } as Record<string, any>;

  return masks[format](value) ?? {};
}
