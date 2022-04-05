import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { Style } from "@react-pdf/types";
import { gql } from "apollo-server-core";
import { FormattedMessage, useIntl } from "react-intl";
import { chunk, times } from "remeda";
import { FORMATS } from "../../emails/utils/dates";
import { useTheme } from "../utils/ThemeProvider";
import { SignaturesBlock_SignatureConfigFragment } from "../__types";
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
      fontSize: theme.textFontSize,
      color: theme.textColor,
    },
    disclaimer: {
      fontStyle: "italic",
      fontSize: (theme.textFontSize * 11) / 12,
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
    ...(process.env.NODE_ENV === "production"
      ? templateId === "EAwW2jXkP4C9LjU2b3" || templateId === "EAwW2jXkP4C9LjU2fS"
        ? [
            {
              fullName: "Guillermo Preckler",
              signatureImageUrl:
                "https://www.onparallel.com/static/images/signatures/guillermo-preckler-brickbro.png",
              date,
            } as SignatureBoxProps,
          ]
        : templateId === "EAwW2jXkP4C9LbfNRp"
        ? [
            {
              fullName: "TIKO",
              signatureImageUrl:
                "https://www.onparallel.com/static/images/signatures/sello-tiko.png",
              date,
            } as SignatureBoxProps,
          ]
        : []
      : []),
    ...signatureConfig.signers!.map(
      (signer, i) =>
        ({
          wordAnchor: `3cb39pzCQA9wJ${i}`,
          fullName: signer.fullName,
          date,
        } as SignatureBoxProps)
    ),
  ];
  return (
    <View style={style} wrap={false}>
      <Text style={[styles.text, styles.disclaimer]}>
        <FormattedMessage
          id="document.petition-export.signatures-disclaimer"
          defaultMessage="I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and the current identification information."
        />
      </Text>
      {chunk(signers, 3).map((row, i) => (
        <View key={i} style={{ flexDirection: "row", marginTop: "5mm" }}>
          {row.map((signer, i) => (
            <SignatureBox
              key={i}
              {...signer}
              style={{ flex: 1, marginLeft: i === 0 ? 0 : "5mm" }}
            />
          ))}
          {/* Add dummy views with same width as signatures to ensure the widths of the actual signatures */}
          {times(3 - signers.length, (i) => (
            <View key={i} style={{ flex: 1, marginLeft: i === 0 ? 0 : "5mm" }} />
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
