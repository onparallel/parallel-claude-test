import { Box, BoxProps, Text } from "@chakra-ui/react";
import { FORMATS } from "@parallel/utils/dates";
import { Maybe } from "@parallel/utils/types";
import { FormattedDate } from "react-intl";
import { Card } from "../common/Card";

interface SignatureBoxProps extends BoxProps {
  signer: { email: string; fullName?: Maybe<string>; key: number };
  timezone?: string;
}

export function SignatureBox({ signer, timezone }: SignatureBoxProps) {
  return (
    <Box>
      <Card
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
      >
        <Text color="#ffffff" position="absolute" top="0" left="0">
          {`SIGNER_${signer.key}`}
        </Text>
        {signer.fullName}
        <br />
        <FormattedDate timeZone={timezone} value={new Date()} {...FORMATS.L} />
      </Card>
    </Box>
  );
}
