import { StyleSheet, Text, View } from "@react-pdf/renderer";

interface RiskLabelProps {
  risk: string;
}

export function RiskLabel({ risk, ...props }: RiskLabelProps) {
  const styles = StyleSheet.create({
    badge: {
      marginBottom: "0.65mm", //2px
      padding: "0.65mm 1.3mm",
      borderRadius: "1mm",
      backgroundColor:
        risk === "role.pep"
          ? "#C6F6D5" // green
          : risk === "role.rca"
            ? "#CEEDFF" // blue
            : /^san(-?|$)/.test(risk)
              ? "#FED7D7" // red
              : /^ool(-?|$)/.test(risk)
                ? "#FEEBC8" // orange
                : /^poi(-?|$)/.test(risk)
                  ? "#FEFCBF" // yellow
                  : "#EDF2F7", // default
    },
    text: {
      fontSize: "7.5pt", //10px
      fontFamily: "IBM Plex Sans",
      fontWeight: 500,
      textTransform: "uppercase",
      color:
        risk === "role.pep"
          ? "#22543D" // green
          : risk === "role.rca"
            ? "#153E75" // blue
            : /^san(-?|$)/.test(risk)
              ? "#822727" // red
              : /^ool(-?|$)/.test(risk)
                ? "#7B341E" // orange
                : /^poi(-?|$)/.test(risk)
                  ? "#744210" // yellow
                  : "#2D3748", // default
    },
  });

  const text = risk.split(".")[1] || risk;
  return (
    <View style={styles.badge} {...props}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
