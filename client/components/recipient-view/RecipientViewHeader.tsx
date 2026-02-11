import { gql } from "@apollo/client";
import {
  Box,
  HStack,
  Img,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";
import { Popover } from "@parallel/chakra/components";
import { CloudOkIcon, DownloadIcon, HelpOutlineIcon, UserArrowIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { Logo } from "@parallel/components/common/Logo";
import { Button, Text } from "@parallel/components/ui";
import { RecipientViewHeader_PublicPetitionAccessFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { usePublicPrintPdfTask } from "@parallel/utils/tasks/usePublicPrintPdfTask";
import { useLocalStorage } from "@parallel/utils/useLocalStorage";
import { useEffect, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { SmallPopover } from "../common/SmallPopover";
import { useTone } from "../common/ToneProvider";
import { useLastSaved } from "./LastSavedProvider";
import { RecipientViewMenuButton } from "./RecipientViewMenuButton";
import { useRecipientViewHelpDialog } from "./dialogs/RecipientViewHelpDialog";
import { useDelegateAccess } from "./hooks/useDelegateAccess";

interface RecipientViewHeaderProps {
  access: RecipientViewHeader_PublicPetitionAccessFragment;
  hasSignature: boolean;
  pendingPetitions: number;
  keycode: string;
  isClosed: boolean;
  onFinalize: () => void;
  canFinalize: boolean;
}

export const RecipientViewHeader = chakraComponent<"section", RecipientViewHeaderProps>(
  function RecipientViewHeader({
    ref,
    access,
    hasSignature,
    pendingPetitions,
    keycode,
    isClosed,
    onFinalize,
    canFinalize,
    ...props
  }) {
    const intl = useIntl();
    const tone = useTone();

    const contact = access.contact!;
    const hasClientPortalAccess = access.hasClientPortalAccess;
    const organization = access.petition.organization;
    const [poppoverClosed, setPoppoverClosed] = useState(true);
    const [isFirstTime, setIsFirstTime] = useLocalStorage("recipient-first-time-check", "");
    const showRecipientViewHelpDialog = useRecipientViewHelpDialog();

    useEffect(() => {
      setPoppoverClosed(false);
    }, []);

    function showHelpModal() {
      showRecipientViewHelpDialog.ignoringDialogErrors({ tone }).then();
    }

    useEffect(() => {
      if (isFirstTime !== "check") {
        setIsFirstTime("check");
        showHelpModal();
      }
    }, []);

    const { lastSaved } = useLastSaved();

    const delegateAccess = useDelegateAccess();
    const handleDelegateAccess = () => {
      delegateAccess({
        keycode,
        contactName: contact?.fullName ?? "",
        organizationName: organization?.name ?? "",
      });
    };

    const publicPrintPdfTask = usePublicPrintPdfTask();

    return (
      <HStack
        ref={ref as any}
        paddingY={2}
        paddingX={4}
        justifyContent="space-between"
        zIndex={3}
        backgroundColor="white"
        {...props}
      >
        <HStack spacing={3}>
          {organization.logoUrl72 ? (
            <Img
              src={organization.logoUrl72}
              aria-label={organization.name}
              width="auto"
              height="36px"
            />
          ) : (
            <Logo width="152px" height="36px" />
          )}

          {lastSaved ? (
            <SmallPopover
              content={
                <Box fontSize="sm">
                  <Text mb={2}>
                    <FormattedMessage
                      id="component.recipient-view-hearder.last-saved-info"
                      defaultMessage="Your answers are automatically saved."
                    />
                  </Text>
                  <Text>
                    <FormattedMessage
                      id="component.recipient-view-header.last-saved-info-date"
                      defaultMessage="<b>Last saved:</b> {date}"
                      values={{ date: intl.formatDate(lastSaved, FORMATS.LLL) }}
                    />
                  </Text>
                </Box>
              }
              placement="bottom"
              width="320px"
            >
              <HStack>
                <CloudOkIcon fontSize="18px" color="green.600" role="presentation" />
                <Text fontStyle="italic" color="green.600" display={{ base: "none", md: "block" }}>
                  <FormattedMessage
                    id="component.recipient-view-header.last-saved-time"
                    defaultMessage="Last saved {time}"
                    values={{ time: intl.formatDate(lastSaved, FORMATS.LT) }}
                  />
                </Text>
                <Text
                  fontStyle="italic"
                  color="green.600"
                  display={{ base: "none", sm: "block", md: "none" }}
                >
                  <FormattedMessage
                    id="component.recipient-view-header.last-saved-time-short"
                    defaultMessage="Saved {time}"
                    values={{ time: intl.formatDate(lastSaved, FORMATS.LT) }}
                  />
                </Text>
              </HStack>
            </SmallPopover>
          ) : null}
        </HStack>

        <HStack>
          <Popover
            returnFocusOnClose={false}
            isOpen={canFinalize && !isClosed && !poppoverClosed}
            placement="top-end"
            closeOnBlur={false}
            onClose={() => setPoppoverClosed(true)}
            autoFocus={false}
          >
            <PopoverTrigger>
              <Button
                data-testid="recipient-view-finalize-button"
                data-action="finalize"
                colorPalette="primary"
                onClick={onFinalize}
                disabled={isClosed}
              >
                {canFinalize ? (
                  hasSignature ? (
                    <FormattedMessage
                      id="generic.finalize-and-sign-button"
                      defaultMessage="Finalize and sign"
                    />
                  ) : (
                    <FormattedMessage id="generic.finalize-button" defaultMessage="Finalize" />
                  )
                ) : (
                  <FormattedMessage id="generic.next-button" defaultMessage="Next" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent backgroundColor="blue.500" color="white" marginEnd={4}>
              <PopoverArrow backgroundColor="blue.500" />
              <PopoverCloseButton />
              <PopoverBody paddingEnd={10}>
                <FormattedMessage
                  id="component.recipient-view-progress-bar.reminder-submit"
                  defaultMessage="Remember to click Finalize when you finish entering all the information."
                  values={{ tone }}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <HStack display={{ base: "none", md: "flex" }} spacing={0} gap={2}>
            <Button
              leftIcon={<UserArrowIcon />}
              colorPalette="primary"
              variant="outline"
              onClick={handleDelegateAccess}
            >
              <FormattedMessage id="generic.share" defaultMessage="Share" />
            </Button>
            <IconButtonWithTooltip
              onClick={() => publicPrintPdfTask(keycode)}
              icon={<DownloadIcon boxSize={6} />}
              label={intl.formatMessage({
                id: "generic.recipient-view-export-to-pdf",
                defaultMessage: "Export to PDF",
              })}
              variant="outline"
            />

            {hasClientPortalAccess ? null : (
              <IconButtonWithTooltip
                onClick={showHelpModal}
                icon={<HelpOutlineIcon boxSize={6} />}
                label={intl.formatMessage({
                  id: "generic.recipient-view-guide-me",
                  defaultMessage: "Guide me",
                })}
                variant="ghost"
              />
            )}
          </HStack>

          <Box display={{ base: "none", md: "flex" }}>
            <RecipientViewMenuButton
              keycode={keycode}
              contact={contact}
              hasClientPortalAccess={hasClientPortalAccess}
              pendingPetitions={pendingPetitions}
            />
          </Box>
        </HStack>
      </HStack>
    );
  },
);

const _fragments = {
  PublicContact: gql`
    fragment RecipientViewHeader_PublicContact on PublicContact {
      id
      fullName
      firstName
      email
      initials
      ...RecipientViewMenuButton_PublicContact
    }
  `,
  PublicPetition: gql`
    fragment RecipientViewHeader_PublicPetition on PublicPetition {
      id
      organization {
        name
        logoUrl72: logoUrl(options: { resize: { height: 72 } })
      }
    }
  `,
  PublicPetitionAccess: gql`
    fragment RecipientViewHeader_PublicPetitionAccess on PublicPetitionAccess {
      hasClientPortalAccess
      petition {
        ...RecipientViewHeader_PublicPetition
      }
      contact {
        ...RecipientViewHeader_PublicContact
      }
    }
  `,
};
