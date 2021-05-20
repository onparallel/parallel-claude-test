import { PetitionEvent } from "../../db/events";
import { toGlobalId } from "../../util/globalId";

function mapEventPayload(event: PetitionEvent) {
  switch (event.type) {
    case "ACCESS_ACTIVATED": {
      return {
        petitionAccessId: toGlobalId(
          "PetitionAccess",
          event.data.petition_access_id
        ),
        userId: toGlobalId("User", event.data.user_id),
      };
    }
    case "ACCESS_DEACTIVATED": {
      return {
        petitionAccessId: toGlobalId(
          "PetitionAccess",
          event.data.petition_access_id
        ),
        userId: toGlobalId("User", event.data.user_id),
      };
    }
    case "ACCESS_DELEGATED": {
      return {
        newPetitionAccessId: toGlobalId(
          "PetitionAccess",
          event.data.new_petition_access_id
        ),
        petitionAccessId: toGlobalId(
          "PetitionAccess",
          event.data.petition_access_id
        ),
      };
    }
    case "ACCESS_OPENED": {
      return {
        petitionAccessId: toGlobalId(
          "PetitionAccess",
          event.data.petition_access_id
        ),
      };
    }
    case "COMMENT_DELETED": {
      return {
        petitionAccessId: event.data.petition_access_id
          ? toGlobalId("PetitionAccess", event.data.petition_access_id)
          : null,
        petitionFieldCommentId: toGlobalId(
          "PetitionFieldComment",
          event.data.petition_field_comment_id
        ),
        petitionFieldId: toGlobalId(
          "PetitionField",
          event.data.petition_field_id
        ),
        userId: event.data.user_id
          ? toGlobalId("User", event.data.user_id)
          : null,
      };
    }
    case "COMMENT_PUBLISHED": {
      return {
        petitionFieldCommentId: toGlobalId(
          "PetitionFieldComment",
          event.data.petition_field_comment_id
        ),
        petitionFieldId: toGlobalId(
          "PetitionField",
          event.data.petition_field_id
        ),
      };
    }
    case "MESSAGE_CANCELLED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
        petitionMessageId: toGlobalId(
          "PetitionMessage",
          event.data.petition_message_id
        ),
      };
    }
    case "MESSAGE_SCHEDULED": {
      return {
        petitionMessageId: toGlobalId(
          "PetitionMessage",
          event.data.petition_message_id
        ),
      };
    }
    case "MESSAGE_SENT": {
      return {
        petitionMessageId: toGlobalId(
          "PetitionMessage",
          event.data.petition_message_id
        ),
      };
    }
    case "OWNERSHIP_TRANSFERRED": {
      return {
        previousOwnerId: event.data.previous_owner_id
          ? toGlobalId("User", event.data.previous_owner_id)
          : null,
        ownerId: toGlobalId("User", event.data.owner_id),
        userId: toGlobalId("User", event.data.user_id),
      };
    }
    case "PETITION_CLOSED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
      };
    }
    case "PETITION_CLOSED_NOTIFIED": {
      return {
        petitionAccessId: toGlobalId(
          "PetitionAccess",
          event.data.petition_access_id
        ),
        userId: toGlobalId("User", event.data.user_id),
      };
    }
    case "PETITION_COMPLETED": {
      return {
        petitionAccessId: toGlobalId(
          "PetitionAccess",
          event.data.petition_access_id
        ),
      };
    }
    case "PETITION_CREATED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
      };
    }
    case "PETITION_REOPENED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
      };
    }
    case "REMINDER_SENT": {
      return {
        petitionReminderId: toGlobalId(
          "PetitionReminder",
          event.data.petition_reminder_id
        ),
      };
    }
    case "REPLY_CREATED": {
      return {
        petitionAccessId: event.data.petition_access_id
          ? toGlobalId("PetitionAccess", event.data.petition_access_id)
          : null,
        userId: event.data.user_id
          ? toGlobalId("User", event.data.user_id)
          : null,
        petitionFieldId: toGlobalId(
          "PetitionField",
          event.data.petition_field_id
        ),
        petitionFieldReplyId: toGlobalId(
          "PetitionFieldReply",
          event.data.petition_field_reply_id
        ),
      };
    }
    case "REPLY_DELETED": {
      return {
        petitionAccessId: event.data.petition_access_id
          ? toGlobalId("PetitionAccess", event.data.petition_access_id)
          : null,
        userId: event.data.user_id
          ? toGlobalId("User", event.data.user_id)
          : null,
        petitionFieldId: toGlobalId(
          "PetitionField",
          event.data.petition_field_id
        ),
        petitionFieldReplyId: toGlobalId(
          "PetitionFieldReply",
          event.data.petition_field_reply_id
        ),
      };
    }
    case "REPLY_UPDATED": {
      return {
        petitionAccessId: event.data.petition_access_id
          ? toGlobalId("PetitionAccess", event.data.petition_access_id)
          : null,
        userId: event.data.user_id
          ? toGlobalId("User", event.data.user_id)
          : null,
        petitionFieldId: toGlobalId(
          "PetitionField",
          event.data.petition_field_id
        ),
        petitionFieldReplyId: toGlobalId(
          "PetitionFieldReply",
          event.data.petition_field_reply_id
        ),
      };
    }
    case "SIGNATURE_CANCELLED": {
      return {
        cancelData: {
          userId:
            event.data.cancel_data?.canceller_id &&
            event.data.cancel_reason === "CANCELLED_BY_USER"
              ? toGlobalId("User", event.data.cancel_data.canceller_id)
              : null,
          contactId:
            event.data.cancel_data?.canceller_id &&
            event.data.cancel_reason === "DECLINED_BY_SIGNER"
              ? toGlobalId("Contact", event.data.cancel_data.canceller_id)
              : null,
          reason: event.data.cancel_data?.canceller_reason,
        },
        cancelReason: event.data.cancel_reason,
        petitionSignatureRequestId: toGlobalId(
          "PetitionSignatureRequest",
          event.data.petition_signature_request_id
        ),
      };
    }
    case "SIGNATURE_COMPLETED": {
      return {
        fileUploadId: toGlobalId("FileUpload", event.data.file_upload_id),
        petitionSignatureRequestId: toGlobalId(
          "PetitionSignatureRequest",
          event.data.petition_signature_request_id
        ),
      };
    }
    case "SIGNATURE_STARTED": {
      return {
        petitionSignatureRequestId: toGlobalId(
          "PetitionSignatureRequest",
          event.data.petition_signature_request_id
        ),
      };
    }
    case "USER_PERMISSION_ADDED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
        permissionUserId: toGlobalId("User", event.data.permission_user_id),
        permissionType: event.data.permission_type,
      };
    }
    case "USER_PERMISSION_EDITED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
        permissionUserId: toGlobalId("User", event.data.permission_user_id),
        permissionType: event.data.permission_type,
      };
    }
    case "USER_PERMISSION_REMOVED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
        permissionUserId: toGlobalId("User", event.data.permission_user_id),
      };
    }
    case "GROUP_PERMISSION_ADDED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
        userGroupId: toGlobalId("UserGroup", event.data.user_group_id),
        permissionType: event.data.permission_type,
      };
    }
    case "GROUP_PERMISSION_EDITED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
        userGroupId: toGlobalId("UserGroup", event.data.user_group_id),
        permissionType: event.data.permission_type,
      };
    }
    case "GROUP_PERMISSION_REMOVED": {
      return {
        userId: toGlobalId("User", event.data.user_id),
        userGroupId: toGlobalId("UserGroup", event.data.user_group_id),
      };
    }
    default:
      return {};
  }
}

export function mapEvent(event: PetitionEvent) {
  return {
    id: toGlobalId("PetitionEvent", event.id),
    petitionId: toGlobalId("Petition", event.petition_id),
    type: event.type,
    data: mapEventPayload(event),
    createdAt: event.created_at,
  };
}
