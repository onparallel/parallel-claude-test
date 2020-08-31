import {
  Heading,
  Text,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
} from "@chakra-ui/core";
import {
  DialogProps,
  useDialog,
} from "@parallel/components/common/DialogOpenerProvider";
import { FormattedMessage, useIntl } from "react-intl";
import { DateTime } from "../common/DateTime";
import { gql } from "@apollo/client";
import { useCallback } from "react";
import { PetitionComposeField } from "../petition-compose/PetitionComposeField";
import { TemplateDetailsDialog_PetitionTemplateFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { CopyIcon } from "@parallel/chakra/icons";
import { useCreatePetition } from "@parallel/utils/mutations/useCreatePetition";
import { useGoToPetition } from "@parallel/utils/goToPetition";
import { useClonePetition } from "@parallel/utils/mutations/useClonePetition";

export function useTemplateDetailsDialog() {
  const showDialog = useDialog(TemplateDetailsDialog);
  const createPetition = useCreatePetition();
  const clonePetition = useClonePetition();
  const goToPetition = useGoToPetition();
  const intl = useIntl();
  return useCallback(
    async (petition: TemplateDetailsDialog_PetitionTemplateFragment) => {
      try {
        const { action } = await showDialog({ petition });
        let petitionId;
        if (action === "create-petition") {
          petitionId = await createPetition(petition.id);
        } else {
          const petitionName = petition.name
            ? `${petition.name} (${intl.formatMessage({
                id: "petition.copy",
                defaultMessage: "copy",
              })})`
            : "";
          petitionId = await clonePetition({
            petitionId: petition.id,
            name: petitionName,
          });
        }
        goToPetition(petitionId!, "compose");
      } catch {}
    },
    []
  );
}

export function TemplateDetailsDialog({
  petition,
  ...props
}: DialogProps<
  { petition: TemplateDetailsDialog_PetitionTemplateFragment },
  { action: "create-petition" | "clone-template" }
>) {
  return (
    <Modal
      size="2xl"
      isOpen={true}
      onClose={() => props.onReject({ reason: "CLOSE" })}
      {...props}
    >
      <ModalOverlay>
        <ModalContent borderRadius="lg" padding="2">
          <ModalHeader display="flex" justifyContent="space-between">
            <TemplateDetailsHeader
              petition={petition}
              handleCreatePetition={() =>
                props.onResolve({ action: "create-petition" })
              }
              handleCloneTemplate={() => {
                props.onResolve({ action: "clone-template" });
              }}
            />
          </ModalHeader>
          <ModalBody>
            <TemplateDetailsBody petition={petition} />
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    </Modal>
  );
}

function TemplateDetailsHeader({
  petition,
  handleCreatePetition,
  handleCloneTemplate,
}: {
  petition: TemplateDetailsDialog_PetitionTemplateFragment;
  handleCreatePetition: () => void;
  handleCloneTemplate: () => void;
}) {
  const ownerName = petition.owner.fullName;
  const orgName = petition.owner.organization.name;

  return (
    <>
      <div>
        <Heading size="md">{petition.name}</Heading>
        <Text as="span" fontSize="sm" fontWeight="normal">
          {ownerName && orgName ? (
            <FormattedMessage
              id="template.details.created-by"
              defaultMessage="Created by {ownerName} @ {orgName}"
              values={{ ownerName, orgName }}
            />
          ) : null}
        </Text>
        <Text fontSize="sm" fontWeight="normal">
          {ownerName && orgName ? (
            <FormattedMessage
              id="template.details.last-updated-on"
              defaultMessage="Last updated on {date}"
              values={{
                date: (
                  <DateTime value={petition.updatedAt} format={FORMATS.LL} />
                ),
              }}
            />
          ) : null}
        </Text>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Button
          sx={{ width: "100%", justifyContent: "left" }}
          type="submit"
          colorScheme="purple"
          onClick={handleCreatePetition}
        >
          <CopyIcon marginRight="2" />
          <FormattedMessage
            id="template.details.use-template"
            defaultMessage="Use template"
          />
        </Button>
        <Button
          sx={{ width: "100%", justifyContent: "left" }}
          marginTop="2"
          type="submit"
          onClick={handleCloneTemplate}
        >
          <CopyIcon marginRight="2" />
          <FormattedMessage
            id="template.details.clone-template"
            defaultMessage="Clone template"
          />
        </Button>
      </div>
    </>
  );
}

function TemplateDetailsBody({
  petition,
}: {
  petition: TemplateDetailsDialog_PetitionTemplateFragment;
}) {
  const intl = useIntl();
  return (
    <>
      <Heading size="sm">
        <FormattedMessage
          id="template.details.about"
          defaultMessage="About this template"
        />
      </Heading>
      <Text as="span" fontSize="sm">
        {petition.description}
      </Text>
      <Divider marginBottom="4" marginTop="4" />
      <Heading size="sm" marginBottom="3">
        <FormattedMessage
          id="template.details.fields-list"
          defaultMessage="Information list"
        />
      </Heading>
      {petition.fields.map((f) => {
        return f.type === "HEADING" ? (
          <Heading margin="2" key={f.id} size="xs">
            {f.title ||
              intl.formatMessage({
                id: "generic.empty-heading",
                defaultMessage: "Untitled heading",
              })}
          </Heading>
        ) : (
          <Text as="div" marginLeft="4" fontSize="sm" key={f.id}>
            {f.title ||
              intl.formatMessage({
                id: "generic.untitled-field",
                defaultMessage: "Untitled field",
              })}
          </Text>
        );
      })}
    </>
  );
}

TemplateDetailsDialog.fragments = {
  PetitionTemplate: gql`
    fragment TemplateDetailsDialog_PetitionTemplate on PetitionTemplate {
      id
      isPublic
      description
      name
      fields {
        id
        options
        ...PetitionComposeField_PetitionField
      }
      owner {
        id
        organization {
          name
        }
        fullName
      }
      updatedAt
    }
    ${PetitionComposeField.fragments.PetitionField}
  `,
};
