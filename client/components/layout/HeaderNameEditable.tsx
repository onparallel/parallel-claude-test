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
import { useImperativeHandle, useRef, useState } from "react";
import { useIntl } from "react-intl";

export interface HeaderNameEditableProps extends EditableProps {
  petition: HeaderNameEditable_PetitionBaseFragment;
  onNameChange: (value: string) => void;
  state: "SAVED" | "SAVING" | "ERROR";
}

export interface HeaderNameEditableInstance {
  focus(): void;
}

export const HeaderNameEditable = Object.assign(
  chakraForwardRef<"div", HeaderNameEditableProps, HeaderNameEditableInstance>(
    function HeaderNameEditable({ petition, state, onNameChange, ...props }, ref) {
      const intl = useIntl();
      const [name, setName] = useState(petition.name ?? "");

      const isPublic = petition.__typename === "PetitionTemplate" && petition.isPublic;

      const myEffectivePermission = petition.myEffectivePermission!.permissionType;

      const previewRef = useRef<HTMLElement>(null);
      useImperativeHandle(ref, () => ({ focus: () => previewRef.current?.focus() }), []);

      const isReadOnly = isPublic || myEffectivePermission === "READ";

      return (
        <Editable
          display="flex"
          fontSize="lg"
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
              <Flex flex="1 1 auto" minWidth={0} padding={0} minHeight="27px">
                {isReadOnly ? (
                  <Text
                    color={name ? "default" : "gray.400"}
                    paddingX={1}
                    noOfLines={1}
                    wordBreak="break-all"
                  >
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
                          ref={previewRef}
                          color={name ? undefined : "gray.400"}
                          paddingY={0}
                          paddingX={1}
                          display="block"
                          noOfLines={1}
                          wordBreak="break-all"
                        />
                        <EditableInput
                          paddingY={0}
                          paddingX={1}
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
                <Flex alignItems="center" fontSize="sm" position="relative" top="1px" left="4px">
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
                        <CloudUploadIcon fontSize="sm" role="presentation" />
                      ) : state === "SAVED" ? (
                        <CloudOkIcon fontSize="sm" role="presentation" />
                      ) : state === "ERROR" ? (
                        <CloudErrorIcon fontSize="sm" role="presentation" />
                      ) : null}
                    </Text>
                  </Tooltip>
                </Flex>
              )}
            </>
          )}
        </Editable>
      );
    }
  ),
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
