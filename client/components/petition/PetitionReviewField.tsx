/** @jsx jsx */
import {
  Box,
  BoxProps,
  Button,
  Checkbox,
  Flex,
  PseudoBox,
  PseudoBoxProps,
  Stack,
  Text
} from "@chakra-ui/core";
import { css, jsx } from "@emotion/core";
import { Card } from "@parallel/components/common/Card";
import { PetitionFieldTypeIndicator } from "@parallel/components/petition/PetitionFieldTypeIndicator";
import { PetitionReviewField_PetitionFieldFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { UnwrapArray } from "@parallel/utils/types";
import { gql } from "apollo-boost";
import { MouseEvent } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { CopyToClipboardButton } from "../common/CopyToClipboardButton";
import { DateTime } from "../common/DateTime";
import { FileSize } from "../common/FileSize";
import { IconButtonWithTooltip } from "../common/IconButtonWithTooltip";
import { Spacer } from "../common/Spacer";

export type PetitionReviewFieldProps = BoxProps & {
  field: PetitionReviewField_PetitionFieldFragment;
  index: number;
  selected: boolean;
  onToggle: (event: MouseEvent) => void;
  onValidateToggle: () => void;
};

export function PetitionReviewField({
  field,
  index,
  selected,
  onToggle,
  onValidateToggle,
  ...props
}: PetitionReviewFieldProps) {
  const intl = useIntl();
  const labels = {
    filesize: intl.formatMessage({
      id: "petition.petition-field.reply-file-size",
      defaultMessage: "File size"
    }),
    filename: intl.formatMessage({
      id: "petition.petition-field.reply-file-name",
      defaultMessage: "File name"
    }),
    download: intl.formatMessage({
      id: "petition.petition-field.reply-file-download",
      defaultMessage: "Download file"
    })
  };
  return (
    <Card
      display="flex"
      position="relative"
      backgroundColor={selected ? "purple.50" : "white"}
      {...props}
    >
      <Flex alignItems="center" marginLeft={4}>
        <Checkbox
          variantColor="purple"
          isChecked={selected}
          isReadOnly
          onClick={onToggle}
        />
      </Flex>
      <Flex flex="1" flexDirection="column" padding={4}>
        <Flex alignItems="center">
          <PetitionFieldTypeIndicator
            type={field.type}
            index={index}
            as="div"
          />
          <Text marginLeft={4}>{field.title}</Text>
          <Spacer />
          <Box>
            <Button
              size="sm"
              leftIcon="check"
              variantColor={field.validated ? "green" : "gray"}
              onClick={onValidateToggle}
            >
              {field.validated ? (
                <FormattedMessage
                  id="petition.petition-field.validated-button"
                  defaultMessage="Approved"
                ></FormattedMessage>
              ) : (
                <FormattedMessage
                  id="petition.petition-field.validate-button"
                  defaultMessage="Approve"
                ></FormattedMessage>
              )}
            </Button>
          </Box>
        </Flex>
        {field.replies.length ? (
          <>
            <Box marginBottom={2}>
              <Text color="gray.400" fontSize="sm">
                <FormattedMessage
                  id="petition.petition-field.replies-label"
                  defaultMessage="{replies, plural, =1 {There is one reply to this field.} other {There are # replies to this field.}}"
                  values={{ replies: field.replies.length }}
                />
              </Text>
            </Box>
            {field.type === "TEXT" ? (
              <Stack spacing={4}>
                {field.replies.map(reply => (
                  <PetitionReviewFieldReply
                    key={reply.id}
                    reply={reply}
                    css={css`
                      .copy-to-clipboard {
                        display: none;
                      }
                      &:hover .copy-to-clipboard {
                        display: inline-flex;
                      }
                    `}
                  >
                    <Text>{reply.content.text}</Text>
                    <CopyToClipboardButton
                      className="copy-to-clipboard"
                      placement="left"
                      position="absolute"
                      right={6}
                      top="0"
                      size="sm"
                      text={reply.content.text}
                    />
                  </PetitionReviewFieldReply>
                ))}
              </Stack>
            ) : field.type === "FILE_UPLOAD" ? (
              <Stack spacing={4}>
                {field.replies.map(reply => (
                  <PetitionReviewFieldReply key={reply.id} reply={reply}>
                    <Box display="inling-flex">
                      <Text as="span" aria-label={labels.filename}>
                        {reply.content.filename}
                      </Text>
                      <Text marginX={2}>-</Text>
                      <Text
                        as="span"
                        aria-label={labels.filesize}
                        fontSize="sm"
                        color="gray.400"
                      >
                        <FileSize value={reply.content.size} />
                      </Text>
                      <IconButtonWithTooltip
                        marginLeft={2}
                        marginBottom={1}
                        size="xs"
                        icon="download"
                        placement="right"
                        label={labels.download}
                      ></IconButtonWithTooltip>
                    </Box>
                  </PetitionReviewFieldReply>
                ))}
              </Stack>
            ) : null}
          </>
        ) : (
          <Box paddingY={4}>
            <Text color="gray.400" fontStyle="italic" textAlign="center">
              <FormattedMessage
                id="petition.petition-field.no-replies"
                defaultMessage="There are no replies to this field yet"
              />
            </Text>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

function PetitionReviewFieldReply({
  children,
  reply,
  ...props
}: {
  reply: UnwrapArray<PetitionReviewField_PetitionFieldFragment["replies"]>;
} & PseudoBoxProps) {
  return (
    <PseudoBox
      marginLeft={4}
      paddingLeft={4}
      paddingRight={16}
      borderLeft="2px solid"
      borderColor="gray.200"
      _hover={{
        borderColor: "gray.300"
      }}
      position="relative"
      {...props}
    >
      {children}
      <Box fontSize="sm">
        {/* <Text as="span">
          {reply.sendout?.contact?.fullName || reply.sendout?.contact?.email}
        </Text>
        <Text as="span" marginX={1}>
          -
        </Text> */}
        <DateTime
          as="span"
          color="gray.400"
          value={reply.createdAt}
          format={FORMATS.LLL}
        />
      </Box>
    </PseudoBox>
  );
}

PetitionReviewField.fragments = {
  petitionField: gql`
    fragment PetitionReviewField_PetitionField on PetitionField {
      id
      type
      title
      validated
      replies {
        id
        content
        createdAt
        sendout {
          contact {
            id
            fullName
            email
          }
        }
      }
    }
  `
};
