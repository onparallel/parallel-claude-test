import { PetitionEvent } from "../../db/__types";
import { PetitionEventPayload } from "../../graphql/backing/events";
import { toGlobalId } from "../../util/globalId";

export class EventParser {
  private static parseEventPayload(event: PetitionEvent) {
    let payload;
    switch (event.type) {
      case "ACCESS_ACTIVATED": {
        payload = event.data as PetitionEventPayload<"ACCESS_ACTIVATED">;
        return {
          petitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.petition_access_id
          ),
          userId: toGlobalId("User", payload.user_id),
        };
      }
      case "ACCESS_DEACTIVATED": {
        payload = event.data as PetitionEventPayload<"ACCESS_DEACTIVATED">;
        return {
          petitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.petition_access_id
          ),
          userId: toGlobalId("User", payload.user_id),
        };
      }
      case "ACCESS_DELEGATED": {
        payload = event.data as PetitionEventPayload<"ACCESS_DELEGATED">;
        return {
          newPetitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.new_petition_access_id
          ),
          petitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.petition_access_id
          ),
        };
      }
      case "ACCESS_OPENED": {
        payload = event.data as PetitionEventPayload<"ACCESS_OPENED">;
        return {
          petitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.petition_access_id
          ),
        };
      }
      case "COMMENT_DELETED": {
        payload = event.data as PetitionEventPayload<"COMMENT_DELETED">;
        return {
          petitionAccessId: payload.petition_access_id
            ? toGlobalId("PetitionAccess", payload.petition_access_id)
            : undefined,
          petitionFieldCommentId: toGlobalId(
            "PetitionFieldComment",
            payload.petition_field_comment_id
          ),
          petitionFieldId: toGlobalId(
            "PetitionField",
            payload.petition_field_id
          ),
          userId: payload.user_id
            ? toGlobalId("User", payload.user_id)
            : undefined,
        };
      }
      case "COMMENT_PUBLISHED": {
        payload = event.data as PetitionEventPayload<"COMMENT_PUBLISHED">;
        return {
          petitionFieldCommentId: toGlobalId(
            "PetitionFieldComment",
            payload.petition_field_comment_id
          ),
          petitionFieldId: toGlobalId(
            "PetitionField",
            payload.petition_field_id
          ),
        };
      }
      case "MESSAGE_CANCELLED": {
        payload = event.data as PetitionEventPayload<"MESSAGE_CANCELLED">;
        return {
          userId: toGlobalId("User", payload.user_id),
          petitionMessageId: toGlobalId(
            "PetitionMessage",
            payload.petition_message_id
          ),
        };
      }
      case "MESSAGE_SCHEDULED": {
        payload = event.data as PetitionEventPayload<"MESSAGE_SCHEDULED">;
        return {
          petitionMessageId: toGlobalId(
            "PetitionMessage",
            payload.petition_message_id
          ),
        };
      }
      case "MESSAGE_SENT": {
        payload = event.data as PetitionEventPayload<"MESSAGE_SENT">;
        return {
          petitionMessageId: toGlobalId(
            "PetitionMessage",
            payload.petition_message_id
          ),
        };
      }
      case "OWNERSHIP_TRANSFERRED": {
        payload = event.data as PetitionEventPayload<"OWNERSHIP_TRANSFERRED">;
        return {
          previousOwnerId: payload.previous_owner_id
            ? toGlobalId("User", payload.previous_owner_id)
            : undefined,
          ownerId: toGlobalId("User", payload.owner_id),
          userId: toGlobalId("User", payload.user_id),
        };
      }
      case "PETITION_CLOSED": {
        payload = event.data as PetitionEventPayload<"PETITION_CLOSED">;
        return {
          userId: toGlobalId("User", payload.user_id),
        };
      }
      case "PETITION_CLOSED_NOTIFIED": {
        payload = event.data as PetitionEventPayload<"PETITION_CLOSED_NOTIFIED">;
        return {
          petitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.petition_access_id
          ),
          userId: toGlobalId("User", payload.user_id),
        };
      }
      case "PETITION_COMPLETED": {
        payload = event.data as PetitionEventPayload<"PETITION_COMPLETED">;
        return {
          petitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.petition_access_id
          ),
        };
      }
      case "PETITION_CREATED": {
        payload = event.data as PetitionEventPayload<"PETITION_CREATED">;
        return {
          userId: toGlobalId("User", payload.user_id),
        };
      }
      case "PETITION_REOPENED": {
        payload = event.data as PetitionEventPayload<"PETITION_REOPENED">;
        return {
          userId: toGlobalId("User", payload.user_id),
        };
      }
      case "REMINDER_SENT": {
        payload = event.data as PetitionEventPayload<"REMINDER_SENT">;
        return {
          petitionReminderId: toGlobalId(
            "PetitionReminder",
            payload.petition_reminder_id
          ),
        };
      }
      case "REPLY_CREATED": {
        payload = event.data as PetitionEventPayload<"REPLY_CREATED">;
        return {
          petitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.petition_access_id
          ),

          petitionFieldId: toGlobalId(
            "PetitionField",
            payload.petition_field_id
          ),
          petitionFieldReplyId: toGlobalId(
            "PetitionFieldReply",
            payload.petition_field_reply_id
          ),
        };
      }
      case "REPLY_DELETED": {
        payload = event.data as PetitionEventPayload<"REPLY_DELETED">;
        return {
          petitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.petition_access_id
          ),

          petitionFieldId: toGlobalId(
            "PetitionField",
            payload.petition_field_id
          ),
          petitionFieldReplyId: toGlobalId(
            "PetitionFieldReply",
            payload.petition_field_reply_id
          ),
        };
      }
      case "REPLY_UPDATED": {
        payload = event.data as PetitionEventPayload<"REPLY_UPDATED">;
        return {
          petitionAccessId: toGlobalId(
            "PetitionAccess",
            payload.petition_access_id
          ),

          petitionFieldId: toGlobalId(
            "PetitionField",
            payload.petition_field_id
          ),
          petitionFieldReplyId: toGlobalId(
            "PetitionFieldReply",
            payload.petition_field_reply_id
          ),
        };
      }
      case "SIGNATURE_CANCELLED": {
        payload = event.data as PetitionEventPayload<"SIGNATURE_CANCELLED">;
        return {
          cancelData: {
            userId:
              payload.cancel_data?.canceller_id &&
              payload.cancel_reason === "CANCELLED_BY_USER"
                ? toGlobalId("User", payload.cancel_data.canceller_id)
                : undefined,
            contactId:
              payload.cancel_data?.canceller_id &&
              payload.cancel_reason === "DECLINED_BY_SIGNER"
                ? toGlobalId("Contact", payload.cancel_data.canceller_id)
                : undefined,
            reason: payload.cancel_data?.canceller_reason,
          },
          cancelReason: payload.cancel_reason,
          petitionSignatureRequestId: toGlobalId(
            "PetitionSignatureRequest",
            payload.petition_signature_request_id
          ),
        };
      }
      case "SIGNATURE_COMPLETED": {
        payload = event.data as PetitionEventPayload<"SIGNATURE_COMPLETED">;
        return {
          fileUploadId: toGlobalId("FileUpload", payload.file_upload_id),
          petitionSignatureRequestId: toGlobalId(
            "PetitionSignatureRequest",
            payload.petition_signature_request_id
          ),
        };
      }
      case "SIGNATURE_STARTED": {
        payload = event.data as PetitionEventPayload<"SIGNATURE_STARTED">;
        return {
          petitionSignatureRequestId: toGlobalId(
            "PetitionSignatureRequest",
            payload.petition_signature_request_id
          ),
        };
      }
      case "USER_PERMISSION_ADDED": {
        payload = event.data as PetitionEventPayload<"USER_PERMISSION_ADDED">;
        return {
          userId: toGlobalId("User", payload.user_id),
          permissionType: payload.permission_type,
        };
      }
      case "USER_PERMISSION_EDITED": {
        payload = event.data as PetitionEventPayload<"USER_PERMISSION_EDITED">;
        return {
          userId: toGlobalId("User", payload.user_id),
          permissionType: payload.permission_type,
        };
      }
      case "USER_PERMISSION_REMOVED": {
        payload = event.data as PetitionEventPayload<"USER_PERMISSION_REMOVED">;
        return {
          userId: toGlobalId("User", payload.user_id),
        };
      }
      default:
        return {};
    }
  }

  static parse(event: PetitionEvent) {
    return {
      id: toGlobalId("PetitionEvent", event.id),
      petitionId: toGlobalId("Petition", event.petition_id),
      type: event.type,
      data: this.parseEventPayload(event),
      createdAt: event.created_at,
    };
  }
}
