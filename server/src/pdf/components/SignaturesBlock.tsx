import { StyleSheet, View } from "@react-pdf/renderer";
import gql from "graphql-tag";
import { useIntl } from "react-intl";
import { chunk, isDefined, times } from "remeda";
import { ContactLocale } from "../../db/__types";
import { FORMATS } from "../../util/dates";
import { isEmptyRTEValue } from "../../util/slate/utils";
import { SignaturesBlock_SignatureConfigFragment } from "../__types";
import { useTheme } from "../utils/ThemeProvider";
import { RichTextBlock } from "./RichTextBlock";
import { SignatureBox, SignatureBoxProps } from "./SignatureBox";

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

  const signers: SignatureBoxProps[] = [];

  if (process.env.NODE_ENV === "production" && isDefined(templateId)) {
    if (
      [
        "EAwW2jXkP4C9LjU2b3",
        "EAwW2jXkP4C9LjU2fS",
        "EAwW2jXkP4C9Lf4DDK",
        "zas25KHxAByKWUZSNGc",
      ].includes(templateId)
    ) {
      signers.push({
        fullName: "Guillermo Preckler",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/guillermo-preckler-brickbro.png",
        date,
      });
    } else if (templateId === "EAwW2jXkP4C9LbfNRp") {
      signers.push({
        fullName: "TIKO",
        signatureImageUrl: "https://static.onparallel.com/static/images/signatures/sello-tiko.png",
        date,
      });
    } else if (["zas25KHxAByKWUgG8U2", "zas25KHxAByKWUhxeC6"].includes(templateId)) {
      signers.push({
        fullName: "Marta Blanco Maseda",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/marta-blanco-maseda-imasd.png",
        date,
      });
    } else if (
      [
        "zas25KHxAByKWmEFbpV",
        "zas25KHxAByKWmEFbpU",
        "zas25KHxAByKWmEFbpT",
        "zas25KHxAByKWmM6rrm",
      ].includes(templateId)
    ) {
      signers.push({
        fullName: "Carlos Guerrero Martín",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/carlos-guerrero-martin-debify.png",
        date,
      });
    } else if (
      [
        "zas25KHxAByKWmFx9gf",
        "zas25KHxAByKWmHefVF",
        "zas25KHxAByKWmHefVH",
        "zas25KHxAByKWmHefVK",
        "zas25KHxAByKWmHefZj",
        "zas25KHxAByKWmHefZm",
        "zas25KHxAByKWmHguoJ",
        "zas25KHxAByKWmHgusw",
        "zas25KHxAByKWmHguxV",
        "zas25KHxAByKX3mJq5E",
        "zas25KHxAByKX3usjzq",
        "zas25KHxAByKXKL5aMA",
        "zas25KHxAByKXKJPAzn",
        "zas25KHxAByKXBVeaGh",
        "6Y8DSH92uxPaJ4BA9cFya",
        "6Y8DSH92uxPaJ4BA7srgb",
        "6Y8DSH92uxPaJ4BA2oVXZ",
      ].includes(templateId)
    ) {
      signers.push({
        fullName: "Jorge Arturo Cáceres Quezada",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/jorge-arturo-caceres-rive.png",
        date,
      });
    } else if (
      ["zas25KHxAByKWmKNDXb", "zas25KHxAByKWmKRZgb", "zas25KHxAByKX3mKDNQ"].includes(templateId)
    ) {
      signers.push({
        fullName: "Dña Ana Ortiz Canela",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/ana-ortiz-canela-gesdocument.png",
        date,
      });
    } else if (["zas25KHxAByKWu4g76M"].includes(templateId)) {
      signers.push({
        fullName: "Fernando López Clemente",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/fernando-lopez-clemente-anticipa.png",
        date,
      });
    } else if (["zas25KHxAByKXKJNo2z"].includes(templateId)) {
      signers.push(
        {
          fullName: "D. Álvaro Gámez Serracarbassa",
          signatureImageUrl:
            "https://static.onparallel.com/static/images/signatures/alvaro-gamez-serracarbassa-broseta.png",
          date,
        },
        {
          fullName: "D. Claudio Aguiló Casanova",
          signatureImageUrl:
            "https://static.onparallel.com/static/images/signatures/claudio-aguilo-casanova-broseta.png",
          date,
        },
      );
    } else if (
      [
        "zas25KHxAByKXKRCYU4",
        "zas25KHxAByKXKUbz48",
        "6Y8DSH92uxPaJ4B9sFhHo",
        "6Y8DSH92uxPaJ4B9sFhSu",
      ].includes(templateId)
    ) {
      signers.push({
        fullName: "Juan Francisco Sahuquillo Cebrián",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/juan-francisco-sahuquillo-cebrian-tiko.png",
        date,
      });
    } else if (["zas25KHxAByKXaxCQoK"].includes(templateId)) {
      signers.push({
        fullName: "Manuel Holstein",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/manuel-holstein-tiko.png",
        date,
      });
    } else if (["zas25KHxAByKX3yGfeP", "zas25KHxAByKXBXLcU6"].includes(templateId)) {
      signers.push({
        fullName: "Miguel Acosta",
        signatureImageUrl:
          "https://static.onparallel.com/static/images/signatures/miguel-acosta-aliseda.png",
        date,
      });
    }
  }

  signers.push(
    ...signatureConfig.signers!.map((signer, i) => ({
      wordAnchor: `3cb39pzCQA9wJ${i}`,
      fullName: signer!.fullName,
      date,
    })),
  );

  const legalText = theme.legalText[intl.locale as ContactLocale];
  return (
    <View
      style={{ paddingTop: "4mm", display: "flex", flexDirection: "column", gap: "5mm" }}
      wrap={false}
    >
      {isDefined(legalText) && !isEmptyRTEValue(legalText) ? (
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
