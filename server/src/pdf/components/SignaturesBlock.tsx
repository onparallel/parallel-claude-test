import { StyleSheet, View } from "@react-pdf/renderer";
import { Style } from "@react-pdf/types";
import { gql } from "apollo-server-core";
import { useIntl } from "react-intl";
import { chunk, isDefined, times } from "remeda";
import { FORMATS } from "../../util/dates";
import { useTheme } from "../utils/ThemeProvider";
import { SignaturesBlock_SignatureConfigFragment } from "../__types";
import { RichTextBlock } from "./RichTextBlock";
import { SignatureBox, SignatureBoxProps } from "./SignatureBox";

interface SignaturesBlockProps {
  signatureConfig: SignaturesBlock_SignatureConfigFragment;
  templateId?: string | null;
  style?: Style | Style[];
}

export function SignaturesBlock({ signatureConfig, templateId, style }: SignaturesBlockProps) {
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
    ...(process.env.NODE_ENV === "production" && isDefined(templateId)
      ? [
          "EAwW2jXkP4C9LjU2b3",
          "EAwW2jXkP4C9LjU2fS",
          "EAwW2jXkP4C9Lf4DDK",
          "zas25KHxAByKWUZSNGc",
        ].includes(templateId)
        ? [
            {
              fullName: "Guillermo Preckler",
              signatureImageUrl:
                "https://static.onparallel.com/static/images/signatures/guillermo-preckler-brickbro.png",
              date,
            } as SignatureBoxProps,
          ]
        : templateId === "EAwW2jXkP4C9LbfNRp"
        ? [
            {
              fullName: "TIKO",
              signatureImageUrl:
                "https://static.onparallel.com/static/images/signatures/sello-tiko.png",
              date,
            } as SignatureBoxProps,
          ]
        : templateId === "zas25KHxAByKWUgG8U2"
        ? [
            {
              fullName: "Marta Blanco Maseda",
              signatureImageUrl:
                "https://static.onparallel.com/static/images/signatures/marta-blanco-maseda-imasd.png",
              date,
            } as SignatureBoxProps,
          ]
        : []
      : []),
    ...signatureConfig.signers!.map(
      (signer, i) =>
        ({
          wordAnchor: `3cb39pzCQA9wJ${i}`,
          fullName: signer!.fullName,
          date,
        } as SignatureBoxProps)
    ),
  ];

  return (
    <View style={style} wrap={false}>
      <View style={[styles.text]}>
        <RichTextBlock>{theme.legalText[intl.locale as "es" | "en"]}</RichTextBlock>
      </View>
      {chunk(signers, 3).map((row, i) => (
        <View key={i} style={{ flexDirection: "row", marginTop: "5mm" }}>
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
