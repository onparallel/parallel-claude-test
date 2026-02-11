import { gql } from "@apollo/client";
import { Editable, EditableInput, EditablePreview, Flex, UseEditableProps } from "@chakra-ui/react";
import { Tooltip } from "@parallel/chakra/components";
import { CloudErrorIcon, CloudOkIcon, CloudUploadIcon } from "@parallel/chakra/icons";
import { chakraComponent } from "@parallel/chakra/utils";
import { Text } from "@parallel/components/ui";
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

export const HeaderNameEditable = chakraComponent<
  "div",
  HeaderNameEditableProps,
  HeaderNameEditableInstance
>(function HeaderNameEditable({ ref, petition, state, onNameChange, ...props }) {
  const intl = useIntl();
  const petitionName = petition.name ?? "";
  const [name, setName] = useState(petitionName);

  const isPublic = petition.__typename === "PetitionTemplate" && petition.isPublic;

  const myEffectivePermission = petition.myEffectivePermission!.permissionType;

  const previewRef = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => previewRef.current?.focus() }), []);

  const isReadOnly =
    props.isDisabled ||
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
        if (trimmed !== petitionName) {
          onNameChange(trimmed);
        }
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
                lineClamp={1}
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
                        id: "component.header-name-editable.last-saved-on",
                        defaultMessage: "Last saved on: {date}",
                      },
                      { date: intl.formatDate(petition.lastChangeAt, FORMATS.FULL) },
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
                      marginStart={2}
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
});

const _fragments = {
  PetitionBase: gql`
    fragment HeaderNameEditable_PetitionBase on PetitionBase {
      id
      name
      lastChangeAt
      isRestricted
      myEffectivePermission {
        permissionType
      }
      ... on PetitionTemplate {
        isPublic
      }
    }
  `,
};
