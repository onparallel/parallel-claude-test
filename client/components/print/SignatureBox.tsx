import { BoxProps, Text } from "@chakra-ui/react";
import { FORMATS } from "@parallel/utils/dates";
import { Maybe } from "@parallel/utils/types";
import { FormattedDate } from "react-intl";
import { Card } from "../common/Card";

interface SignatureBoxProps extends BoxProps {
  wordAnchor: string;
  signer: { email: string; fullName?: Maybe<string> };
  timezone?: string;
}

export function SignatureBox({ signer, timezone, wordAnchor }: SignatureBoxProps) {
  return (
    <Card
      boxShadow="none"
      sx={{
        height: "35mm",
        borderColor: "gray.400",
        textAlign: "center",
        borderRadius: "md",
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pageBreakInside: "avoid",
      }}
    >
      <Text color="#ffffff" position="absolute" top="0" left="0">
        {wordAnchor}
      </Text>
      {signer.fullName}
      <br />
      <FormattedDate timeZone={timezone} value={new Date()} {...FORMATS.L} />
    </Card>
  );
}
