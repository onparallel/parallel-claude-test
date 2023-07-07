import { gql } from "@apollo/client";
import {
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Text,
  Tooltip,
  UseEditableProps,
} from "@chakra-ui/react";
import { CloudErrorIcon, CloudOkIcon, CloudUploadIcon } from "@parallel/chakra/icons";
import { chakraForwardRef } from "@parallel/chakra/utils";
import { HeaderNameEditable_PetitionBaseFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { useImperativeHandle, useRef, useState } from "react";
import { useIntl } from "react-intl";

export interface HeaderNameEditableProps extends UseEditableProps {
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

      const isReadOnly =
        isPublic ||
        myEffectivePermission === "READ" ||
        (petition.isRestricted && petition.__typename === "PetitionTemplate");

      const placeholder =
        petition.__typename === "Petition"
          ? intl.formatMessage({
              id: "generic.unnamed-parallel",
              defaultMessage: "Unnamed parallel",
            })
          : intl.formatMessage({
              id: "generic.unnamed-template",
              defaultMessage: "Unnamed template",
            });

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
          placeholder={placeholder}
          aria-label={
            petition.__typename === "Petition"
              ? intl.formatMessage({
                  id: "generic.parallel-name",
                  defaultMessage: "Parallel name",
                })
              : intl.formatMessage({
                  id: "generic.template-name",
                  defaultMessage: "Template name",
                })
          }
          {...props}
        >
          {({ isEditing }: { isEditing: boolean }) => (
            <>
              <Flex flex="1 1 auto" minWidth={0}>
                {isReadOnly ? (
                  <Text
                    color={name ? "default" : "gray.400"}
                    paddingX={1}
                    noOfLines={1}
                    wordBreak="break-all"
                  >
                    {name || placeholder}
                  </Text>
                ) : (
                  <Flex minWidth="0" flex="1">
                    <Tooltip
                      placement="bottom"
                      label={intl.formatMessage({
                        id: "component.header-name-editable.change-name",
                        defaultMessage: "Change name",
                      })}
                      offset={[0, 4]}
                    >
                      <EditablePreview
                        ref={previewRef}
                        color={name ? undefined : "gray.400"}
                        paddingY={0}
                        paddingX={1}
                        display="block"
                        noOfLines={1}
                        wordBreak="break-all"
                        data-testid="petition-name-preview"
                      />
                    </Tooltip>
                    {!isEditing && (
                      <Tooltip
                        label={intl.formatMessage(
                          {
                            id: "petition.header.last-saved-on",
                            defaultMessage: "Last saved on: {date}",
                          },
                          { date: intl.formatDate(petition.updatedAt, FORMATS.FULL) },
                        )}
                        isDisabled={state !== "SAVED"}
                        offset={[0, 4]}
                      >
                        <Flex
                          alignItems="center"
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
                          cursor="default"
                          marginLeft={2}
                        >
                          {state === "SAVING" ? (
                            <CloudUploadIcon fontSize="sm" role="presentation" />
                          ) : state === "SAVED" ? (
                            <CloudOkIcon fontSize="sm" role="presentation" />
                          ) : state === "ERROR" ? (
                            <CloudErrorIcon fontSize="sm" role="presentation" />
                          ) : null}
                        </Flex>
                      </Tooltip>
                    )}
                    <EditableInput
                      paddingY={0}
                      paddingX={1}
                      maxLength={255}
                      data-testid="petition-name-input"
                    />
                  </Flex>
                )}
              </Flex>
            </>
          )}
        </Editable>
      );
    },
  ),
  {
    fragments: {
      PetitionBase: gql`
        fragment HeaderNameEditable_PetitionBase on PetitionBase {
          name
          updatedAt
          isRestricted
          myEffectivePermission {
            permissionType
          }
          ... on PetitionTemplate {
            isPublic
          }
        }
      `,
    },
  },
);
