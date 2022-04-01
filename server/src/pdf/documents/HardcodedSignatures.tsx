import { Image, Text, View } from "@react-pdf/renderer";
import { useMemo } from "react";
import { PetitionExportTheme } from "./PetitionExport";

type HardcodedSigner = {
  name?: string;
  imgSrc: string;
};
export function HardcodedSignatures({
  fromTemplateId,
  theme,
}: {
  fromTemplateId: string;
  theme: PetitionExportTheme;
}) {
  const signaturesByTemplateId: Record<string, HardcodedSigner[] | undefined> = useMemo(() => {
    const guillermo: HardcodedSigner = {
      name: "Guillermo Preckler",
      imgSrc: "static/images/signatures/guillermo-preckler-brickbro.png",
    };
    const selloTiko: HardcodedSigner = {
      imgSrc: "static/images/signatures/sello-tiko.png",
    };
    switch (process.env.NEXT_PUBLIC_ENVIRONMENT) {
      case "production":
        return {
          EAwW2jXkP4C9LjU2b3: [guillermo],
          EAwW2jXkP4C9LjU2fS: [guillermo],
          EAwW2jXkP4C9LbfNRp: [selloTiko],
        };
      case "staging":
        return {};
      default:
        return {};
    }
  }, []);

  return (signaturesByTemplateId[fromTemplateId] ?? []).length > 0 ? (
    <View
      style={{
        marginBottom: "4mm",
      }}
    >
      {(signaturesByTemplateId[fromTemplateId] ?? []).map((signer, index) => (
        <View key={index}>
          <Image
            style={{
              height: "35mm",
            }}
            src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/${signer.imgSrc}`}
          />
          {signer.name ? (
            <Text
              style={{
                textAlign: "center",
              }}
            >
              {signer.name}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  ) : null;
}
