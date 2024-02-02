import { IntlShape } from "react-intl";

export function getOpenSanctionsRelationship({
  relationship,
  intl,
}: {
  relationship: string;
  intl: IntlShape;
}) {
  const relationships = {
    "personal relationships": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.personal",
      defaultMessage: "Personal relationships",
    }),
    "business relationships": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.business",
      defaultMessage: "Business relationships",
    }),
    "financial manager": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.financial-manager",
      defaultMessage: "Financial manager",
    }),
    "significant person": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.significant-person",
      defaultMessage: "Significant person",
    }),
    friend: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.friend",
      defaultMessage: "Friend",
    }),
    child: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.child",
      defaultMessage: "Child",
    }),
    son: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.son",
      defaultMessage: "Son",
    }),
    father: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.father",
      defaultMessage: "Father",
    }),
    grandfather: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.grandfather",
      defaultMessage: "Grandfather",
    }),
    daughter: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.daughter",
      defaultMessage: "Daughter",
    }),
    mother: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.mother",
      defaultMessage: "Mother",
    }),
    grandmother: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.grandmother",
      defaultMessage: "Grandmother",
    }),
    "son in law": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.son-in-law",
      defaultMessage: "Son in law",
    }),
    "father in law": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.father-in-law",
      defaultMessage: "Father in law",
    }),
    "mother in law": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.mother-in-law",
      defaultMessage: "Mother in law",
    }),
    relative: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.relative",
      defaultMessage: "Relative",
    }),
    wife: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.wife",
      defaultMessage: "Wife",
    }),
    husband: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.husband",
      defaultMessage: "Husband",
    }),
    spouse: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.spouse",
      defaultMessage: "Spouse",
    }),
    sibling: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.sibling",
      defaultMessage: "Sibling",
    }),
    uncle: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.uncle",
      defaultMessage: "Uncle",
    }),
    "family member of": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.family-member-of",
      defaultMessage: "Family member of",
    }),

    "unmarried partner": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.unmarried-partner",
      defaultMessage: "Unmarried partner",
    }),
    "wife's father": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.wife-father",
      defaultMessage: "Wife's father",
    }),
    grandson: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.grandson",
      defaultMessage: "Grandson",
    }),
    niece: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.niece",
      defaultMessage: "Niece",
    }),
    secretary: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.secretary",
      defaultMessage: "Secretary",
    }),
    "the chairman": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.the-chairman",
      defaultMessage: "The chairman",
    }),
    "chairman of the board": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.chairman-of-the-board",
      defaultMessage: "Chairman of the board",
    }),
    "leader or official of": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.leader-or-official-of",
      defaultMessage: "Leader or official of",
    }),
    "board member": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.board-member",
      defaultMessage: "Board member",
    }),
    ceo: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.ceo",
      defaultMessage: "CEO",
    }),
    "the president": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.the-president",
      defaultMessage: "The president",
    }),
    director: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.director",
      defaultMessage: "Director",
    }),
    "deputy general director": intl.formatMessage({
      id: "util.get-open-sanctions-relationship.deputy-general-director",
      defaultMessage: "Deputy general director",
    }),
    head: intl.formatMessage({
      id: "util.get-open-sanctions-relationship.head",
      defaultMessage: "Head",
    }),
  } as Record<string, string>;

  const relationshipKey = relationship.replaceAll("-", " ");

  return relationships[relationshipKey.toLowerCase()] || relationshipKey;
}
