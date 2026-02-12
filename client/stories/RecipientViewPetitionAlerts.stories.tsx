import {
  PetitionApprovalRequestStatus,
  PetitionSignatureStatusFilter,
  PetitionStatus,
  RecipientViewPetitionAlerts_PublicSignatureConfigFragment,
  SignatureConfigSigningMode,
  Tone,
} from "@parallel/graphql/__types";
import { Box } from "@parallel/components/ui";
import { Meta, StoryObj } from "@storybook/react";
import { RecipientViewPetitionAlerts } from "../components/recipient-view/alerts/RecipientViewPetitionAlerts";

const SEQUENTIAL_SIGNATURE_CONFIG_WITH_ADDITIONAL_SIGNERS = {
  signingMode: "SEQUENTIAL" as SignatureConfigSigningMode,
  signers: [
    {
      firstName: "John",
      lastName: "Smith",
      fullName: "John Smith",
      email: "john.smith@example.com",
    },
  ],
  additionalSigners: [
    {
      firstName: "Mary",
      lastName: "Johnson",
      fullName: "Mary Johnson",
      email: "mary.johnson@example.com",
    },
  ],
} as RecipientViewPetitionAlerts_PublicSignatureConfigFragment;

const PARALLEL_SIGNATURE_CONFIG_WITH_ADDITIONAL_SIGNERS = {
  signingMode: "PARALLEL" as SignatureConfigSigningMode,
  signers: [
    {
      firstName: "John",
      lastName: "Smith",
      fullName: "John Smith",
      email: "john.smith@example.com",
    },
  ],
  additionalSigners: [
    {
      firstName: "Mary",
      lastName: "Johnson",
      fullName: "Mary Johnson",
      email: "mary.johnson@example.com",
    },
  ],
} as RecipientViewPetitionAlerts_PublicSignatureConfigFragment;

const SEQUENTIAL_SIGNATURE_CONFIG_WITH_ONE_SIGNER = {
  signingMode: "SEQUENTIAL" as SignatureConfigSigningMode,
  signers: [
    {
      firstName: "John",
      lastName: "Smith",
      fullName: "John Smith",
      email: "john.smith@example.com",
    },
  ],
} as RecipientViewPetitionAlerts_PublicSignatureConfigFragment;

const PARALLEL_SIGNATURE_CONFIG_WITH_ONE_SIGNER = {
  signingMode: "PARALLEL" as SignatureConfigSigningMode,
  signers: [
    {
      firstName: "John",
      lastName: "Smith",
      fullName: "John Smith",
      email: "john.smith@example.com",
    },
  ],
} as RecipientViewPetitionAlerts_PublicSignatureConfigFragment;

const SEQUENTIAL_SIGNATURE_CONFIG_WITH_MULTIPLE_SIGNERS = {
  signingMode: "SEQUENTIAL" as SignatureConfigSigningMode,
  signers: [
    {
      firstName: "John",
      lastName: "Smith",
      fullName: "John Smith",
      email: "john.smith@example.com",
    },
    {
      firstName: "Mary",
      lastName: "Johnson",
      fullName: "Mary Johnson",
      email: "mary.johnson@example.com",
    },
  ],
} as RecipientViewPetitionAlerts_PublicSignatureConfigFragment;

const PARALLEL_SIGNATURE_CONFIG_WITH_MULTIPLE_SIGNERS = {
  signingMode: "PARALLEL" as SignatureConfigSigningMode,
  signers: [
    {
      firstName: "John",
      lastName: "Smith",
      fullName: "John Smith",
      email: "john.smith@example.com",
    },
    {
      firstName: "Mary",
      lastName: "Johnson",
      fullName: "Mary Johnson",
      email: "mary.johnson@example.com",
    },
  ],
} as RecipientViewPetitionAlerts_PublicSignatureConfigFragment;

const signatureConfigs = {
  SEQUENTIAL_SIGNATURE_CONFIG_WITH_ADDITIONAL_SIGNERS,
  PARALLEL_SIGNATURE_CONFIG_WITH_ADDITIONAL_SIGNERS,
  SEQUENTIAL_SIGNATURE_CONFIG_WITH_ONE_SIGNER,
  PARALLEL_SIGNATURE_CONFIG_WITH_ONE_SIGNER,
  SEQUENTIAL_SIGNATURE_CONFIG_WITH_MULTIPLE_SIGNERS,
  PARALLEL_SIGNATURE_CONFIG_WITH_MULTIPLE_SIGNERS,
};

const DEFAULT_SIGNATURE_CONFIG = signatureConfigs.SEQUENTIAL_SIGNATURE_CONFIG_WITH_ONE_SIGNER;

export default {
  title: "Recipient/RecipientViewPetitionAlerts",
  component: RecipientViewPetitionAlerts,
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
  args: {
    tone: "INFORMAL" as Tone,
    currentApprovalRequestStatus: "NOT_STARTED" as PetitionApprovalRequestStatus,
    petitionStatus: "COMPLETED" as PetitionStatus,
    signatureStatus: "NOT_STARTED" as PetitionSignatureStatusFilter,
    signatureConfig: DEFAULT_SIGNATURE_CONFIG,
    granterFullName: "John Smith",
    onCheckSignatureStatus: () => {},
    onContact: () => {},
  },
  argTypes: {
    tone: {
      control: {
        type: "select",
        options: ["FORMAL", "INFORMAL"],
      },
      defaultValue: "INFORMAL" as Tone,
      description: "Tone of the message, formal or informal",
      table: {
        category: "Style",
      },
    },
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
    currentApprovalRequestStatus: {
      control: {
        type: "select",
        options: ["NOT_STARTED", "PENDING", "APPROVED", "REJECTED"],
      },
      description: "Approval status",
      table: {
        category: "Status",
      },
    },
    granterFullName: {
      control: "text",
      description: "Full name of the granter",
      table: {
        category: "Data",
      },
    },
    signatureConfig: {
      control: "object",
      defaultValue: DEFAULT_SIGNATURE_CONFIG,
      description: "Signature configuration",
      table: {
        category: "Configuration",
      },
    },
    onCheckSignatureStatus: {
      action: "checkSignatureStatus",
      description: "Function to check the signature status",
      table: {
        category: "Actions",
      },
    },
    onContact: {
      action: "contact",
      description: "Function to contact",
      table: {
        category: "Actions",
      },
    },
  },
} as Meta<typeof RecipientViewPetitionAlerts>;

type Story = StoryObj<typeof RecipientViewPetitionAlerts>;

// ========================================================================
// 1. DIFFERENT PETITION STATUS WITHOUT APPROVALS OR SIGNATURES
// ========================================================================

export const draftNoApprovalsNoSignature: Story = {
  name: "DRAFT - No Approvals - No Signature",
  args: {
    petitionStatus: "DRAFT",
    signatureStatus: "NO_SIGNATURE",
    currentApprovalRequestStatus: "NO_APPROVAL",
  },
};

export const pendingNoApprovalsNoSignature: Story = {
  name: "PENDING - No Approvals - No Signature",
  args: {
    petitionStatus: "PENDING",
    signatureStatus: "NO_SIGNATURE",
    currentApprovalRequestStatus: "NO_APPROVAL",
  },
};

export const closedNoApprovalsNoSignature: Story = {
  name: "CLOSED - No Approvals - No Signature",
  args: {
    petitionStatus: "CLOSED",
    signatureStatus: "NO_SIGNATURE",
    currentApprovalRequestStatus: "NO_APPROVAL",
  },
};

// ========================================================================
// 2. COMPLETED PETITION STATUS WITH DIFFERENT STATES
// ========================================================================

// 2.1 Different signatureStatus with currentApprovalRequestStatus: "NO_APPROVAL"
// ========================================================================

export const completedNoApprovalsNoSignature: Story = {
  name: "COMPLETED - No Approvals - No Signature",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NO_SIGNATURE",
    currentApprovalRequestStatus: "NO_APPROVAL",
  },
};

export const completedNoApprovalsSignatureNotStarted: Story = {
  name: "COMPLETED - No Approvals - Signature Not Started",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",
    currentApprovalRequestStatus: "NO_APPROVAL",
  },
};

export const completedNoApprovalsSignaturePendingStart: Story = {
  name: "COMPLETED - No Approvals - Signature Pending to Start",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "PENDING_START",
    currentApprovalRequestStatus: "NO_APPROVAL",
  },
};

export const completedNoApprovalsSignatureProcessing: Story = {
  name: "COMPLETED - No Approvals - Signature In Progress",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "PROCESSING",
    currentApprovalRequestStatus: "NO_APPROVAL",
    signatureConfig: SEQUENTIAL_SIGNATURE_CONFIG_WITH_MULTIPLE_SIGNERS,
  },
};

export const completedNoApprovalsSignatureCompleted: Story = {
  name: "COMPLETED - No Approvals - Signature Completed",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "COMPLETED",
    currentApprovalRequestStatus: "NO_APPROVAL",
    onCheckSignatureStatus: () => alert("Check signature status"),
  },
};

export const completedNoApprovalsSignatureCancelled: Story = {
  name: "COMPLETED - No Approvals - Signature Cancelled",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "CANCELLED",
    currentApprovalRequestStatus: "NO_APPROVAL",
    onCheckSignatureStatus: () => alert("Check signature status"),
  },
};

// 2.2 Different currentApprovalRequestStatus with signatureStatus: "NO_SIGNATURE"
// ========================================================================

export const completedNoSignatureApprovalsNotStarted: Story = {
  name: "COMPLETED - No Signature - Approvals Not Started",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NO_SIGNATURE",
    currentApprovalRequestStatus: "NOT_STARTED",
  },
};

export const completedNoSignaturePendingApprovals: Story = {
  name: "COMPLETED - No Signature - Pending Approvals",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NO_SIGNATURE",
    currentApprovalRequestStatus: "PENDING",
    tone: "FORMAL",
  },
};

export const completedNoSignatureApprovedApprovals: Story = {
  name: "COMPLETED - No Signature - Approved Approvals",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NO_SIGNATURE",
    currentApprovalRequestStatus: "APPROVED",
    signatureConfig: null,
    onCheckSignatureStatus: () => alert("Check signature status"),
  },
};

export const completedNoSignatureRejectedApprovals: Story = {
  name: "COMPLETED - No Signature - Rejected Approvals",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NO_SIGNATURE",
    currentApprovalRequestStatus: "REJECTED",
  },
};

// 2.3 Other combinations of currentApprovalRequestStatus and signatureStatus
// ========================================================================

export const completedSignatureNotStartedApprovalsNotStarted: Story = {
  name: "COMPLETED - Signature Not Started - Approvals Not Started",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",
    currentApprovalRequestStatus: "NOT_STARTED",
  },
};

export const completedSignatureProcessingApprovalsApproved: Story = {
  name: "COMPLETED - Signature In Progress - Approvals Approved",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "PROCESSING",
    currentApprovalRequestStatus: "APPROVED",
    signatureConfig: SEQUENTIAL_SIGNATURE_CONFIG_WITH_MULTIPLE_SIGNERS,
  },
};

export const completedSignatureCompletedApprovalsApproved: Story = {
  name: "COMPLETED - Signature Completed - Approvals Approved",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "COMPLETED",
    currentApprovalRequestStatus: "APPROVED",
    onCheckSignatureStatus: () => alert("Check signature status"),
  },
};

export const completedSignatureCancelledApprovalsApproved: Story = {
  name: "COMPLETED - Signature Cancelled - Approvals Approved",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "CANCELLED",
    currentApprovalRequestStatus: "APPROVED",
    onCheckSignatureStatus: () => alert("Check signature status"),
  },
};

export const completedSignatureNotStartedApprovalsPending: Story = {
  name: "COMPLETED - Signature Not Started - Approvals Pending",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",
    currentApprovalRequestStatus: "PENDING",
  },
};

export const completedSignatureNotStartedApprovalsRejected: Story = {
  name: "COMPLETED - Signature Not Started - Approvals Rejected",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "NOT_STARTED",
    currentApprovalRequestStatus: "REJECTED",
  },
};

// ========================================================================
// 3. OTHER STATES AND CONFIGURATIONS
// ========================================================================

// 3.1 Different Petition Status with Approvals or Signatures
// ========================================================================

export const pendingSignatureNotStartedApprovalsPending: Story = {
  name: "PENDING - Signature Not Started - Approvals Pending",
  args: {
    petitionStatus: "PENDING",
    signatureStatus: "NOT_STARTED",
    currentApprovalRequestStatus: "PENDING",
    tone: "FORMAL",
  },
};

export const draftSignatureNotStartedApprovalsPending: Story = {
  name: "DRAFT - Signature Not Started - Approvals Pending",
  args: {
    petitionStatus: "DRAFT",
    signatureStatus: "NOT_STARTED",
    currentApprovalRequestStatus: "PENDING",
    tone: "FORMAL",
  },
};

export const closedSignatureCompletedApprovalsApproved: Story = {
  name: "CLOSED - Signature Completed - Approvals Approved",
  args: {
    petitionStatus: "CLOSED",
    signatureStatus: "COMPLETED",
    currentApprovalRequestStatus: "APPROVED",
    onContact: () => alert("Contact the sender"),
  },
};

// 3.2 Tone Variations
// ========================================================================

export const completedSignatureCompletedApprovalsFormalTone: Story = {
  name: "COMPLETED - All Completed - Formal Tone",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "COMPLETED",
    currentApprovalRequestStatus: "APPROVED",
    tone: "FORMAL",
    onCheckSignatureStatus: () => alert("Check signature status"),
  },
};

export const completedSignatureCompletedApprovalsInformalTone: Story = {
  name: "COMPLETED - All Completed - Informal Tone",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "COMPLETED",
    currentApprovalRequestStatus: "APPROVED",
    tone: "INFORMAL",
    onCheckSignatureStatus: () => alert("Check signature status"),
  },
};

// 3.3 Signature Configuration Variations
// ========================================================================

export const completedSignatureProcessingParallelMode: Story = {
  name: "COMPLETED - Signature In Progress - Parallel Mode",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "PROCESSING",
    currentApprovalRequestStatus: "NO_APPROVAL",
    signatureConfig: PARALLEL_SIGNATURE_CONFIG_WITH_MULTIPLE_SIGNERS,
  },
};

export const completedSignatureProcessingSequentialMode: Story = {
  name: "COMPLETED - Signature In Progress - Sequential Mode",
  args: {
    petitionStatus: "COMPLETED",
    signatureStatus: "PROCESSING",
    currentApprovalRequestStatus: "NO_APPROVAL",
    signatureConfig: SEQUENTIAL_SIGNATURE_CONFIG_WITH_MULTIPLE_SIGNERS,
  },
};
