import { gql } from "@apollo/client";
import {
  getProfileNamePreview_PetitionFieldFragment,
  getProfileNamePreview_PetitionFieldReplyFragment,
  getProfileNamePreview_ProfileTypeFragment,
} from "@parallel/graphql/__types";

interface getProfileNamePreviewProps {
  profileType: getProfileNamePreview_ProfileTypeFragment;
  fieldsWithProfileTypeFields?: [
    getProfileNamePreview_PetitionFieldFragment,
    getProfileNamePreview_PetitionFieldReplyFragment[],
  ][];
}

export function getProfileNamePreview({
  profileType,
  fieldsWithProfileTypeFields,
}: getProfileNamePreviewProps) {
  let profileName = profileType.profileNamePattern as string | null;

  // Replace patterns in the profile name with the values of the corresponding answers
  fieldsWithProfileTypeFields?.forEach(([field, replies]) => {
    const reply = replies[0];

    let value = reply?.content?.value ?? "";

    if (field.type === "SELECT" && field.options?.labels && field.options?.values) {
      const index = field.options.values.indexOf(value);
      value = field.options.labels[index] || value;
    }

    const pattern = `{{ ${field.profileTypeField!.id} }}`;
    profileName = profileName!.replace(pattern, value);
  });

  // Clear any unreplaced patterns in the profile name
  const cleanProfileName = profileName!.replace(/{{\s*[\w\d]+\s*}}/g, "");

  // Set "No name" if no patterns were replaced
  if (
    profileName === profileType.profileNamePattern ||
    cleanProfileName === profileType.profileNamePattern.replace(/{{\s*[\w\d]+\s*}}/g, "")
  ) {
    profileName = null;
  } else {
    // Clear any unreplaced patterns in the profile name
    profileName = cleanProfileName;
  }

  return profileName;
}

getProfileNamePreview.fragments = {
  get ProfileType() {
    return gql`
      fragment getProfileNamePreview_ProfileType on ProfileType {
        id
        profileNamePattern
      }
    `;
  },
  get PetitionField() {
    return gql`
      fragment getProfileNamePreview_PetitionField on PetitionField {
        id
        type
        options
        profileType {
          ...getProfileNamePreview_ProfileType
        }
        profileTypeField {
          id
        }
      }
      ${this.ProfileType}
    `;
  },
  get PetitionFieldReply() {
    return gql`
      fragment getProfileNamePreview_PetitionFieldReply on PetitionFieldReply {
        id
        content
      }
    `;
  },
};
