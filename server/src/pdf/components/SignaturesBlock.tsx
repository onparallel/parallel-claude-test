import { StyleSheet, View } from "@react-pdf/renderer";
import gql from "graphql-tag";
import { useIntl } from "react-intl";
import { chunk, isNonNullish, times } from "remeda";
import { ContactLocale } from "../../db/__types";
import { FORMATS } from "../../util/dates";
import { isEmptyRTEValue } from "../../util/slate/utils";
import { SignaturesBlock_SignatureConfigFragment } from "../__types";
import { getHardcodedSignatures } from "../utils/hardcodedSignatures";
import { useTheme } from "../utils/ThemeProvider";
import { RichTextBlock } from "./RichTextBlock";
import { SignatureBox } from "./SignatureBox";

interface SignaturesBlockProps {
  signatureConfig: SignaturesBlock_SignatureConfigFragment;
  templateId?: string | null;
}

export function SignaturesBlock({ signatureConfig, templateId }: SignaturesBlockProps) {
  const theme = useTheme();
  const intl = useIntl();

  const styles = StyleSheet.create({
    text: {
      fontFamily: theme.textFontFamily,
      fontSize: `${(theme.textFontSize * 11) / 12}pt`,
      color: theme.textColor,
    },
    signerFirst: {
      flex: 1,
    },
    signerRest: {
      flex: 1,
      marginLeft: "5mm",
    },
  });

  const date = intl.formatDate(new Date(), {
    timeZone: signatureConfig.timezone,
    ...FORMATS.L,
  });

  const signers = [
    ...(process.env.NODE_ENV === "production" && isNonNullish(templateId)
      ? getHardcodedSignatures(templateId).map((s) => ({ ...s, date }))
      : []),
    ...signatureConfig.signers!.map((signer, i) => ({
      wordAnchor: `3cb39pzCQA9wJ${i}`,
      fullName: signer!.fullName,
      date,
    })),
  ];

  const legalText = theme.legalText[intl.locale as ContactLocale];
  return (
    <View
      style={{ paddingTop: "4mm", display: "flex", flexDirection: "column", gap: "5mm" }}
      wrap={false}
    >
      {isNonNullish(legalText) && !isEmptyRTEValue(legalText) ? (
        <View style={[styles.text]}>
          <RichTextBlock>{legalText}</RichTextBlock>
        </View>
      ) : null}
      {chunk(signers, 3).map((row, i) => (
        <View key={i} style={{ flexDirection: "row" }}>
          {row.map((signer, i) => (
            <View key={i} style={{ flex: 1, marginLeft: i === 0 ? 0 : "5mm" }}>
              <SignatureBox {...signer} />
            </View>
          ))}
          {/* Add dummy views with same width as signatures to ensure the widths of the actual signatures */}
          {times(3 - row.length, (i) => (
            <View key={i} style={{ flex: 1, marginLeft: "5mm" }} />
          ))}
        </View>
      ))}
    </View>
  );
}

SignaturesBlock.fragments = {
  SignatureConfig: gql`
    fragment SignaturesBlock_SignatureConfig on SignatureConfig {
      signers {
        fullName
        email
      }
      timezone
    }
  `,
};
