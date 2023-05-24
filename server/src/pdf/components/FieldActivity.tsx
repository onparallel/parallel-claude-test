import { Polygon, Svg, Text, View } from "@react-pdf/renderer";
import { Style } from "@react-pdf/types";
import gql from "graphql-tag";
import { FormattedMessage } from "react-intl";
import { isDefined } from "remeda";
import { DateTime } from "../../emails/components/DateTime";
import { FORMATS } from "../../util/dates";
import { FieldActivity_PetitionFieldReplyFragment } from "../__types";
import { UserOrContactReference } from "./UserOrContactReference";
import { UserReference } from "./UserReference";

export function FieldActivity({
  reply,
  style,
}: {
  reply: FieldActivity_PetitionFieldReplyFragment;
  style?: Style | Style[];
}) {
  return (
    <View
      style={[
        {
          ...style,
          fontSize: "10px",
          opacity: 0.7,
          marginTop: "2mm",
          marginBottom: "1.5mm",
        },
      ]}
    >
      <Text>
        <FormattedMessage
          id="document.petition-export.reply-updated-by"
          defaultMessage="Reply by {name} on {date}"
          values={{
            name: (
              <UserOrContactReference
                userOrAccess={reply.repliedBy}
                _deleted={{ textTransform: "lowercase" }}
              />
            ),
            date: (
              <DateTime
                value={reply.repliedAt}
                format={{ timeZone: "UTC", timeZoneName: "short", ...FORMATS.LLL }}
              />
            ),
          }}
        />
      </Text>
      {isDefined(reply.approvedBy) && reply.field?.requireApproval ? (
        <View style={[{ flexDirection: "row", marginTop: "1mm" }]}>
          <Svg viewBox="0 0 14 14" style={{ width: "12px", height: "12px" }}>
            <Polygon
              fill="#38A169"
              points="5.5 11.9993304 14 3.49933039 12.5 2 5.5 8.99933039 1.5 4.9968652 0 6.49933039"
            ></Polygon>
          </Svg>
          <Text style={[{ flex: 1, marginLeft: "1.5mm" }]}>
            <FormattedMessage
              id="document.petition-export.reply-approved-by"
              defaultMessage="Approved by {name} on {date}"
              values={{
                name: (
                  <UserReference
                    user={reply.approvedBy}
                    _deleted={{ textTransform: "lowercase" }}
                  />
                ),
                date: (
                  <DateTime
                    value={reply.approvedAt ?? 0}
                    format={{ timeZone: "UTC", timeZoneName: "short", ...FORMATS.LLL }}
                  />
                ),
              }}
            />
          </Text>
        </View>
      ) : null}
    </View>
  );
}

FieldActivity.fragments = {
  PetitionFieldReply: gql`
    fragment FieldActivity_PetitionFieldReply on PetitionFieldReply {
      id
      repliedBy {
        ...UserOrContactReference_UserOrPetitionAccess
      }
      repliedAt
      approvedBy {
        ...UserReference_User
      }
      approvedAt
      field {
        requireApproval
      }
    }
    ${UserReference.fragments.User}
    ${UserOrContactReference.fragments.UserOrPetitionAccess}
  `,
};
