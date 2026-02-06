import { gql } from "@apollo/client";
import { TextProps } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { Text } from "@parallel/components/ui";
import { SignerReference_PetitionSignerFragment } from "@parallel/graphql/__types";
import { Maybe } from "@parallel/utils/types";
import { DeletedContact } from "./DeletedContact";

export function SignerReference({
  signer,
  isFull,
  ...props
}: { signer?: Maybe<SignerReference_PetitionSignerFragment>; isFull?: boolean } & TextProps) {
  return signer ? (
    <Tooltip isDisabled={!signer.fullName && !isFull} label={signer.email}>
      <Text as="span" color="primary.600" {...props}>
        {signer.fullName || signer.email}
        {isFull && signer.fullName ? `<${signer.email}>` : null}
      </Text>
    </Tooltip>
  ) : (
    <DeletedContact />
  );
}

const _fragments = {
  PetitionSigner: gql`
    fragment SignerReference_PetitionSigner on PetitionSigner {
      ...Fragments_FullPetitionSigner
    }
  `,
};
