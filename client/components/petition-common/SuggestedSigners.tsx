import { gql } from "@apollo/client";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import {
  SuggestedSigners_PetitionBaseFragment,
  SuggestedSigners_PetitionSignerFragment,
  SuggestedSigners_PublicContactFragment,
  SuggestedSigners_PublicPetitionFragment,
  SuggestedSigners_UserFragment,
  Tone,
} from "@parallel/graphql/__types";
import { Fragments } from "@parallel/utils/apollo/fragments";
import { useFieldLogic } from "@parallel/utils/fieldLogic/useFieldLogic";
import { ArrayUnionToUnion } from "@parallel/utils/types";
import { EMAIL_REGEX } from "@parallel/utils/validation";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish, pick, uniqueBy, zip } from "remeda";
import { useAddNewSignerDialog } from "../recipient-view/dialogs/AddNewSignerDialog";

type PetitionSelection =
  | SuggestedSigners_PublicPetitionFragment
  | SuggestedSigners_PetitionBaseFragment;

type PetitionFieldSelection = ArrayUnionToUnion<PetitionSelection["fields"]>;

type SuggestionType = Pick<
  SuggestedSigners_PetitionSignerFragment,
  "firstName" | "lastName" | "email"
> & { isMe?: boolean };

interface SuggestedSignersProps {
  petition: PetitionSelection;
  user?: SuggestedSigners_UserFragment;
  contact?: SuggestedSigners_PublicContactFragment;
  onAddSigner: (s: SuggestionType) => void;
  currentSigners: SuggestionType[];
  isDisabled?: boolean;
  tone?: Tone;
}

export function SuggestedSigners({
  petition,
  user,
  contact,
  currentSigners,
  onAddSigner,
  isDisabled,
  tone,
}: SuggestedSignersProps) {
  const intl = useIntl();
  let suggestions: SuggestionType[] = [];

  const fieldLogic = useFieldLogic(petition);

  const visibleFields = zip(petition.fields as PetitionFieldSelection[], fieldLogic)
    .filter(([_, { isVisible }]) => isVisible)
    .map(([field, { groupChildrenLogic }]) => {
      if (field.type === "FIELD_GROUP") {
        return {
          ...field,
          replies: field.replies.map((r, groupIndex) => ({
            ...r,
            children: r.children?.filter(
              (_, childReplyIndex) =>
                groupChildrenLogic?.[groupIndex][childReplyIndex].isVisible ?? false,
            ),
          })),
        };
      } else {
        return field;
      }
    });

  const groupFields = visibleFields.filter((f) => f.type === "FIELD_GROUP");
  const emailFieldsSuggestions = visibleFields
    .filter((f) => f.type === "SHORT_TEXT" && f.options?.format === "EMAIL")
    .flatMap((f) =>
      f.replies.map((r) => {
        return {
          email: r.content.value,
          firstName: "",
          lastName: null,
        };
      }),
    );

  let groupContainsMyContact = false;

  const contactsFromGroups = groupFields.flatMap((f) => {
    const profileTypeNamePatternFields = f.profileType?.profileNamePatternFields ?? [];
    return {
      title: f.options?.groupName || f.title,
      suggestions: f.replies.flatMap((r) => {
        const contact: SuggestionType = {
          email: "",
          firstName: "",
        };
        let foundProfileNamePatternFields = 0;
        r.children?.map(({ field, replies }) => {
          const value = replies[0]?.content?.value;
          const profileTypeFieldAlias = field.profileTypeField?.alias ?? null;

          if ((field.type === "SHORT_TEXT" || field.type === "SELECT") && isNonNullish(value)) {
            if (
              field.type === "SHORT_TEXT" &&
              (field.options?.format === "EMAIL" ||
                field.alias?.toLowerCase().includes("email") ||
                profileTypeFieldAlias?.toLowerCase().includes("email"))
            ) {
              contact.email = value;
            } else if (
              isNonNullish(field.profileTypeField) &&
              profileTypeNamePatternFields.includes(field.profileTypeField.id)
            ) {
              if (foundProfileNamePatternFields === 0) {
                contact.firstName = value;
              } else if (foundProfileNamePatternFields === 1) {
                contact.lastName = value;
              }
              foundProfileNamePatternFields++;
            } else if (/^(?!.*last).*name/i.test(field.alias ?? profileTypeFieldAlias ?? "")) {
              contact.firstName = value;
            } else if (/last[_\s-]*name/i.test(field.alias ?? profileTypeFieldAlias ?? "")) {
              contact.lastName = value;
            }
          }

          const me = user ?? contact;
          if (
            contact.email === me.email &&
            contact.firstName === me.firstName &&
            contact.lastName === me.lastName
          ) {
            groupContainsMyContact = true;
          }
        });
        return contact;
      }),
    };
  });

  const seenContacts = new Set<string>();

  const groupContactSuggestions = contactsFromGroups
    .map(({ title, suggestions }) => {
      const filteredSuggestions = suggestions.filter((suggestion) => {
        const contactKey = [suggestion.email, suggestion.firstName, suggestion.lastName].join("|");
        const isInvalid =
          isNullish(suggestion.email) ||
          !EMAIL_REGEX.test(suggestion.email) ||
          currentSigners.some(
            (s) =>
              s.email === suggestion.email &&
              s.firstName === suggestion.firstName &&
              s.lastName === suggestion.lastName,
          ) ||
          seenContacts.has(contactKey);

        if (isInvalid) {
          return false;
        }
        seenContacts.add(contactKey);
        return true;
      });

      return {
        title,
        suggestions: uniqueBy(filteredSuggestions, (s) =>
          [s.email, s.firstName, s.lastName].join("|"),
        ),
      };
    })
    .filter((g) => g.suggestions.length > 0);

  if (petition.__typename === "Petition" && isNonNullish(user)) {
    suggestions = uniqueBy(
      [
        ...emailFieldsSuggestions,
        ...(petition.signatureRequests.flatMap((s) => s.signatureConfig.signers) ?? [])
          .filter(isNonNullish)
          .map((signer) => pick(signer, ["firstName", "lastName", "email"])),

        ...petition.accesses
          .filter((a) => a.status === "ACTIVE" && isNonNullish(a.contact))
          .map((a) => ({
            contactId: a.contact!.id,
            email: a.contact!.email,
            firstName: a.contact!.firstName,
            lastName: a.contact!.lastName ?? "",
          })),
        ...(groupContainsMyContact
          ? []
          : [
              {
                email: user.email,
                firstName: user.firstName ?? "",
                lastName: user.lastName,
                isMe: true,
              },
            ]),
      ]
        // remove already added signers
        .filter(
          (suggestion) =>
            !currentSigners.some(
              (s) =>
                s.email === suggestion.email &&
                s.firstName === suggestion.firstName &&
                s.lastName === suggestion.lastName,
            ),
        ),
      (s) => [s.email, s.firstName, s.lastName].join("|"),
    );
  } else if (petition.__typename === "PublicPetition" && isNonNullish(contact)) {
    suggestions = uniqueBy(
      [
        ...emailFieldsSuggestions,
        ...petition.recipients
          .map((r) => pick(r, ["email", "firstName", "lastName", "isMe"]))
          .filter((suggestion) => !currentSigners.some((s) => s.email === suggestion.email))
          // first in the list is the contact
          .sort((r) => (r.email === contact.email ? -1 : 0)),
      ],
      (s) => [s.email, s.firstName, s.lastName].join("|"),
    );
  }

  suggestions = suggestions.filter((s) => {
    const contactKey = [s.email, s.firstName, s.lastName].join("|");
    return !seenContacts.has(contactKey);
  });

  return [
    ...groupContactSuggestions,
    {
      title:
        groupContactSuggestions.length > 0
          ? intl.formatMessage({
              id: "component.suggested-signers.others",
              defaultMessage: "Others",
            })
          : intl.formatMessage({
              id: "component.suggested-signers.potential-signers",
              defaultMessage: "Potential signers",
            }),
      suggestions,
    },
  ].map(({ title, suggestions }, i) => {
    return (
      <SuggestedSignersRow
        key={i}
        title={title}
        isDisabled={isDisabled}
        suggestions={suggestions}
        onAddSigner={onAddSigner}
        tone={tone}
      />
    );
  });
}
interface SuggestedSignersRowProps {
  suggestions: SuggestionType[];
  onAddSigner: (s: SuggestionType) => void;
  title: string;
  isDisabled?: boolean;
  tone?: Tone;
}
function SuggestedSignersRow({
  suggestions,
  onAddSigner,
  title,
  isDisabled,
  tone,
}: SuggestedSignersRowProps) {
  const intl = useIntl();
  const showAddNewSignerDialog = useAddNewSignerDialog();

  const handleAddSigner = async (signer: SuggestionType) => {
    if (
      (isNonNullish(signer.firstName) && signer.firstName.length > 0) ||
      (isNonNullish(signer.lastName) && signer.lastName.length > 0)
    ) {
      onAddSigner(signer);
    } else {
      try {
        const _signer = await showAddNewSignerDialog({
          email: signer.email,
          tone: tone ?? "INFORMAL",
        });
        onAddSigner(_signer);
      } catch {}
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <>
      <Text
        textStyle={title ? undefined : "hint"}
        fontWeight="bold"
      >{`${title ?? intl.formatMessage({ id: "component.suggested-signers.unnamed-group", defaultMessage: "Unnamed group" })}:`}</Text>
      <Stack>
        {suggestions.map((signer, i) => (
          <Flex key={i} justifyContent="space-between" alignItems="center">
            <Box>
              {signer.firstName} {signer.lastName} {"<"}
              {signer.email}
              {">"}
              {signer.isMe ? (
                <Text as="span" fontStyle="italic">
                  {"("}
                  <FormattedMessage id="generic.you" defaultMessage="You" />
                  {")"}
                </Text>
              ) : null}
            </Box>
            <Button onClick={() => handleAddSigner(signer)} size="sm" isDisabled={isDisabled}>
              <FormattedMessage id="generic.add" defaultMessage="Add" />
            </Button>
          </Flex>
        ))}
      </Stack>
    </>
  );
}

SuggestedSigners.fragments = {
  get PetitionSigner() {
    return gql`
      fragment SuggestedSigners_PetitionSigner on PetitionSigner {
        ...Fragments_FullPetitionSigner
      }
      ${Fragments.FullPetitionSigner}
    `;
  },
  get PublicContact() {
    return gql`
      fragment SuggestedSigners_PublicContact on PublicContact {
        firstName
        lastName
        email
        isMe
      }
    `;
  },
  get PublicPetition() {
    return gql`
      fragment SuggestedSigners_PublicPetition on PublicPetition {
        id
        signatureConfig {
          signers {
            ...SuggestedSigners_PetitionSigner
          }
        }
        recipients {
          ...SuggestedSigners_PublicContact
        }
        fields {
          id
          type
          title
          options
          alias
          profileType {
            id
            profileNamePatternFields
          }
          replies {
            id
            content
            children {
              field {
                id
                type
                alias
                options
                profileTypeField {
                  id
                  alias
                }
              }
              replies {
                id
                content
              }
            }
          }
        }
        ...useFieldLogic_PublicPetition
      }
      ${useFieldLogic.fragments.PublicPetition}
      ${this.PetitionSigner}
    `;
  },
  get User() {
    return gql`
      fragment SuggestedSigners_User on User {
        id
        email
        firstName
        lastName
      }
    `;
  },
  get PetitionBase() {
    return gql`
      fragment SuggestedSigners_PetitionBase on PetitionBase {
        id
        fields {
          id
          type
          title
          options
          alias
          profileType {
            id
            profileNamePatternFields
          }
          replies {
            id
            content
            children {
              field {
                id
                type
                alias
                options
                profileTypeField {
                  id
                  alias
                }
              }
              replies {
                id
                content
              }
            }
          }
        }
        ... on Petition {
          accesses {
            id
            status
            contact {
              id
              email
              firstName
              lastName
            }
          }
          signatureRequests {
            id
            signatureConfig {
              signers {
                ...SuggestedSigners_PetitionSigner
              }
            }
          }
        }
        ...useFieldLogic_PetitionBase
      }
      ${useFieldLogic.fragments.PetitionBase}
      ${this.PetitionSigner}
    `;
  },
};
