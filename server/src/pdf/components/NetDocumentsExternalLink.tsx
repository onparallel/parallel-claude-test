import { G, Link, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { FormattedMessage } from "react-intl";
import { Style } from "@react-pdf/types";
import { mergeStyles } from "../utils/styles";

interface NetDocumentsExternalLinkProps {
  externalId: string;
  style?: Style | Style[];
  variant?: "text" | "button";
}
export function NetDocumentsExternalLink({
  externalId,
  variant,
  style,
}: NetDocumentsExternalLinkProps) {
  const styles = StyleSheet.create({
    link: { textDecoration: "none", fontWeight: "normal", fontSize: "12px" },
  });
  return (
    <Link
      src={`https://eu.netdocuments.com/neWeb2/goid.aspx?id=${externalId}`}
      style={mergeStyles(styles.link, style)}
    >
      {variant === "button" ? (
        <NetDocumentsIcon />
      ) : (
        <View style={{ display: "flex", flexDirection: "row" }}>
          <Text>
            <FormattedMessage
              id="document.petition-export.view-replies-in-nd"
              defaultMessage="See answers in ND"
            />
          </Text>
          <ExternalLinkIcon />
        </View>
      )}
    </Link>
  );
}

function ExternalLinkIcon() {
  return (
    <Svg viewBox="0 0 16 17" style={{ marginLeft: "4px", width: "12px", height: "12px" }}>
      <G fill="none" strokeWidth="2" strokeLineCap="round" stroke="#0000EE">
        <Path d="M12 9.16667V13.1667C12 13.5203 11.8595 13.8594 11.6095 14.1095C11.3594 14.3595 11.0203 14.5 10.6667 14.5H3.33333C2.97971 14.5 2.64057 14.3595 2.39052 14.1095C2.14048 13.8594 2 13.5203 2 13.1667V5.83333C2 5.47971 2.14048 5.14057 2.39052 4.89052C2.64057 4.64048 2.97971 4.5 3.33333 4.5H7.33333" />
        <Path d="M10 2.5H14V6.5" />
        <Path d="M6.66669 9.83333L14 2.5" />
      </G>
    </Svg>
  );
}

function NetDocumentsIcon() {
  return (
    <View>
      <Svg
        viewBox="-6 -6 36 36"
        style={{
          height: "20px",
          width: "20px",
          border: "1px solid #CBD5E0",
          borderRadius: "1mm",
        }}
      >
        <G>
          <Path
            d="m 23,19.863877 h -2.768958 v -1.68299 c -0.459797,0.654771 -1.002093,1.141793 -1.628127,1.461891 -0.625759,0.320236 -1.257017,0.480422 -1.893501,0.480422 -1.294004,0 -2.40211,-0.530884 -3.325279,-1.591553 -0.922619,-1.060668 -1.384066,-2.541396 -1.384066,-4.440397 0,-1.941763 0.448797,-3.418462 1.347216,-4.4292184 0.897595,-1.0100549 2.032788,-1.5157905 3.404617,-1.5157905 1.258804,0 2.348072,0.5323967 3.267392,1.5968325 V 4.0463192 H 23 Z m -7.955838,-5.977501 c 0,1.222918 0.166374,2.107862 0.498572,2.654284 0.481247,0.791032 1.152518,1.186342 2.015463,1.186342 0.685845,0 1.269392,-0.296173 1.750364,-0.889756 0.480559,-0.593447 0.721045,-1.479766 0.721045,-2.659646 0,-1.316142 -0.233336,-2.263937 -0.700008,-2.842946 -0.466672,-0.578844 -1.064518,-0.868747 -1.792439,-0.868747 -0.707295,0 -1.299504,0.285943 -1.777039,0.857719 -0.477122,0.571832 -0.715958,1.426458 -0.715958,2.56275 z"
            fill="#80afdd"
          />
          <Path
            d="M 11.153789,19.953664 H 8.2061375 v -5.911913 c 0,-1.250968 -0.062865,-2.059903 -0.1886489,-2.426957 C 7.8917594,11.247259 7.6873257,10.962072 7.40383,10.75823 7.1208567,10.555144 6.7795289,10.452748 6.3811801,10.452748 c -0.510383,0 -0.9687914,0.145625 -1.3742076,0.436477 -0.4056088,0.291086 -0.6834808,0.676372 -0.8337123,1.156217 -0.1504103,0.47983 -0.2257186,1.36725 -0.2257186,2.661667 v 5.246692 H 1 V 8.3697735 L 3.8412822,8.2595954 V 9.2764703 C 4.3453403,8.768026 5.5226905,8.1076588 7.4089174,8.1076588 c 0.6085712,0 1.2447935,0.1219755 1.7837214,0.3656928 0.5381716,0.2433184 0.9455132,0.5546302 1.2217072,0.9327254 0.276538,0.3782601 0.468336,0.806845 0.577167,1.286621 0.108115,0.480422 0.162207,1.167285 0.162207,2.061923 z"
            fill="#0e1139"
          />
        </G>
      </Svg>
    </View>
  );
}
