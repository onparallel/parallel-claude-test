import { gql } from "@apollo/client";
import { Text, TextProps, Tooltip } from "@chakra-ui/react";
import { Maybe, SignerReference_PetitionSignerFragment } from "@parallel/graphql/__types";
import { DeletedContact } from "./DeletedContact";

export function SignerReference({
  signer,
  isFull,
  ...props
}: {
  signer?: Maybe<SignerReference_PetitionSignerFragment>;
  isFull?: boolean;
} & TextProps) {
  return signer ? (
    <Tooltip isDisabled={!signer.fullName && !isFull} label={signer.email}>
      <Text as="span" color="purple.600" {...props}>
        {signer.fullName || signer.email}
        {isFull && signer.fullName ? `<${signer.email}>` : null}
      </Text>
    </Tooltip>
  ) : (
    <DeletedContact />
  );
}

SignerReference.fragments = {
  PetitionSigner: gql`
    fragment SignerReference_PetitionSigner on PetitionSigner {
      email
      fullName
    }
  `,
};
