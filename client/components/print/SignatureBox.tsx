import { Box } from "@chakra-ui/core";
import { ExtendChakra } from "@parallel/chakra/utils";
import { Maybe } from "@parallel/utils/types";
import { Ref } from "react";
import { Card } from "../common/Card";

type SignatureBoxProps = ExtendChakra<{
  top?: string;
  left?: string;
  bottom?: string;
  right?: string;
  signer: { email: string; fullName?: Maybe<string> };
}>;

export function SignatureBox(
  { top, left, bottom, right, signer }: SignatureBoxProps,
  ref?: Ref<HTMLDivElement>
) {
  const date = new Date();
  const [day, month, year] = [
    date.getDate().toString().padStart(2, "0"),
    date.getMonth().toString().padStart(2, "0"),
    date.getFullYear().toString(),
  ];

  return (
    <Box>
      <Card
        ref={ref}
        boxShadow="none"
        sx={{
          height: "35mm",
          width: "60mm",
          borderColor: "gray.400",
          textAlign: "center",
          borderRadius: "md",
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          pageBreakInside: "avoid",
        }}
        style={{ top, left, bottom, right }}
      >
        {signer.fullName}
        <br />
        {day}/{month}/{year}
      </Card>
    </Box>
  );
}
