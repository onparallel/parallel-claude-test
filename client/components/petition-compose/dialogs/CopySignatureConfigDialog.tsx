import { gql } from "@apollo/client";
import { Button, Radio, RadioGroup, Stack, Text } from "@chakra-ui/react";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import { DialogProps, useDialog } from "@parallel/components/common/dialogs/DialogProvider";
import {
  BulkSendSigningMode,
  CopySignatureConfigDialog_PetitionSignerFragment,
} from "@parallel/graphql/__types";
import { useState } from "react";
import { FormattedList, FormattedMessage } from "react-intl";

export function CopySignatureConfigDialog({
  signers,
  ...props
}: DialogProps<
  { signers: CopySignatureConfigDialog_PetitionSignerFragment[] },
  BulkSendSigningMode
>) {
  const [option, setOption] = useState<BulkSendSigningMode>();

  return (
    <ConfirmDialog
      size="xl"
      closeOnEsc={false}
      closeOnOverlayClick={false}
      header={<FormattedMessage id="generic.e-signature" defaultMessage="eSignature" />}
      body={
        <>
          <FormattedMessage
            id="component.copy-signature-config-dialog.body"
            defaultMessage="You have assigned {contacts} to sign the first parallel."
            values={{
              contacts: (
                <FormattedList
                  value={signers.map((signer, i) => [
                    <Text as="strong" key={i}>
                      {signer.fullName ?? signer.email}
                    </Text>,
                  ])}
                />
              ),
            }}
          />
          <Text>
            <FormattedMessage
              id="component.copy-signature-config-dialog.body-2"
              defaultMessage="Do you want {count, plural, =1{this contact} other{these contacts}} to sign the parallels for each of the recipient groups?"
              values={{ count: signers.length }}
            />
          </Text>
          <RadioGroup paddingTop={4} onChange={setOption as any} value={option}>
            <Stack>
              <Radio
                value="COPY_SIGNATURE_SETTINGS"
                isChecked={option === "COPY_SIGNATURE_SETTINGS"}
              >
                <FormattedMessage
                  id="component.copy-signature-config-dialog.option-1"
                  defaultMessage="Yes, allow this {count, plural, =1{contact} other{contacts}} to sign all the parallels."
                  values={{ count: signers.length }}
                />
              </Radio>
              <Radio value="LET_RECIPIENT_CHOOSE" isChecked={option === "LET_RECIPIENT_CHOOSE"}>
                <FormattedMessage
                  id="component.copy-signature-config-dialog.option-2"
                  defaultMessage="No, let each recipient choose who will sign the parallels."
                />
              </Radio>
              <Radio value="DISABLE_SIGNATURE" isChecked={option === "DISABLE_SIGNATURE"}>
                <FormattedMessage
                  id="component.copy-signature-config-dialog.option-3"
                  defaultMessage="Disable eSignature from all the parallels."
                />
              </Radio>
            </Stack>
          </RadioGroup>
        </>
      }
      confirm={
        <Button
          isDisabled={option === undefined}
          colorScheme="primary"
          onClick={() => props.onResolve(option)}
        >
          <FormattedMessage id="generic.send" defaultMessage="Send" />
        </Button>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      {...props}
    />
  );
}

CopySignatureConfigDialog.fragments = {
  PetitionSigner: gql`
    fragment CopySignatureConfigDialog_PetitionSigner on PetitionSigner {
      email
      fullName
    }
  `,
};

export function useCopySignatureConfigDialog() {
  return useDialog(CopySignatureConfigDialog);
}
