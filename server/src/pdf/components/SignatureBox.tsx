import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Style } from "@react-pdf/types";
import { isNonNullish } from "remeda";
import { mergeStyles } from "../utils/styles";
import { useTheme } from "../utils/ThemeProvider";

export interface SignatureBoxProps {
  wordAnchor?: string;
  fullName?: string;
  signatureImageUrl?: string;
  date?: string;
  style?: Style | Style[];
}

export function SignatureBox({
  wordAnchor,
  fullName,
  signatureImageUrl,
  date,
  style,
}: SignatureBoxProps) {
  const theme = useTheme();
  const styles = StyleSheet.create({
    text: {
      fontFamily: theme.textFontFamily,
      fontSize: 12,
      color: theme.textColor,
      opacity: 0.7,
    },
    box: {
      height: "36mm",
      border: "1px solid #CBD5E0",
      textAlign: "center",
      borderRadius: "5px",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "2mm",
    },
    anchor: {
      color: "#FFFFFF",
      fontSize: 8,
      position: "absolute",
      fontFamily: "Times-Roman",
      top: 2,
      left: 0,
    },
    signatureImage: {
      flex: 1,
      objectFit: "contain",
    },
    date: {
      opacity: 0.7,
      fontSize: 12,
    },
  });
  return (
    <View style={mergeStyles(styles.box, style)}>
      {isNonNullish(wordAnchor) ? <Text style={styles.anchor}>{wordAnchor}</Text> : null}
      {isNonNullish(signatureImageUrl) ? (
        <Image style={styles.signatureImage} src={signatureImageUrl} />
      ) : null}
      {isNonNullish(fullName) ? <Text style={styles.text}>{fullName}</Text> : null}
      {isNonNullish(date) ? <Text style={[styles.text, styles.date]}>{date}</Text> : null}
    </View>
  );
}
