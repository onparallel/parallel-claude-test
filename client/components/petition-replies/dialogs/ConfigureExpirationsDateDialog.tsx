import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import { FieldDateIcon } from "@parallel/chakra/icons";
import { DateInput } from "@parallel/components/common/DateInput";
import { LocalizableUserTextRender } from "@parallel/components/common/LocalizableUserTextRender";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { SimpleFileButton } from "@parallel/components/common/SimpleFileButton";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import {
  ArchiveFieldGroupReplyIntoProfileExpirationInput,
  useConfigureExpirationsDateDialog_profileDocument,
  useConfigureExpirationsDateDialog_ProfileFieldPropertyFragment,
  useConfigureExpirationsDateDialog_ProfileFragment,
} from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { UpdateProfileOnClose } from "@parallel/utils/fieldOptions";
import { useBrowserMetadata } from "@parallel/utils/useBrowserMetadata";
import { useDownloadProfileFieldFile } from "@parallel/utils/useDownloadProfileFieldFile";
import { useHasRemovePreviewFiles } from "@parallel/utils/useHasRemovePreviewFiles";
import { isPast, sub } from "date-fns";
import { useEffect, useState } from "react";

import { Button, Text } from "@parallel/components/ui";
import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { FormattedMessage, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";

type ConfigureExpirationsDateDialogSteps = {
  LOADING: {
    profileId: string;
    pendingExpirations: UpdateProfileOnClose[];
  };
  RESOLVE_EXPIRATIONS: {
    profile: useConfigureExpirationsDateDialog_ProfileFragment;
    pendingExpirations: UpdateProfileOnClose[];
  };
};

interface ConfigureExpirationsDateDialogData {
  expirations: {
    profileTypeFieldId: string;
    expiryDate: string | null;
  }[];
}

function ConfigureExpirationsDateLoadingDialog({
  profileId,
  pendingExpirations,
  onStep,
  ...props
}: WizardStepDialogProps<ConfigureExpirationsDateDialogSteps, "LOADING", void>) {
  const { data, loading } = useQuery(useConfigureExpirationsDateDialog_profileDocument, {
    variables: { profileId },
  });

  useEffect(() => {
    if (
      !loading &&
      isNonNullish(data) &&
      isNonNullish(data.profile) &&
      data.profile.__typename === "Profile"
    ) {
      onStep("RESOLVE_EXPIRATIONS", {
        profile: data.profile,
        pendingExpirations,
      });
    }
  }, [loading, data, onStep, pendingExpirations]);
  return (
    <ConfirmDialog
      size="lg"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      header={
        <FormattedMessage
          id="component.configure-expirations-date-dialog.header"
          defaultMessage="Configure expirations date"
        />
      }
      body={
        <Center padding={8} minHeight="200px">
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="primary.500"
            size="xl"
          />
        </Center>
      }
      confirm={<></>}
      cancel={
        <Button disabled>
          <FormattedMessage id="generic.close" defaultMessage="Close" />
        </Button>
      }
      {...props}
    />
  );
}

function ConfigureExpirationsDateDialog({
  profile,
  pendingExpirations,
  ...props
}: WizardStepDialogProps<
  ConfigureExpirationsDateDialogSteps,
  "RESOLVE_EXPIRATIONS",
  ArchiveFieldGroupReplyIntoProfileExpirationInput[]
>) {
  const form = useForm<ConfigureExpirationsDateDialogData>({
    mode: "onChange",
    defaultValues: {
      expirations: pendingExpirations.map(({ profileTypeFieldId }) => ({
        profileTypeFieldId,
        expiryDate: null,
      })),
    },
  });

  const { control, handleSubmit, setFocus } = form;

  const { fields } = useFieldArray({
    name: "expirations",
    control,
  });

  useEffect(() => {
    setTimeout(() => setFocus(`expirations.0.expiryDate`), 0);
  }, [fields.length]);

  return (
    <ConfirmDialog
      size="lg"
      closeOnEsc={true}
      closeOnOverlayClick={false}
      hasCloseButton={true}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            props.onResolve(data.expirations);
          }),
        },
      }}
      {...props}
      header={
        <FormattedMessage
          id="component.configure-expirations-date-dialog.header"
          defaultMessage="Configure expirations date"
        />
      }
      body={
        <Stack spacing={4}>
          <Text>
            <FormattedMessage
              id="component.configure-expirations-date-dialog.body"
              defaultMessage="Adds the expiration date of the following <b>{profileName}</b> properties:"
              values={{
                profileName: <ProfileReference profile={profile} />,
              }}
            />
          </Text>
          <Stack spacing={4}>
            <FormProvider {...form}>
              {fields.map((field, index) => {
                const property = profile.properties.find(
                  (property) => property.field.id === field.profileTypeFieldId,
                );
                if (isNullish(property)) {
                  return null;
                }
                return (
                  <ExpirationDateRow
                    key={field.id}
                    index={index}
                    profileId={profile.id}
                    property={property}
                  />
                );
              })}
            </FormProvider>
          </Stack>
        </Stack>
      }
      cancel={
        <Button onClick={() => props.onReject()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={
        <Button colorPalette="primary" type="submit">
          <FormattedMessage id="generic.continue" defaultMessage="Continue" />
        </Button>
      }
    />
  );
}

function ExpirationDateRow({
  index,
  profileId,
  property,
}: {
  index: number;
  profileId: string;
  property: useConfigureExpirationsDateDialog_ProfileFieldPropertyFragment;
}) {
  const intl = useIntl();

  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<ConfigureExpirationsDateDialogData>();

  const { browserName } = useBrowserMetadata();
  const downloadProfileFieldFile = useDownloadProfileFieldFile();
  const userHasRemovePreviewFiles = useHasRemovePreviewFiles();
  const field = property.field;
  const { name, expiryAlertAheadTime } = field;

  const expiryDate = watch(`expirations.${index}.expiryDate` as const);

  const notificationDate =
    expiryDate && expiryAlertAheadTime ? sub(new Date(expiryDate), expiryAlertAheadTime) : null;

  const checkIfIsPast = (value: string | null) => isNonNullish(value) && isPast(new Date(value));
  const [isPastDate, setIsPastDate] = useState(checkIfIsPast(expiryDate));
  const handleOnBlur = () => setIsPastDate(checkIfIsPast(expiryDate));

  return (
    <FormControl key={field.id} as={Stack} isInvalid={!!errors.expirations?.[index]?.expiryDate}>
      <FormLabel fontWeight={400}>
        <FormattedMessage
          id="component.update-profile-field-expiration-dialog.date-label"
          defaultMessage="Expiration date of {fieldName}"
          values={{
            fieldName: (
              <LocalizableUserTextRender
                value={name}
                default={
                  <Text as="em">
                    {intl.formatMessage({
                      id: "generic.unnamed-profile-type-field",
                      defaultMessage: "Unnamed property",
                    })}
                  </Text>
                }
              />
            ),
          }}
        />
      </FormLabel>
      <Flex flex="1" position="relative">
        <DateInput {...register(`expirations.${index}.expiryDate`)} onBlur={handleOnBlur} />
        {browserName !== "Firefox" ? (
          <Center boxSize={10} position="absolute" insetEnd={0} bottom={0} pointerEvents="none">
            <FieldDateIcon fontSize="18px" />
          </Center>
        ) : null}
      </Flex>

      {(field.type === "FILE" ||
        field.type === "ADVERSE_MEDIA_SEARCH" ||
        field.type === "BACKGROUND_CHECK") &&
      isNonNullish(property.files) &&
      property.files.length > 0 ? (
        <Flex gap={2} flexWrap="wrap">
          {property.files.map((file) => {
            if (isNullish(file?.file)) {
              return null;
            }
            return (
              <Box key={file.id}>
                <SimpleFileButton
                  isDisabled={!file.file.isComplete}
                  onClick={async () => {
                    await downloadProfileFieldFile(
                      profileId,
                      property.field.id,
                      file.id,
                      userHasRemovePreviewFiles ? false : true,
                    );
                  }}
                  filename={file.file.filename}
                  contentType={file.file.contentType}
                />
              </Box>
            );
          })}
        </Flex>
      ) : null}

      <Text>
        {notificationDate ? (
          <FormattedMessage
            id="component.update-profile-field-expiration-dialog.alert-date"
            defaultMessage="We will notify starting from {date}"
            values={{
              date: intl.formatDate(notificationDate, FORMATS.L),
            }}
          />
        ) : isNonNullish(expiryAlertAheadTime?.days) ? (
          <FormattedMessage
            id="component.update-profile-field-expiration-dialog.alert-duration-days"
            defaultMessage="We will let you know {count, select, 1 {one day} 7 {seven days} 15 {fifteen days} other {# days}} {isAfter, select, true {after} other {before}}."
            values={{
              count: Math.abs(expiryAlertAheadTime?.days || 1),
              isAfter: (expiryAlertAheadTime?.days || 1) < 0,
            }}
          />
        ) : isNonNullish(expiryAlertAheadTime?.months) ? (
          <FormattedMessage
            id="component.update-profile-field-expiration-dialog.alert-duration-months"
            defaultMessage="We will let you know {count, select, 1 {one month} 2 {two months} 3 {three months} other {# months}} {isAfter, select, true {after} other {before}}."
            values={{
              count: Math.abs(expiryAlertAheadTime?.months || 1),
              isAfter: (expiryAlertAheadTime?.months || 1) < 0,
            }}
          />
        ) : (
          <FormattedMessage
            id="component.update-profile-field-expiration-dialog.no-alert-duration"
            defaultMessage="This property does not have any established alerts."
          />
        )}
      </Text>
      {isPastDate ? (
        <Alert status="warning" rounded="md">
          <AlertIcon />
          <AlertDescription flex="1">
            <FormattedMessage
              id="component.update-profile-field-expiration-dialog.date-expired-alert"
              defaultMessage="The set date has already passed."
            />
          </AlertDescription>
        </Alert>
      ) : null}
    </FormControl>
  );
}

export function useConfigureExpirationsDateDialog() {
  return useWizardDialog(
    {
      LOADING: ConfigureExpirationsDateLoadingDialog,
      RESOLVE_EXPIRATIONS: ConfigureExpirationsDateDialog,
    },
    "LOADING",
  );
}

const _fragments = {
  ProfileFieldProperty: gql`
    fragment useConfigureExpirationsDateDialog_ProfileFieldProperty on ProfileFieldProperty {
      field {
        id
        type
        name
        expiryAlertAheadTime
      }
      files {
        id
        expiryDate
        file {
          contentType
          filename
          isComplete
        }
      }
    }
  `,
  Profile: gql`
    fragment useConfigureExpirationsDateDialog_Profile on Profile {
      id
      properties {
        ...useConfigureExpirationsDateDialog_ProfileFieldProperty
      }
      ...ProfileReference_Profile
    }
  `,
};

const _queries = [
  gql`
    query useConfigureExpirationsDateDialog_profile($profileId: GID!) {
      profile(profileId: $profileId) {
        id
        ...useConfigureExpirationsDateDialog_Profile
      }
    }
  `,
];
