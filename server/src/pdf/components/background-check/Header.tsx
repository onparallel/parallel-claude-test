import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

export function Header({ assetsUrl }: { assetsUrl: string }) {
  const gray200 = "#E2E8F0";

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: "6.5mm", //20px
      gap: "2.6mm", //8px
      fontFamily: "IBM Plex Sans",
    },
    logo: {
      width: "32mm", //100px
    },
    logoDivider: {
      borderLeft: `0.32mm solid ${gray200}`,
      height: "5.8mm", //18px
      width: "0mm",
    },
    backgroundCheckText: {
      fontSize: "10.5pt", //14px
      color: "#4A5568",
    },
  });

  return (
    <View style={styles.header}>
      <Image src={`${assetsUrl}/static/emails/logo.png`} style={styles.logo} />
      <View style={styles.logoDivider} />
      <Text style={styles.backgroundCheckText}>Background check</Text>
    </View>
  );
}
