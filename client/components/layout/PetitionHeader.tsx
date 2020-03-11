import {
  Box,
  BoxProps,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Icon,
  IconButton,
  PseudoBox,
  PseudoBoxProps,
  Spinner,
  Stack,
  Tooltip
} from "@chakra-ui/core";
import {
  PetitionHeader_PetitionFragment,
  UpdatePetitionInput
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { forwardRef, ReactNode, Ref, useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { NakedLink } from "../common/Link";
import { Spacer } from "../common/Spacer";
import { PetitionStatusText } from "../common/PetitionStatusText";

export type PetitionHeaderProps = BoxProps & {
  petition: PetitionHeader_PetitionFragment;
  onUpdatePetition: (value: UpdatePetitionInput) => void;
  section: "compose" | "send" | "review";
  state: "SAVED" | "SAVING" | "ERROR";
};

export function PetitionHeader({
  state,
  petition,
  onUpdatePetition,
  section: current,
  ...props
}: PetitionHeaderProps) {
  const intl = useIntl();
  const [name, setName] = useState(petition.name ?? "");

  const lastSavedTooltip = intl.formatMessage(
    {
      id: "petition.header.last-saved-on",
      defaultMessage: "Last saved on: {date}"
    },
    {
      date: intl.formatDate(petition.updatedAt, FORMATS.FULL)
    }
  );

  const tabs = useMemo(
    () => [
      {
        section: "compose",
        text: intl.formatMessage({
          id: "petition.header.compose-tab",
          defaultMessage: "Compose"
        })
      },
      {
        section: "send",
        text: intl.formatMessage({
          id: "petition.header.send-tab",
          defaultMessage: "Send"
        })
      },
      {
        section: "review",
        text: intl.formatMessage({
          id: "petition.header.review-tab",
          defaultMessage: "Review"
        })
      }
    ],
    []
  );

  function handleOnSubmit() {
    onUpdatePetition({ name: name || null });
  }
  return (
    <Flex
      backgroundColor="white"
      borderBottom="2px solid"
      borderBottomColor="gray.200"
      zIndex={1}
      position="relative"
      height={{ base: 24, md: 16 }}
      {...props}
    >
      <Flex height={16} padding={4} alignItems="center">
        <Editable
          value={name}
          onChange={setName}
          fontSize="xl"
          onSubmit={handleOnSubmit}
          placeholder={intl.formatMessage({
            id: "generic.untitled-petition",
            defaultMessage: "Untitled petition"
          })}
          aria-label={intl.formatMessage({
            id: "petition.name-label",
            defaultMessage: "Petition name"
          })}
        >
          {({
            isEditing,
            onRequestEdit
          }: {
            isEditing: boolean;
            onRequestEdit: () => void;
          }) => (
            <>
              <Box display="inline-block" padding={1}>
                <EditablePreview paddingY={1} paddingX={2} />
                <EditableInput paddingY={1} paddingX={2} />
              </Box>
              {!isEditing && (
                <IconButton
                  variant="ghost"
                  icon={"pencil" as any}
                  onClick={() => onRequestEdit()}
                  aria-label={intl.formatMessage({
                    id: "generic.edit-label",
                    defaultMessage: "Edit"
                  })}
                ></IconButton>
              )}
            </>
          )}
        </Editable>
      </Flex>
      <Spacer />
      <Flex height={16} padding={4} alignItems="center">
        {state === "SAVING" ? (
          <Box color="gray.500">
            <Spinner
              size="sm"
              marginRight={2}
              position="relative"
              speed="0.8s"
              bottom="-1px"
            />
            <FormattedMessage
              id="petition.status.saving"
              defaultMessage="Saving..."
            />
          </Box>
        ) : state === "SAVED" ? (
          <Tooltip
            zIndex={1000}
            showDelay={300}
            aria-label={lastSavedTooltip}
            label={lastSavedTooltip}
          >
            <PetitionStatusText status={petition.status} />
          </Tooltip>
        ) : state === "ERROR" ? (
          <Box color="red.500">
            <Icon
              name="warning"
              size="16px"
              marginRight={2}
              position="relative"
              bottom="3px"
            />
            <FormattedMessage
              id="petition.status.error"
              defaultMessage="Error"
            />
          </Box>
        ) : null}
      </Flex>
      <Flex
        position="absolute"
        bottom="0"
        left="50%"
        transform="translateX(-50%)"
        direction="row"
        marginBottom="-2px"
      >
        {tabs.map(({ section, text }) => (
          <Box key={section}>
            <NakedLink
              href={`/app/petitions/[petitionId]/${section}`}
              as={`/app/petitions/${petition.id}/${section}`}
            >
              <PetitionHeaderTab active={section === current}>
                {text}
              </PetitionHeaderTab>
            </NakedLink>
          </Box>
        ))}
      </Flex>
    </Flex>
  );
}

type PetitionHeaderTabProps = PseudoBoxProps & {
  active?: boolean;
  children: ReactNode;
};

const PetitionHeaderTab = forwardRef(function(
  { active, children, ...props }: PetitionHeaderTabProps,
  ref: Ref<any>
) {
  return (
    <PseudoBox
      as="a"
      ref={ref}
      display="block"
      paddingY={3}
      paddingX={4}
      fontSize="sm"
      textTransform="uppercase"
      borderBottom="2px solid"
      borderBottomColor={active ? "purple.500" : "transparent"}
      fontWeight="bold"
      cursor="pointer"
      color={active ? "gray.900" : "gray.500"}
      _hover={{
        color: "purple.700"
      }}
      {...(active ? { "aria-current": "page" } : {})}
      {...props}
    >
      {children}
    </PseudoBox>
  );
});

PetitionHeader.fragments = {
  petition: gql`
    fragment PetitionHeader_Petition on Petition {
      id
      name
      status
      updatedAt
    }
  `
};
