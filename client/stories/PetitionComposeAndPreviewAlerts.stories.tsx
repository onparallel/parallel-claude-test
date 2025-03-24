import { Box } from "@chakra-ui/react";
import { PetitionComposeAndPreviewAlerts } from "@parallel/components/petition-common/alerts/PetitionComposeAndPreviewAlerts";
import {
  PetitionApprovalRequestStatus,
  PetitionSignatureStatusFilter,
  PetitionStatus,
} from "@parallel/graphql/__types";
import { Meta, StoryObj } from "@storybook/react";

export default {
  title: "Petitions/PetitionComposeAndPreviewAlerts",
  component: PetitionComposeAndPreviewAlerts,
  parameters: {
    layout: "centered",
    actions: { argTypesRegex: "^on.*" },
  },
  decorators: [
    (story) => (
      <Box
        maxW="1200px"
        minW="300px"
        w="90vw"
        mx="auto"
        minH="82px"
        p={4}
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
      >
        {story()}
      </Box>
    ),
  ],
  // Default arguments for all stories
  args: {
    petitionStatus: "DRAFT" as PetitionStatus,
    signatureStatus: "NOT_STARTED" as PetitionSignatureStatusFilter,
    approvalsStatus: "NO_APPROVAL" as PetitionApprovalRequestStatus,
    signatureAfterApprovals: false,
    hasNotStartedApprovals: false,
    onStartSignature: () => {},
    onStartApprovals: () => {},
    onCancelApprovals: () => {},
    onClosePetition: () => {},
    onCancelSignature: () => {},
  },
  argTypes: {
    petitionStatus: {
      control: {
        type: "select",
        options: ["DRAFT", "PENDING", "COMPLETED", "CLOSED"],
      },
      description: "Petition status",
      table: {
        category: "Status",
      },
    },
    signatureStatus: {
      control: {
        type: "select",
        options: [
          "NO_SIGNATURE",
          "NOT_STARTED",
          "PENDING_START",
          "PROCESSING",
          "COMPLETED",
          "CANCELLED",
        ],
      },
      description: "Signature status",
      table: {
        category: "Status",
      },
    },
    approvalsStatus: {
      control: {
        type: "select",
        options: [null, "NOT_STARTED", "PENDING", "APPROVED", "REJECTED"],
      },
      description: "Approvals status",
      table: {
        category: "Status",
      },
    },
    signatureAfterApprovals: {
      control: "boolean",
      description: "If signature should occur after approvals",
      table: {
        category: "Configuration",
      },
    },
    hasNotStartedApprovals: {
      control: "boolean",
      description: "If there are pending approvals to start",
      table: {
        category: "Configuration",
      },
    },
    onStartSignature: {
      action: "startSignature",
      description: "Function to start the signature process",
      table: {
        category: "Actions",
      },
    },
    onStartApprovals: {
      action: "startApprovals",
      description: "Function to start the approvals process",
      table: {
        category: "Actions",
      },
    },
    onCancelApprovals: {
      action: "cancelApprovals",
      description: "Function to cancel the approvals process",
      table: {
        category: "Actions",
      },
    },
    onClosePetition: {
      action: "closePetition",
      description: "Function to close the petition",
      table: {
        category: "Actions",
      },
    },
    onCancelSignature: {
      action: "cancelSignature",
      description: "Function to cancel the signature process",
      table: {
        category: "Actions",
      },
    },
  },
} as Meta<typeof PetitionComposeAndPreviewAlerts>;

type Story = StoryObj<typeof PetitionComposeAndPreviewAlerts>;

// Basic states without alerts
export const draftNoAlerts: Story = {
  name: "DRAFT - No Alerts",
  args: {
    petitionStatus: "DRAFT",
    signatureStatus: "NOT_STARTED",
  },
};

export const pendingNoAlerts: Story = {
  name: "PENDING - No Alerts",
  args: {
    petitionStatus: "PENDING",
    signatureStatus: "NOT_STARTED",
  },
};

// -- COMPLETED PETITION STATES --

// Completed ready for signature
export const completedPendingSignature: Story = {
  name: "COMPLETED - Pending Signature",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",

    onStartSignature: () => alert("Start signature"),
  },
};

// Completed with signature in process
export const completedSignatureInProgress: Story = {
  name: "COMPLETED - Signature in Progress",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "PROCESSING",
  },
};

// Completed with signature pending to start
export const completedSignaturePendingToStart: Story = {
  name: "COMPLETED - Signature Pending to Start",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "PENDING_START",

    onStartSignature: () => alert("Start signature"),
  },
};

// Completed with signature cancelled
export const completedSignatureCancelled: Story = {
  name: "COMPLETED - Signature Cancelled",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "CANCELLED",
  },
};

// Completed with signature completed
export const completedSignatureCompleted: Story = {
  name: "COMPLETED - Signature Completed",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "COMPLETED",
  },
};

// -- APPROVAL STATES --

// Completed with pending approvals
export const completedPendingApprovals: Story = {
  name: "COMPLETED - Pending Approvals",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",
    approvalsStatus: "PENDING",
    onCancelApprovals: () => alert("Cancel approvals"),
  },
};

export const completedPendingApprovalsWithApprovalsToStart: Story = {
  name: "COMPLETED - Pending Approvals with Approvals to Start",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",
    approvalsStatus: "PENDING",
    hasNotStartedApprovals: true,
    onCancelApprovals: () => alert("Cancel approvals"),
    onStartApprovals: () => alert("Start approvals"),
  },
};

// Completed with rejected approvals
export const completedRejectedApprovals: Story = {
  name: "COMPLETED - Rejected Approvals",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",
    approvalsStatus: "REJECTED",
    onClosePetition: () => alert("Close petition"),
    onCancelApprovals: () => alert("Restart approvals"),
  },
};

export const completedApprovedApprovalsNoSignature: Story = {
  name: "COMPLETED - Approved Approvals - No signature",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NO_SIGNATURE",
    approvalsStatus: "APPROVED",
  },
};

export const completedApprovedApprovalsSignatureNotStarted: Story = {
  name: "COMPLETED - Approved Approvals - Signature not started",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",
    approvalsStatus: "APPROVED",
  },
};

export const completedApprovedApprovalsSignatureCompleted: Story = {
  name: "COMPLETED - Approved Approvals - Signature completed",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "COMPLETED",
    approvalsStatus: "APPROVED",
    signatureAfterApprovals: true,
  },
};

// -- COMPLEX COMBINATIONS --

// Completed with pending signature and approved approvals
export const completedPendingSignatureApprovedApprovals: Story = {
  name: "COMPLETED - Approved Approvals - Signature After Approvals",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",
    approvalsStatus: "APPROVED",
    signatureAfterApprovals: true,
    onStartSignature: () => alert("Start signature after approvals"),
  },
};

// Completed with signature in process and approved approvals
export const completedSignatureInProgressApprovedApprovals: Story = {
  name: "COMPLETED - Signature In Progress - Approved Approvals",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "PROCESSING",
    approvalsStatus: "APPROVED",
    signatureAfterApprovals: true,
  },
};

// -- CLOSED STATES --

// Closed
export const closedNoSignatureNoApprovals: Story = {
  name: "CLOSED",
  args: {
    petitionStatus: "CLOSED",
    signatureStatus: "NO_SIGNATURE",
    approvalsStatus: "NO_APPROVAL",
  },
};
