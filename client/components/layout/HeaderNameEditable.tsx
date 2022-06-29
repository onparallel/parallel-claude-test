import { gql } from "@apollo/client";
import {
  Box,
  Editable,
  EditableInput,
  EditablePreview,
  EditableProps,
  Flex,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { CloudErrorIcon, CloudOkIcon, CloudUploadIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { HeaderNameEditable_PetitionBaseFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { PetitionState } from "@parallel/utils/usePetitionState";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { omit } from "remeda";

export interface HeaderNameEditableProps extends EditableProps {
  petition: HeaderNameEditable_PetitionBaseFragment;
  onNameChange: (value: string) => void;
  state: PetitionState;
}

export const HeaderNameEditable = Object.assign(
  chakraForwardRef<"div", HeaderNameEditableProps>(function HeaderNameEditable(
    { petition, state, onNameChange, ...props },
    ref
  ) {
    const intl = useIntl();
    const router = useRouter();
    const [name, setName] = useState(petition.name ?? "");

    const isPublic = petition.__typename === "PetitionTemplate" && petition.isPublic;

    const myEffectivePermission = petition.myEffectivePermission!.permissionType;

    const editablePreviewRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
      if (router.query.new === "true") {
        setTimeout(() => editablePreviewRef.current?.focus());

        router.replace(
          {
            pathname: router.pathname,
            query: omit(router.query, ["new"]),
          },
          undefined,
          { shallow: true }
        );
      }
    }, []);

    const isReadOnly = isPublic || myEffectivePermission === "READ";

    return (
      <Editable
        ref={ref}
        display="flex"
        fontSize="xl"
        value={name}
        onChange={setName}
        onSubmit={() => {
          const trimmed = name.trim();
          setName(trimmed);
          onNameChange(trimmed);
        }}
        onBlur={() => {
          setName(name.trim());
        }}
        {...props}
      >
        {({ isEditing }: { isEditing: boolean }) => (
          <>
            <Flex flex="1 1 auto" minWidth={0} padding={1}>
              {isReadOnly ? (
                <Text color={name ? "default" : "gray.400"} paddingX={2} isTruncated>
                  {name || props.placeholder}
                </Text>
              ) : (
                <>
                  <Tooltip
                    placement="bottom"
                    label={intl.formatMessage({
                      id: "component.header-name-editable.change-name",
                      defaultMessage: "Change name",
                    })}
                    offset={[0, -1]}
                  >
                    <Box minWidth="0">
                      <EditablePreview
                        ref={editablePreviewRef}
                        color={name ? undefined : "gray.400"}
                        paddingY={1}
                        paddingX={2}
                        display="block"
                        isTruncated
                      />
                      <EditableInput
                        paddingY={1}
                        paddingX={2}
                        maxLength={255}
                        width={props.maxWidth}
                        transition="all 250ms, width 0s"
                      />
                    </Box>
                  </Tooltip>
                </>
              )}
            </Flex>
            {!isEditing && (
              <Flex alignItems="center" fontSize="sm" position="relative" top="3px">
                <Tooltip
                  label={intl.formatMessage(
                    {
                      id: "petition.header.last-saved-on",
                      defaultMessage: "Last saved on: {date}",
                    },
                    {
                      date: intl.formatDate(petition.updatedAt, FORMATS.FULL),
                    }
                  )}
                  isDisabled={state !== "SAVED"}
                  offset={[0, 6]}
                >
                  <Text
                    color={
                      state === "SAVING"
                        ? "gray.500"
                        : state === "SAVED"
                        ? "green.500"
                        : state === "ERROR"
                        ? "red.500"
                        : undefined
                    }
                    fontSize="xs"
                    fontStyle="italic"
                    display="flex"
                    alignItems="center"
                    cursor="default"
                  >
                    {state === "SAVING" ? (
                      <CloudUploadIcon fontSize="sm" />
                    ) : state === "SAVED" ? (
                      <CloudOkIcon fontSize="sm" />
                    ) : state === "ERROR" ? (
                      <CloudErrorIcon fontSize="sm" />
                    ) : null}
                    <Text
                      as="span"
                      marginLeft={1}
                      display={{
                        base: "none",
                        sm: "inline",
                        md: "none",
                        lg: "inline",
                      }}
                    >
                      {state === "SAVING" ? (
                        <FormattedMessage id="generic.saving-changes" defaultMessage="Saving..." />
                      ) : state === "SAVED" ? (
                        <FormattedMessage id="generic.changes-saved" defaultMessage="Saved" />
                      ) : state === "ERROR" ? (
                        <FormattedMessage id="petition.status.error" defaultMessage="Error" />
                      ) : null}
                    </Text>
                  </Text>
                </Tooltip>
              </Flex>
            )}
          </>
        )}
      </Editable>
    );
  }),
  {
    fragments: {
      PetitionBase: gql`
        fragment HeaderNameEditable_PetitionBase on PetitionBase {
          name
          updatedAt
          myEffectivePermission {
            permissionType
          }
          ... on PetitionTemplate {
            isPublic
          }
        }
      `,
    },
  }
);
