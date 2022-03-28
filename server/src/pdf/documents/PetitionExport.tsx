import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { outdent } from "outdent";

// get ttf links from https://developers.google.com/fonts/docs/developer_api

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "http://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf",
    },
    {
      src: "http://fonts.gstatic.com/s/roboto/v29/KFOkCnqEu92Fr1Mu52xPKTM1K9nz.ttf",
      fontStyle: "italic",
    },
    {
      src: "http://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf",
      fontWeight: "bold",
    },
    {
      src: "http://fonts.gstatic.com/s/roboto/v29/KFOjCnqEu92Fr1Mu51TzBhc9AMX6lJBP.ttf",
      fontStyle: "italic",
      fontWeight: "bold",
    },
  ],
});

Font.registerEmojiSource({
  format: "png",
  url: "https://twemoji.maxcdn.com/2/72x72/",
});

interface PetitionExportTheme {
  marginHorizontal: number;
  marginVertical: number;
  title1FontFamily: string;
  title1Color: string;
  title1FontSize: number;
  title2FontFamily: string;
  title2Color: string;
  title2FontSize: number;
  textFontFamily: string;
  textColor: string;
  textFontSize: number;
}

interface PetitionExportProps {
  documentTitle: string;
  logoUrl: string;
  theme: PetitionExportTheme;
}

export default function PetitionExport({ documentTitle, logoUrl, theme }: PetitionExportProps) {
  const styles = StyleSheet.create({
    page: {
      paddingHorizontal: `${theme.marginHorizontal}mm`,
      paddingVertical: `${theme.marginVertical}mm`,
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: `${theme.marginHorizontal}mm`,
      height: `${theme.marginVertical}mm`,
      alignItems: "center",
      flexDirection: "row",
    },
    headerLogo: {
      width: "50mm",
      maxHeight: `${theme.marginVertical * 0.5}mm`,
      objectFit: "contain",
      objectPositionX: 0,
    },
    documentTitle: {
      fontFamily: theme.title1FontFamily,
      fontSize: theme.title1FontSize,
      color: theme.title1Color,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: "10mm",
      marginTop: "10mm",
    },
    field: {
      border: "1px solid #888888",
      borderRadius: "5px",
      padding: "5mm",
      marginBottom: "5mm",
    },
    fieldTitle: {
      fontFamily: theme.title2FontFamily,
      fontSize: theme.title2FontSize,
      color: theme.title2Color,
      marginBottom: "5mm",
    },
    fieldDescription: {
      fontFamily: theme.textFontFamily,
      fontSize: theme.textFontSize,
      color: theme.textColor,
      textAlign: "justify",
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: "10mm",
      paddingHorizontal: `${theme.marginHorizontal}mm`,
      height: `${theme.marginVertical}mm`,
    },
    footerPageNumber: {
      fontFamily: theme.textFontFamily,
      fontSize: theme.textFontSize,
      color: theme.textColor,
      textAlign: "right",
    },
  });
  return (
    <Document>
      <Page style={styles.page} wrap>
        <View fixed style={styles.header}>
          <Image src={logoUrl} style={styles.headerLogo} />
        </View>
        <View style={styles.documentTitle}>
          <Text>{documentTitle}</Text>
        </View>
        {new Array(20).fill(0).map((_, i) =>
          i % 3 === 0 ? (
            <View style={{ marginBottom: "5mm" }}>
              <Text style={styles.fieldDescription}>
                {outdent`
                  Lorem ipsum dolor sit amet consectetur adipiscing elit dictum, porta volutpat urna non venenatis ligula sapien porttitor est, leo ultrices auctor fames cras facilisis odio. Sodales nullam suscipit tincidunt convallis eget sociosqu iaculis lectus habitasse, dui ornare semper ligula porta curae netus sapien cursus, pretium augue cum leo quisque bibendum ac rutrum. Congue volutpat lectus odio aptent vehicula a quisque ultricies, imperdiet parturient potenti cras euismod facilisis urna in, commodo rutrum auctor ornare hac dictum ut.
      
                  Magna mollis est sed torquent cum congue id ridiculus, viverra dictumst diam donec pulvinar molestie cursus, duis vivamus nec leo cubilia porttitor turpis. Tortor neque nunc nisl torquent et magna aptent porttitor himenaeos, litora natoque sapien diam montes congue arcu justo ultricies sociis, pellentesque in sem lectus iaculis elementum vel auctor. Metus suscipit class consequat eget habitant lacus mi parturient ultricies senectus hac tristique fermentum vivamus, malesuada sed porttitor vitae hendrerit suspendisse quisque congue orci purus molestie sagittis.
                `}
              </Text>
            </View>
          ) : (
            <View key={i} style={styles.field} wrap={false}>
              <Text style={styles.fieldTitle}>Field title</Text>
              <Text style={styles.fieldDescription}>Field description</Text>
            </View>
          )
        )}
        <View
          fixed
          style={styles.footer}
          render={({ pageNumber }) => <Text style={styles.footerPageNumber}>{pageNumber}</Text>}
        />
      </Page>
    </Document>
  );
}
