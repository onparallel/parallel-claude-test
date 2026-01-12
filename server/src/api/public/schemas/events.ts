import { outdent } from "outdent";
import {
  PetitionEventType,
  PetitionFieldReplyStatusValues,
  ProfileEventType,
} from "../../../db/__types";
import { toGlobalId } from "../../../util/globalId";
import { JsonSchema, JsonSchemaFor } from "../../../util/jsonSchema";
import { pascalCase } from "../../../util/strings";
import { _PetitionSigner } from "./core";

const PetitionEventSchemas = {
  ACCESS_ACTIVATED: {
    description: "The user created or reactivated an access on the parallel",
    properties: {
      petitionAccessId: {
        description: "The ID of the parallel access",
        type: "string",
        example: toGlobalId("PetitionAccess", 2),
      },
      userId: {
        description: "The ID of the user",
        type: "string",
        example: toGlobalId("User", 1),
      },
    },
  },
  ACCESS_DEACTIVATED: {
    description: "An access on the parallel has been deactivated.",
    properties: {
      petitionAccessId: {
        description: "The ID of the parallel access",
        type: "string",
        example: toGlobalId("PetitionAccess", 2),
      },
      userId: {
        description:
          "The ID of the user that deactivated the access. Only set if `reason` is `DEACTIVATED_BY_USER`. If `null`, the access was automatically deactivated because a bounce ocurred when trying to delivery an email.",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      reason: {
        type: "string",
        description:
          "Wether the access was deactivated manually by a user, or it was deactivated automatically because an email was bounced.",
        enum: ["DEACTIVATED_BY_USER", "EMAIL_BOUNCED"],
        example: "DEACTIVATED_BY_USER",
      },
    },
  },
  ACCESS_DELEGATED: {
    description:
      "A recipient delegated their parallel to another person, creating a new access on the parallel",
    properties: {
      newPetitionAccessId: {
        description: "The ID of the new access created by the recipient",
        type: "string",
        example: toGlobalId("PetitionAccess", 21),
      },
      petitionAccessId: {
        description: "The ID of the original access where the delegation happened",
        type: "string",
        example: toGlobalId("PetitionAccess", 20),
      },
    },
  },
  ACCESS_OPENED: {
    description: "A recipient opened their access to the parallel",
    properties: {
      petitionAccessId: {
        description: "The ID of the parallel access",
        type: "string",
        example: toGlobalId("PetitionAccess", 2),
      },
    },
  },
  COMMENT_DELETED: {
    description: "A comment was deleted either by a recipient or a user.",
    properties: {
      petitionFieldCommentId: {
        description: "The ID of the comment",
        type: "string",
        example: toGlobalId("PetitionFieldComment", 10),
      },
      petitionFieldId: {
        description:
          "The ID of the field where the comment belongs to. If null, this is a general comment on the parallel.",
        type: ["string", "null"],
        example: toGlobalId("PetitionField", 10),
      },
      petitionAccessId: {
        description:
          "The ID of the access where the comment was deleted. If set, the comment was deleted by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 10),
      },
      userId: {
        description: "The ID of the user. If set, the comment was deleted by this user.",
        type: ["string", "null"],
        example: null,
      },
    },
  },
  COMMENT_PUBLISHED: {
    description: "A comment was published on a parallel field",
    properties: {
      petitionFieldCommentId: {
        description: "The ID of the comment",
        type: "string",
        example: toGlobalId("PetitionFieldComment", 10),
      },
      petitionFieldId: {
        description:
          "The ID of the field where the comment belongs to. If null, this is a general comment on the parallel.",
        type: ["string", "null"],
        example: toGlobalId("PetitionField", 10),
      },
    },
  },
  MESSAGE_CANCELLED: {
    description: "A user cancelled a scheduled message",
    properties: {
      petitionMessageId: {
        description: "The ID of the cancelled message",
        type: "string",
        example: toGlobalId("PetitionMessage", 10),
      },
      userId: {
        description:
          "The ID of the user that cancelled the send of the message. Only set if `reason` is `CANCELLED_BY_USER`. If `null`, the message was automatically cancelled because a bounce ocurred when trying to delivery an email.",
        type: ["string", "null"],
        example: toGlobalId("User", 10),
      },
      reason: {
        type: "string",
        description:
          "Wether the message was cancelled manually by a user, or it was cancelled automatically because an email was bounced.",
        enum: ["CANCELLED_BY_USER", "EMAIL_BOUNCED"],
        example: "CANCELLED_BY_USER",
      },
    },
  },
  MESSAGE_SCHEDULED: {
    description: "A user scheduled a message",
    properties: {
      petitionMessageId: {
        description: "The ID of the scheduled message",
        type: "string",
        example: toGlobalId("PetitionMessage", 10),
      },
    },
  },
  MESSAGE_SENT: {
    description: "A user sent a message",
    properties: {
      petitionMessageId: {
        description: "The ID of the message",
        type: "string",
        example: toGlobalId("PetitionMessage", 10),
      },
    },
  },
  OWNERSHIP_TRANSFERRED: {
    description: "A user transferred the ownership of a parallel to another user",
    properties: {
      userId: {
        description: "The ID of the user that transferred the parallel",
        type: "string",
        example: toGlobalId("User", 10),
      },
      ownerId: {
        description: "The ID of the new owner of the parallel",
        type: "string",
        example: toGlobalId("User", 1),
      },
      previousOwnerId: {
        description: "The ID of the previous owner of the parallel",
        type: ["string", "null"],
        example: toGlobalId("User", 2),
      },
    },
  },
  PETITION_CLOSED: {
    description: "A petition was closed by a user",
    properties: {
      userId: {
        description: "The ID of the user that closed the parallel",
        type: "string",
        example: toGlobalId("User", 1),
      },
    },
  },
  PETITION_CLOSED_NOTIFIED: {
    description: "A user notified a recipient that the parallel was closed",
    properties: {
      userId: {
        description: "The ID of the user",
        type: "string",
        example: toGlobalId("User", 1),
      },
      petitionAccessId: {
        description: "The ID of the parallel access",
        type: "string",
        example: toGlobalId("PetitionAccess", 1),
      },
    },
  },
  PETITION_COMPLETED: {
    description:
      "A parallel was completed. If a user completed it, `userId` will be set in the event data. Else, `petitionAccessId` will be set.",
    properties: {
      userId: {
        description: "The ID of the user that completed the parallel",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      petitionAccessId: {
        description: "The ID of the parallel access linked to the recipient",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
    },
  },
  PETITION_CREATED: {
    description: "A petition was created",
    properties: {
      userId: {
        description: "The ID of the user that created the parallel",
        type: "string",
        example: toGlobalId("User", 10),
      },
    },
  },
  PETITION_REOPENED: {
    description: "A user reopened a closed parallel",
    properties: {
      userId: {
        description: "The ID of the user that reopened the parallel",
        type: "string",
        example: toGlobalId("User", 5),
      },
    },
  },
  REMINDER_SENT: {
    description: "A manual or automatic reminder was sent to the parallel recipients",
    properties: {
      petitionReminderId: {
        description: "The ID of the reminder",
        type: "string",
        example: toGlobalId("PetitionReminder", 100),
      },
    },
  },
  REPLY_CREATED: {
    description: "A reply on the parallel was submitted either by a recipient or a user.",
    properties: {
      petitionAccessId: {
        description:
          "The ID of the access. If set, the reply was submitted by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
      userId: {
        description: "The ID of the user. If set, the reply was submitted by this user.",
        type: ["string", "null"],
        example: null,
      },
      petitionFieldId: {
        description: "The ID of the field replied by the recipient",
        type: "string",
        example: toGlobalId("PetitionField", 14),
      },
      petitionFieldReplyId: {
        description: "The ID of the new reply",
        type: "string",
        example: toGlobalId("PetitionFieldReply", 11),
      },
    },
  },
  REPLY_DELETED: {
    description: "A reply on the parallel was deleted either by a recipient or a user.",
    properties: {
      petitionAccessId: {
        description:
          "The ID of the access. If set, the reply was deleted by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
      userId: {
        description: "The ID of the user. If set, the reply was deleted by this user.",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      petitionFieldId: {
        description: "The ID of the field where the reply belongs",
        type: "string",
        example: toGlobalId("PetitionField", 1),
      },
      petitionFieldReplyId: {
        description: "The ID of the deleted reply",
        type: "string",
        example: toGlobalId("PetitionFieldReply", 1),
      },
    },
  },
  REPLY_UPDATED: {
    description: "A reply on the parallel was updated either by a recipient or a user.",
    properties: {
      petitionAccessId: {
        description:
          "The ID of the access. If set, the reply was updated by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
      userId: {
        description: "The ID of the user. If set, the reply was updated by this user.",
        type: ["string", "null"],
        example: null,
      },
      petitionFieldId: {
        description: "The ID of the field where the reply belongs",
        type: "string",
        example: toGlobalId("PetitionField", 1),
      },
      petitionFieldReplyId: {
        description: "The ID of the updated reply",
        type: "string",
        example: toGlobalId("PetitionFieldReply", 1),
      },
    },
  },
  SIGNATURE_CANCELLED: {
    description: "An eSignature request on the parallel was cancelled.",
    properties: {
      petitionSignatureRequestId: {
        description: "The ID of the eSignature request.",
        type: "string",
        example: toGlobalId("PetitionSignatureRequest", 1),
      },
      cancelReason: {
        description: "The reason of the cancel.",
        type: "string",
        enum: [
          "CANCELLED_BY_USER",
          "DECLINED_BY_SIGNER",
          "REQUEST_ERROR",
          "REQUEST_RESTARTED",
          "REQUEST_EXPIRED",
        ],
        example: "CANCELLED_BY_USER",
      },
      cancelData: {
        description: "Information about who and why cancelled the eSignature request",
        type: "object",
        properties: {
          userId: {
            type: ["string", "null"],
            description: outdent`
                The ID of the user that cancelled or restarted the signature.  
                Only set if cancelReason is \`CANCELLED_BY_USER\` or \`REQUEST_RESTARTED\`.
              `,
            example: toGlobalId("User", 2),
          },
          petitionAccessId: {
            type: ["string", "null"],
            description: outdent`
                The ID of the petition access linked to the recipient that restarted the signature.
                Only set if cancelReason is \`REQUEST_RESTARTED\`.
              `,
            example: null,
          },
          declineReason: {
            type: ["string", "null"],
            description: outdent`
                Reason of cancellation.  
                Only set if cancelReason is \`DECLINED_BY_SIGNER\`.
            `,
            example: null,
          },
          canceller: {
            description: outdent`
                Information about the signer that declined the request.
                Only set if cancelReason is \`DECLINED_BY_SIGNER\`.
              `,
            type: ["object", "null"],
            properties: {
              firstName: { type: "string" },
              lastName: { type: "string" },
              email: { type: "string" },
            },
            example: null,
          },
          error: {
            description: outdent`
                The server error that cancelled the signature.
                Only set of cancelReason is \`REQUEST_ERROR\`.
              `,
            type: ["string", "null"],
            example: null,
          },
          errorCode: {
            description: outdent`
                The error code of the cancelled the signature.
                Only set of cancelReason is \`REQUEST_ERROR\`.
              `,
            type: ["string", "null"],
            example: null,
          },
        },
      },
    },
  },
  SIGNATURE_DELIVERED: {
    description: "An eSignature request on the parallel was delivered to the signer.",
    properties: {
      signer: _PetitionSigner,
      petitionSignatureRequestId: {
        type: "string",
        description: "The ID of the signature request",
        example: toGlobalId("PetitionSignatureRequest", 2),
      },
    },
  },
  SIGNATURE_OPENED: {
    description: "A signer has opened the signing page on the signature provider",
    properties: {
      signer: _PetitionSigner,
      petitionSignatureRequestId: {
        type: "string",
        description: "The ID of the signature request",
        example: toGlobalId("PetitionSignatureRequest", 2),
      },
    },
  },
  SIGNATURE_COMPLETED: {
    description: "The eSignature request on the parallel was completed",
    properties: {
      fileUploadId: {
        description: "The ID of the signed PDF file",
        type: "string",
        example: toGlobalId("FileUpload", 1),
      },
      petitionSignatureRequestId: {
        description: "The ID of the eSignature request",
        type: "string",
        example: toGlobalId("PetitionSignatureRequest", 1),
      },
    },
  },
  SIGNATURE_STARTED: {
    description: "An eSignature request on the parallel started",
    properties: {
      petitionSignatureRequestId: {
        description: "The ID of the eSignature request",
        type: "string",
        example: toGlobalId("PetitionSignatureRequest", 1),
      },
    },
  },
  SIGNATURE_REMINDER: {
    description: "A user sent a reminder email to the pending signers",
    properties: {
      userId: {
        description: "The ID of the user that sent the reminder",
        type: "string",
        example: toGlobalId("User", 1),
      },
      petitionSignatureRequestId: {
        description: "The ID of the eSignature request",
        type: "string",
        example: toGlobalId("PetitionSignatureRequest", 11),
      },
    },
  },
  USER_PERMISSION_ADDED: {
    description: "A parallel was shared with another user",
    properties: {
      permissionType: {
        description: "The type of permission for the new user",
        type: "string",
        enum: ["READ", "WRITE"],
        example: "WRITE",
      },
      userId: {
        description:
          "The ID of the user that shared the parallel, or null if the parallel was shared by the system.",
        type: ["string", "null"],
        example: toGlobalId("User", 10),
      },
      permissionUserId: {
        description: "The ID of the user linked to the new permission",
        type: "string",
        example: toGlobalId("User", 100),
      },
    },
  },
  USER_PERMISSION_EDITED: {
    description: "The user modified the type of permission on a shared parallel",
    properties: {
      permissionType: {
        description: "The new permission for the user",
        type: "string",
        enum: ["READ", "WRITE"],
        example: "READ",
      },
      userId: {
        description: "The ID of the user that edited the permission",
        type: "string",
        example: toGlobalId("User", 10),
      },
      permissionUserId: {
        description: "The ID of the user linked to the modified permission",
        type: "string",
        example: toGlobalId("User", 20),
      },
    },
  },
  USER_PERMISSION_REMOVED: {
    description: "The user removed a permission on their parallel",
    properties: {
      userId: {
        description: "The ID of the user that removed the permission",
        type: "string",
        example: toGlobalId("User", 10),
      },
      permissionUserId: {
        description: "The ID of the user that lost its permission",
        type: "string",
        example: toGlobalId("User", 20),
      },
    },
  },
  GROUP_PERMISSION_ADDED: {
    description: "The user shared their parallel with a user group",
    properties: {
      permissionType: {
        description: "The type of permission for the group members",
        type: "string",
        enum: ["READ", "WRITE"],
        example: "READ",
      },
      userId: {
        description: "The ID of the user that shared the parallel",
        type: "string",
        example: toGlobalId("User", 10),
      },
      userGroupId: {
        description: "The ID of the group linked to the new permission",
        type: "string",
        example: toGlobalId("UserGroup", 10),
      },
    },
  },
  GROUP_PERMISSION_EDITED: {
    description: "The user modified the type of permission on a shared parallel",
    properties: {
      permissionType: {
        description: "The new permission for the group",
        type: "string",
        enum: ["READ", "WRITE"],
        example: "WRITE",
      },
      userId: {
        description: "The ID of the user that edited the permission",
        type: "string",
        example: toGlobalId("User", 10),
      },
      userGroupId: {
        description: "The ID of the group linked to the modified permission",
        type: "string",
        example: toGlobalId("UserGroup", 10),
      },
    },
  },
  GROUP_PERMISSION_REMOVED: {
    description: "The user removed a permission on their parallel",
    properties: {
      userId: {
        description: "The ID of the user that removed the permission",
        type: "string",
        example: toGlobalId("User", 10),
      },
      userGroupId: {
        description: "The ID of the group that lost its permission",
        type: "string",
        example: toGlobalId("UserGroup", 10),
      },
    },
  },
  PETITION_CLONED: {
    description: "The user cloned a parallel",
    properties: {
      newPetitionId: {
        description: "The ID of the new created parallel",
        type: "string",
        example: toGlobalId("Petition", 1),
      },
      type: {
        description: "The type of the new created parallel",
        enum: ["PETITION", "TEMPLATE"],
        example: "PETITION",
      },
      userId: {
        description: "The ID of the user that cloned the parallel",
        type: "string",
        example: toGlobalId("User", 10),
      },
    },
  },
  PETITION_DELETED: {
    description: "A parallel was permanently deleted.",
    properties: {
      userId: {
        description:
          "If set, the ID of the user that deleted the parallel. If null, the parallel was automatically deleted by the system because it was scheduled for deletion.",
        type: ["string", "null"],
        example: toGlobalId("User", 10),
      },
      status: {
        description: "The status of the parallel at the moment it was deleted",
        enum: ["CLOSED", "COMPLETED", "DRAFT", "PENDING"],
        example: "COMPLETED",
      },
    },
  },
  TEMPLATE_USED: {
    description: "A template has been used to create a parallel",
    properties: {
      userId: {
        description: "The ID of the user that used the template",
        type: "string",
        example: toGlobalId("User", 10),
      },
      newPetitionId: {
        description: "The ID of the new created parallel",
        type: "string",
        example: toGlobalId("Petition", 1),
      },
    },
  },
  REMINDERS_OPT_OUT: {
    description: "The contact has opted out from receiving reminders for this parallel",
    properties: {
      petitionAccessId: {
        description: "The ID of the petition access",
        type: "string",
        example: toGlobalId("PetitionAccess", 10),
      },
      reason: {
        description: "Code representing the reason for opting out.",
        type: "string",
        enum: ["NOT_INTERESTED", "NOT_REQUESTED", "WRONG_PERSON", "NO_REMINDERS", "OTHER"],
        example: "NOT_INTERESTED",
      },
      other: {
        description: "If reason is OTHER, this will be the explanation added by the contact",
        type: ["string", "null"],
        example: null,
      },
    },
  },
  ACCESS_ACTIVATED_FROM_PUBLIC_PETITION_LINK: {
    description: "A contact started and sent itself a parallel through a public parallel link",
    properties: {
      petitionAccessId: {
        description: "The ID of the parallel access",
        type: "string",
        example: toGlobalId("PetitionAccess", 10),
      },
    },
  },
  PETITION_MESSAGE_BOUNCED: {
    description: "A message email has bounced",
    properties: {
      petitionMessageId: {
        description: "The ID of the parallel message that caused the bounce",
        type: "string",
        example: toGlobalId("PetitionMessage", 10),
      },
    },
  },
  PETITION_REMINDER_BOUNCED: {
    description: "A reminder email has bounced",
    properties: {
      petitionReminderId: {
        description: "The ID of the parallel reminder that caused the bounce",
        type: "string",
        example: toGlobalId("PetitionReminder", 10),
      },
    },
  },
  RECIPIENT_SIGNED: {
    description: "A recipient has signed the document.",
    properties: {
      signer: _PetitionSigner,
      petitionSignatureRequestId: {
        type: "string",
        description: "The ID of the signature request",
        example: toGlobalId("PetitionSignatureRequest", 2),
      },
    },
  },
  PETITION_ANONYMIZED: {
    description: "The parallel has been anonymized.",
    properties: {},
  },
  REPLY_STATUS_CHANGED: {
    description: "The status of a reply has changed",
    properties: {
      status: {
        description: "The new status of the reply",
        enum: PetitionFieldReplyStatusValues,
        type: "string",
        example: "APPROVED",
      },
      petitionAccessId: {
        description:
          "The ID of the access. If set, the reply was updated by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
      userId: {
        description: "The ID of the user. If set, the reply was updated by this user.",
        type: ["string", "null"],
        example: null,
      },
      petitionFieldId: {
        description: "The ID of the field where the reply belongs",
        type: "string",
        example: toGlobalId("PetitionField", 1),
      },
      petitionFieldReplyId: {
        description: "The ID of the updated reply",
        type: "string",
        example: toGlobalId("PetitionFieldReply", 1),
      },
    },
  },
  PROFILE_ASSOCIATED: {
    description: "A user associated a profile with a parallel",
    properties: {
      userId: {
        description: "The ID of the user that associated the profile",
        type: "string",
        example: toGlobalId("User", 5),
      },
      profileId: {
        description: "The ID of the profile that was associated",
        type: "string",
        example: toGlobalId("Profile", 5),
      },
    },
  },
  PROFILE_DISASSOCIATED: {
    description: "A user or recipient disassociated a profile from a parallel",
    properties: {
      userId: {
        description:
          "The ID of the user that disassociated the profile, or null if a recipient disassociated it",
        type: ["string", "null"],
        example: toGlobalId("User", 5),
      },
      petitionAccessId: {
        description:
          "The ID of the access where the profile was disassociated. If set, the profile was disassociated by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
      profileId: {
        description: "The ID of the profile that was disassociated",
        type: "string",
        example: toGlobalId("Profile", 5),
      },
    },
  },
  PETITION_TAGGED: {
    description: "A user tagged a parallel",
    properties: {
      userId: {
        description: "The ID of the user that tagged the parallel",
        type: "string",
        example: toGlobalId("User", 5),
      },
      tagIds: {
        description: "The recently added tag ids",
        type: "array",
        items: { type: "string" },
        example: [toGlobalId("Tag", 1), toGlobalId("Tag", 2)],
      },
      tagNames: {
        description: "The label of the tags at the moment of tagging",
        type: "array",
        items: { type: "string" },
        example: ["KYC", "Risk"],
      },
    },
  },
  PETITION_UNTAGGED: {
    description: "A user untagged a parallel",
    properties: {
      userId: {
        description: "The ID of the user that untagged the parallel",
        type: "string",
        example: toGlobalId("User", 5),
      },
      tagIds: {
        description: "The recently removed tag ids",
        type: "array",
        items: { type: "string" },
        example: [toGlobalId("Tag", 1), toGlobalId("Tag", 2)],
      },
      tagNames: {
        description: "The label of the tags at the moment of untagging",
        type: "string",
        example: ["KYC", "Risk"],
      },
    },
  },
  CONTACTLESS_ACCESS_USED: {
    description: "A contactless access was used",
    properties: {
      petitionAccessId: {
        description: "The ID of the access",
        type: "string",
        example: toGlobalId("PetitionAccess", 10),
      },
      contactId: {
        description: "The ID of the contact that used the access",
        type: "string",
        example: toGlobalId("Contact", 10),
      },
    },
  },
  PETITION_APPROVAL_REQUEST_STEP_STARTED: {
    description: "An approval request step was started by an user",
    properties: {
      userId: {
        description:
          "The ID of the user that started the approval request step, or null if the step was started by the system.",
        type: ["string", "null"],
        example: toGlobalId("User", 5),
      },
      approvalRequestStepId: {
        description: "The ID of the approval request step",
        type: "string",
        example: toGlobalId("PetitionApprovalRequestStep", 5),
      },
    },
  },
  PETITION_APPROVAL_REQUEST_STEP_APPROVED: {
    description: "An approval request step was approved by one of the approver users",
    properties: {
      userId: {
        description: "The ID of the user that approved the approval request step",
        type: "string",
        example: toGlobalId("User", 5),
      },
      approvalRequestStepId: {
        description: "The ID of the approval request step",
        type: "string",
        example: toGlobalId("PetitionApprovalRequestStep", 5),
      },
    },
  },
  PETITION_APPROVAL_REQUEST_STEP_REJECTED: {
    description: "An approval request step was rejected by one of the approver users",
    properties: {
      userId: {
        description: "The ID of the user that rejected the approval request step",
        type: "string",
        example: toGlobalId("User", 5),
      },
      approvalRequestStepId: {
        description: "The ID of the approval request step",
        type: "string",
        example: toGlobalId("PetitionApprovalRequestStep", 5),
      },
    },
  },
  PETITION_APPROVAL_REQUEST_STEP_SKIPPED: {
    description: "An approval request step was skipped by one of the approver users",
    properties: {
      userId: {
        description: "The ID of the user that skipped the approval request step",
        type: "string",
        example: toGlobalId("User", 5),
      },
      approvalRequestStepId: {
        description: "The ID of the approval request step",
        type: "string",
        example: toGlobalId("PetitionApprovalRequestStep", 5),
      },
    },
  },
  PETITION_APPROVAL_REQUEST_STEP_REMINDER: {
    description: "A reminder was sent to every pending approver of an approval request step",
    properties: {
      userId: {
        description: "The ID of the user that sent the reminder",
        type: "string",
        example: toGlobalId("User", 5),
      },
      approvalRequestStepId: {
        description: "The ID of the approval request step",
        type: "string",
        example: toGlobalId("PetitionApprovalRequestStep", 5),
      },
    },
  },
  PETITION_APPROVAL_REQUEST_STEP_FINISHED: {
    description:
      "The approval request step was finished. This means that every required approver has either approved or rejected the step.",
    properties: {
      userId: {
        description: "The ID of the user that finished the approval request step",
        type: "string",
        example: toGlobalId("User", 5),
      },
      approvalRequestStepId: {
        description: "The ID of the approval request step",
        type: "string",
        example: toGlobalId("PetitionApprovalRequestStep", 5),
      },
    },
  },
  PETITION_APPROVAL_REQUEST_STEP_CANCELED: {
    description:
      "The approval request step was canceled by any user. This action will effectively cancel the whole approval request.",
    properties: {
      userId: {
        description: "The ID of the user that canceled the approval request step",
        type: "string",
        example: toGlobalId("User", 5),
      },
      approvalRequestStepId: {
        description: "The ID of the approval request step",
        type: "string",
        example: toGlobalId("PetitionApprovalRequestStep", 5),
      },
    },
  },
  PETITION_SCHEDULED_FOR_DELETION: {
    description: "A petition was scheduled for deletion",
    properties: {
      userId: {
        description: "The ID of the user that scheduled the petition for deletion",
        type: "string",
        example: toGlobalId("User", 5),
      },
    },
  },
  PETITION_RECOVERED_FROM_DELETION: {
    description: "A petition was recovered from deletion",
    properties: {
      userId: {
        description: "The ID of the user that recovered the petition from deletion",
        type: "string",
        example: toGlobalId("User", 5),
      },
    },
  },
} as Record<PetitionEventType, JsonSchema>;

const _PetitionEvent = {
  title: "PetitionEvent",
  type: "object",
  description: Object.entries(PetitionEventSchemas)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([event, data]) => {
      return `- \`${event}\`: ${data.description}`;
    })
    .join("\n"),
  oneOf: Object.entries(PetitionEventSchemas)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([event, data]) =>
        ({
          type: "object",
          title: `${pascalCase(event)}Event`,
          description: data.description, // should be visible after merging https://github.com/Redocly/redoc/pull/1497
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              description: "The ID of the parallel event",
              example: toGlobalId("PetitionEvent", 1),
            },
            type: {
              type: "string",
              const: event as PetitionEventType,
              description: `\`${event}\``,
              example: event,
            },
            petitionId: {
              type: "string",
              description: "The ID of the parallel where this event occurred",
              example: toGlobalId("Petition", 42),
            },
            data: {
              type: "object",
              description: "The payload of the event",
              additionalProperties: false,
              required: data.required ?? Object.keys(data.properties!),
              properties: data.properties! as any,
            } as unknown as { type: "object" },
            createdAt: {
              description: "Creation date of the event",
              type: "string",
              format: "date-time",
              example: new Date(2020, 2, 15).toISOString(),
            },
          },
        }) as const,
    ),
} as const;

export const PetitionEvent = _PetitionEvent as JsonSchemaFor<{
  id: string;
  type: PetitionEventType;
  petitionId: string;
  data: any;
  createdAt: string;
}>;

const ProfileEventSchemas = {
  PETITION_ASSOCIATED: {
    description: "A parallel was associated with the profile",
    properties: {
      petitionId: {
        description: "The ID of the parallel",
        type: "string",
        example: toGlobalId("Petition", 1),
      },
      userId: {
        description: "The ID of the user that associated the parallel",
        type: "string",
        example: toGlobalId("User", 1),
      },
    },
  },
  PETITION_DISASSOCIATED: {
    description: "A parallel was disassociated from the profile",
    properties: {
      petitionId: {
        description: "The ID of the parallel",
        type: "string",
        example: toGlobalId("Petition", 1),
      },
      userId: {
        description:
          "The ID of the user that disassociated the parallel, or null if a recipient disassociated it",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      petitionAccessId: {
        description:
          "The ID of the access where the parallel was disassociated. If set, the parallel was disassociated by the recipient linked to this access",
        type: ["string", "null"],
        example: toGlobalId("PetitionAccess", 1),
      },
    },
  },
  PROFILE_ANONYMIZED: {
    description: "The profile has been anonymized.",
    properties: {},
  },
  PROFILE_CLOSED: {
    description: "The profile has been closed.",
    properties: {
      userId: {
        description: "The ID of the user that closed the profile",
        type: "string",
        example: toGlobalId("User", 1),
      },
    },
  },
  PROFILE_CREATED: {
    description:
      "The profile has been created. A profile can be created either manually by a user or automatically by an integration.",
    properties: {
      userId: {
        description: "The ID of the user that created the profile",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      integrationId: {
        description: "The ID of the integration that created the profile",
        type: ["string", "null"],
        example: toGlobalId("OrgIntegration", 1),
      },
    },
  },
  PROFILE_FIELD_EXPIRY_UPDATED: {
    description: "The expiry date of a field has been updated.",
    properties: {
      userId: {
        type: ["string", "null"],
        description:
          "The ID of the user that updated the expiry. If null, expiry was updated automatically by monitoring rules.",
        example: toGlobalId("User", 1),
      },
      integrationId: {
        description: "The ID of the integration where the new value was obtained.",
        type: ["string", "null"],
        example: toGlobalId("OrgIntegration", 1),
      },
      profileTypeFieldId: {
        description: "The ID of the profile field",
        type: "string",
        example: toGlobalId("ProfileTypeField", 1),
      },
      expiryDate: {
        description: "The new expiry date",
        type: ["string", "null"],
        format: "date",
        example: new Date(2020, 2, 15).toISOString(),
      },
      alias: {
        description: "The alias of the profile field",
        type: "string",
        example: "passport",
      },
    },
  },
  PROFILE_FIELD_FILE_ADDED: {
    description: "A file has been added to a field.",
    properties: {
      userId: {
        description: "The ID of the user that added the file",
        type: "string",
        example: toGlobalId("User", 1),
      },
      profileTypeFieldId: {
        description: "The ID of the profile field",
        type: "string",
        example: toGlobalId("ProfileTypeField", 1),
      },
      profileFieldFileId: {
        description: "The ID of the file",
        type: "string",
        example: toGlobalId("ProfileFieldFile", 1),
      },
      alias: {
        description: "The alias of the profile field",
        type: "string",
        example: "passport",
      },
    },
  },
  PROFILE_FIELD_FILE_REMOVED: {
    description: "A file has been removed from a field.",
    properties: {
      userId: {
        description: "The ID of the user that removed the file",
        type: "string",
        example: toGlobalId("User", 1),
      },
      profileTypeFieldId: {
        description: "The ID of the profile field",
        type: "string",
        example: toGlobalId("ProfileTypeField", 1),
      },
      profileFieldFileId: {
        description: "The ID of the file",
        type: "string",
        example: toGlobalId("ProfileFieldFile", 1),
      },
      alias: {
        description: "The alias of the profile field",
        type: "string",
        example: "passport",
      },
    },
  },
  PROFILE_FIELD_VALUE_UPDATED: {
    description:
      "The value of a field has been updated. A value can be updated either manually by a user or automatically by monitoring rules",
    properties: {
      userId: {
        type: ["string", "null"],
        description:
          "The ID of the user that updated the value. If null, value was updated automatically by monitoring rules.",
        example: toGlobalId("User", 1),
      },
      integrationId: {
        description: "The ID of the integration where the new value was obtained.",
        type: ["string", "null"],
        example: toGlobalId("OrgIntegration", 1),
      },
      profileTypeFieldId: {
        description: "The ID of the profile field",
        type: "string",
        example: toGlobalId("ProfileTypeField", 1),
      },
      alias: {
        description: "The alias of the profile field",
        type: "string",
        example: "passport_number",
      },
    },
  },
  PROFILE_REOPENED: {
    description: "The profile has been reopened.",
    properties: {
      userId: {
        description: "The ID of the user that reopened the profile",
        type: "string",
        example: toGlobalId("User", 1),
      },
    },
  },
  PROFILE_SCHEDULED_FOR_DELETION: {
    description: "The profile has been scheduled for deletion.",
    properties: {
      userId: {
        description: "The ID of the user that scheduled the profile for deletion",
        type: "string",
        example: toGlobalId("User", 1),
      },
    },
  },
  PROFILE_UPDATED: {
    description:
      "A property on the profile has been updated. This event will arrive after `PROFILE_FIELD_EXPIRY_UPDATED`, `PROFILE_FIELD_FILE_ADDED`, `PROFILE_FIELD_FILE_REMOVED` and `PROFILE_FIELD_VALUE_UPDATED`, providing a single event for all of those updates.",
    properties: {
      userId: {
        type: ["string", "null"],
        description:
          "The ID of the user that updated the property. Null means the property was updated by monitoring rules.",
        example: toGlobalId("User", 1),
      },
      integrationId: {
        description: "The ID of the integration where the new value was obtained.",
        type: ["string", "null"],
        example: toGlobalId("OrgIntegration", 1),
      },
      profileTypeFieldIds: {
        description: "The IDs of the profile fields that were updated",
        type: ["array", "null"],
        items: {
          type: "string",
          example: toGlobalId("ProfileTypeField", 1),
        },
      },
    },
  },
  PROFILE_RELATIONSHIP_CREATED: {
    description: "A profile has been associated with another profile through a relationship",
    properties: {
      userId: {
        description: "The ID of the user that created the relationship",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      integrationId: {
        description: "The ID of the integration where the new relationship was obtained.",
        type: ["string", "null"],
        example: toGlobalId("OrgIntegration", 1),
      },
      profileRelationshipId: {
        description: "The ID of the relationship",
        type: "string",
        example: toGlobalId("ProfileRelationship", 1),
      },
      profileRelationshipTypeId: {
        description: "The ID of the relationship type",
        type: "string",
        example: toGlobalId("ProfileRelationshipType", 1),
      },
      relationshipAlias: {
        description: "The alias of the relationship type",
        type: ["string", "null"],
        example: "parent",
      },
    },
  },
  PROFILE_RELATIONSHIP_REMOVED: {
    description: "A profile relationship has been removed",
    properties: {
      userId: {
        description:
          "The ID of the user that created the relationship. Null if the relationship was removed automatically by compliance rules.",
        type: ["string", "null"],
        example: toGlobalId("User", 1),
      },
      integrationId: {
        description: "The ID of the integration where the relationship was removed.",
        type: ["string", "null"],
        example: toGlobalId("OrgIntegration", 1),
      },
      profileRelationshipId: {
        description: "The ID of the relationship",
        type: "string",
        example: toGlobalId("ProfileRelationship", 1),
      },
      profileRelationshipTypeId: {
        description: "The ID of the relationship type",
        type: "string",
        example: toGlobalId("ProfileRelationshipType", 1),
      },
      relationshipAlias: {
        description: "The alias of the relationship type",
        type: ["string", "null"],
        example: "parent",
      },
      reason: {
        type: "string",
        description: "The reason why the relationship was removed",
        example: "PROFILE_DELETED",
      },
    },
  },
  PROFILE_FIELD_VALUE_MONITORED: {
    description: "A property on the profile was monitored for changes",
    properties: {
      profileTypeFieldId: {
        description: "The ID of the profile field",
        type: "string",
        example: toGlobalId("ProfileTypeField", 1),
      },
    },
  },
} as Record<ProfileEventType, JsonSchema>;

const _ProfileEvent = {
  title: "ProfileEvent",
  type: "object",
  description: Object.entries(ProfileEventSchemas)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([event, data]) => {
      return `- \`${event}\`: ${data.description}`;
    })
    .join("\n"),
  oneOf: Object.entries(ProfileEventSchemas)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([event, data]) =>
        ({
          type: "object",
          title: `${pascalCase(event)}Event`,
          description: data.description, // should be visible after merging https://github.com/Redocly/redoc/pull/1497
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              description: "The ID of the profile event",
              example: toGlobalId("ProfileEvent", 1),
            },
            type: {
              type: "string",
              const: event as ProfileEventType,
              description: `\`${event}\``,
              example: event,
            },
            profileId: {
              type: "string",
              description: "The ID of the profile where this event occurred",
              example: toGlobalId("Profile", 42),
            },
            data: {
              type: "object",
              description: "The payload of the event",
              additionalProperties: false,
              required: data.required ?? Object.keys(data.properties!),
              properties: data.properties! as any,
            } as unknown as { type: "object" },
            createdAt: {
              description: "Creation date of the event",
              type: "string",
              format: "date-time",
              example: new Date(2020, 2, 15).toISOString(),
            },
          },
        }) as const,
    ),
} as const;

export const ProfileEvent = _ProfileEvent as JsonSchemaFor<{
  id: string;
  type: ProfileEventType;
  profileId: string;
  data: any;
  createdAt: string;
}>;
