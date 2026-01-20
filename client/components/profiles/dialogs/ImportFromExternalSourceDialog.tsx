import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { AlertCircleFilledIcon, CheckIcon, HelpOutlineIcon } from "@parallel/chakra/icons";
import { CloseableAlert } from "@parallel/components/common/CloseableAlert";
import { ConfirmDialog } from "@parallel/components/common/dialogs/ConfirmDialog";
import {
  useWizardDialog,
  WizardStepDialogProps,
} from "@parallel/components/common/dialogs/WizardDialog";
import { Divider } from "@parallel/components/common/Divider";
import { NakedHelpCenterLink } from "@parallel/components/common/HelpCenterLink";
import {
  LocalizableUserText,
  LocalizableUserTextRender,
} from "@parallel/components/common/LocalizableUserTextRender";
import { ProfilePropertyContent } from "@parallel/components/common/ProfilePropertyContent";
import { ProfileReference } from "@parallel/components/common/ProfileReference";
import { ProfileTypeFieldReference } from "@parallel/components/common/ProfileTypeFieldReference";
import { ScrollTableContainer } from "@parallel/components/common/ScrollTableContainer";
import { SelectableTd, SelectableTr } from "@parallel/components/common/SelectableTd";
import { SimpleSelect } from "@parallel/components/common/SimpleSelect";
import { SmallPopover } from "@parallel/components/common/SmallPopover";
import { SupportLink } from "@parallel/components/common/SupportLink";
import {
  ImportFromExternalSourceDialog_completeProfileFromExternalSourceDocument,
  ImportFromExternalSourceDialog_integrationsDocument,
  ImportFromExternalSourceDialog_profileExternalSourceDetailsDocument,
  ImportFromExternalSourceDialog_ProfileExternalSourceOrgIntegrationFragment,
  ImportFromExternalSourceDialog_profileExternalSourceSearchDocument,
  ImportFromExternalSourceDialog_ProfileExternalSourceSearchMultipleResultsDetailFragment,
  ImportFromExternalSourceDialog_ProfileExternalSourceSearchSingleResultFragment,
  ProfileExternalSourceConflictResolutionAction,
  ProfileStatus,
  useImportFromExternalSourceDialog_ProfileTypeFragment,
  UserLocale,
} from "@parallel/graphql/__types";
import { isApolloError } from "@parallel/utils/apollo/isApolloError";
import { assertTypenameArray } from "@parallel/utils/apollo/typename";
import { EnumerateList } from "@parallel/utils/EnumerateList";
import { never } from "@parallel/utils/never";
import { useGenericErrorToast } from "@parallel/utils/useGenericErrorToast";
import { useMultipleRefs } from "@parallel/utils/useMultipleRefs";
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormattedMessage, FormattedNumber, useIntl } from "react-intl";
import { entries, fromEntries, isNonNullish, isTruthy, map, pipe } from "remeda";

type ImportFromExternalSourceDialogResult = {
  profileId: string;
};

type ImportFromExternalSourceDialogSteps = {
  SELECT_SOURCE: {
    profileType: useImportFromExternalSourceDialog_ProfileTypeFragment;
    profileId: string;
    orgIntegrationId?: string;
  };
  SEARCH: {
    profileType: useImportFromExternalSourceDialog_ProfileTypeFragment;
    profileId: string;
    orgIntegration: ImportFromExternalSourceDialog_ProfileExternalSourceOrgIntegrationFragment;
    data?: Record<string, string | null>;
  };
  SEARCH_RESULTS: {
    profileType: useImportFromExternalSourceDialog_ProfileTypeFragment;
    profileId: string;
    orgIntegration: ImportFromExternalSourceDialog_ProfileExternalSourceOrgIntegrationFragment;
    searchResults: ImportFromExternalSourceDialog_ProfileExternalSourceSearchMultipleResultsDetailFragment;
    data: Record<string, string | null>;
    selectedResult?: string;
  };
  UPDATE_PROFILE: {
    profileType: useImportFromExternalSourceDialog_ProfileTypeFragment;
    profileId: string;
    orgIntegration: ImportFromExternalSourceDialog_ProfileExternalSourceOrgIntegrationFragment;
    result: ImportFromExternalSourceDialog_ProfileExternalSourceSearchSingleResultFragment;
  };
};

function ImportFromExternalSourceDialogSelectSource({
  orgIntegrationId,
  profileType,
  profileId,
  onStep,
  fromStep,
  ...props
}: WizardStepDialogProps<
  ImportFromExternalSourceDialogSteps,
  "SELECT_SOURCE",
  ImportFromExternalSourceDialogResult
>) {
  const intl = useIntl();
  const { handleSubmit, control, formState, reset, setFocus } = useForm<{
    orgIntegrationId: string | null;
  }>({
    mode: "onSubmit",
    defaultValues: {
      orgIntegrationId: orgIntegrationId ?? null,
    },
  });
  const { data, loading } = useQuery(ImportFromExternalSourceDialog_integrationsDocument, {
    variables: {
      locale: intl.locale as UserLocale,
      profileTypeId: profileType.id,
      profileId,
    },
  });
  const integrations = data?.me.organization.integrations.items ?? [];
  assertTypenameArray(integrations, "ProfileExternalSourceOrgIntegration");
  const options = useMemo(
    () =>
      integrations
        .filter((o) => o.searchableProfileTypes.some((pt) => pt.id === profileType.id))
        .map((o) => ({ value: o.id, label: o.name })),
    [integrations],
  );
  useEffect(() => {
    if (options.length > 0) {
      reset({ orgIntegrationId: options[0].value });
    }
  }, [options]);
  const focusRef = useRef({ focus: () => setFocus("orgIntegrationId") });
  const noIntegrations = options.length === 0 && !loading;
  return (
    <ConfirmDialog
      size="lg"
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(({ orgIntegrationId }) => {
            return onStep(
              "SEARCH",
              {
                orgIntegration: integrations!.find((o) => o.id === orgIntegrationId)!,
                profileId,
                profileType,
              },
              { orgIntegrationId: orgIntegrationId! },
            );
          }),
        },
      }}
      initialFocusRef={focusRef}
      hasCloseButton
      header={
        <FormattedMessage
          id="component.import-from-external-source-dialog.header-select-source"
          defaultMessage="Select an external data source"
        />
      }
      body={
        <Stack>
          {noIntegrations ? (
            <Alert status="warning" rounded="md">
              <AlertIcon />
              <HStack spacing={8}>
                <AlertDescription>
                  <FormattedMessage
                    id="component.import-from-external-source-dialog.missing-integration-alert-description"
                    defaultMessage="Upgrade your plan to access this feature."
                  />
                </AlertDescription>
                <Center>
                  <Button
                    as={SupportLink}
                    variant="outline"
                    backgroundColor="white"
                    message={intl.formatMessage({
                      id: "component.import-from-external-source-dialog.missing-integration-message",
                      defaultMessage:
                        "Hi, I would like more information about checking external data sources.",
                    })}
                  >
                    <FormattedMessage id="generic.contact" defaultMessage="Contact" />
                  </Button>
                </Center>
              </HStack>
            </Alert>
          ) : null}
          <Controller
            control={control}
            name="orgIntegrationId"
            rules={{ required: true }}
            render={({ field }) => (
              <SimpleSelect
                isDisabled={noIntegrations}
                placeholder={intl.formatMessage({
                  id: "component.import-from-external-source-dialog.header",
                  defaultMessage: "Select an external data source",
                })}
                isClearable={false}
                options={options}
                {...field}
              />
            )}
          />
        </Stack>
      }
      alternative={
        <Button
          as={NakedHelpCenterLink}
          leftIcon={<HelpOutlineIcon />}
          variant="outline"
          articleId={9826893}
        >
          <FormattedMessage id="generic.help" defaultMessage="Help" />
        </Button>
      }
      confirm={
        <Button type="submit" isDisabled={!formState.isValid} colorScheme="primary">
          <FormattedMessage id="generic.next-button" defaultMessage="Next" />
        </Button>
      }
      {...props}
    />
  );
}

function ImportFromExternalSourceDialogSearch({
  profileType,
  profileId,
  orgIntegration,
  data,
  onStep,
  onBack,
  ...props
}: WizardStepDialogProps<
  ImportFromExternalSourceDialogSteps,
  "SEARCH",
  ImportFromExternalSourceDialogResult
>) {
  const intl = useIntl();
  const { register, control, formState, handleSubmit, setFocus } = useForm({
    defaultValues:
      data ??
      pipe(
        orgIntegration.searchParams,
        map((f) => [f.key, f.defaultValue ?? null] as const),
        fromEntries(),
      ),
  });
  const focusRef = useRef({ focus: () => setFocus(orgIntegration.searchParams[0].key) });
  const [search, { loading }] = useMutation(
    ImportFromExternalSourceDialog_profileExternalSourceSearchDocument,
  );
  const [noResults, setNoResults] = useState(false);
  return (
    <ConfirmDialog
      size="lg"
      initialFocusRef={focusRef}
      content={{
        containerProps: {
          as: "form",
          onSubmit: handleSubmit(async (data) => {
            setNoResults(false);
            const res = await search({
              variables: {
                integrationId: orgIntegration.id,
                locale: intl.locale as UserLocale,
                profileTypeId: profileType.id,
                profileId: profileId,
                search: data,
              },
            });
            if (isNonNullish(res.data)) {
              const result = res.data.profileExternalSourceSearch;
              if (result.__typename === "ProfileExternalSourceSearchMultipleResults") {
                if (result.results.rows.length > 0) {
                  onStep(
                    "SEARCH_RESULTS",
                    { profileType, profileId, orgIntegration, searchResults: result.results, data },
                    { data },
                  );
                } else {
                  setNoResults(true);
                }
              } else if (result.__typename === "ProfileExternalSourceSearchSingleResult") {
                onStep(
                  "UPDATE_PROFILE",
                  { profileType, profileId, orgIntegration, result },
                  { data },
                );
              }
            }
          }),
        },
      }}
      hasCloseButton
      header={
        <HeaderWithOrgIntegrationLogo orgIntegration={orgIntegration}>
          <FormattedMessage
            id="component.import-from-external-source-dialog.header-search"
            defaultMessage="Search {profileTypeName}"
            values={{
              profileTypeName: (
                <LocalizableUserTextRender
                  value={profileType.name}
                  default={
                    <FormattedMessage
                      id="generic.unnamed-profile-type"
                      defaultMessage="Unnamed profile type"
                    />
                  }
                />
              ),
            }}
          />
        </HeaderWithOrgIntegrationLogo>
      }
      body={
        <Stack>
          {orgIntegration.searchParams.map((f) => (
            <FormControl key={f.key} isInvalid={!!formState.errors[f.key]}>
              <FormLabel fontWeight="normal">{f.label}</FormLabel>
              {f.type === "TEXT" ? (
                <Input
                  placeholder={f.placeholder ?? undefined}
                  {...register(f.key, {
                    required: f.required,
                    minLength: f.minLength ?? undefined,
                  })}
                />
              ) : f.type === "SELECT" ? (
                <Controller
                  control={control}
                  rules={{ required: f.required }}
                  name={f.key}
                  render={({ field }) => (
                    <SimpleSelect
                      placeholder={f.placeholder}
                      options={f.options!}
                      isClearable
                      {...field}
                    />
                  )}
                />
              ) : null}
              <FormErrorMessage>
                {formState.errors[f.key]?.type === "required" ? (
                  <FormattedMessage
                    id="generic.required-field-error"
                    defaultMessage="The field is required"
                  />
                ) : formState.errors[f.key]?.type === "minLength" ? (
                  <FormattedMessage
                    id="generic.min-length-error"
                    defaultMessage="The field should be at least {count} characters long"
                    values={{ count: f.minLength }}
                  />
                ) : null}
              </FormErrorMessage>
            </FormControl>
          ))}
          {noResults ? (
            <CloseableAlert status="warning" rounded="md">
              <AlertIcon />
              <AlertDescription flex="1">
                <FormattedMessage
                  id="generic.search-no-results"
                  defaultMessage="No matches found for your search."
                />
              </AlertDescription>
            </CloseableAlert>
          ) : null}
        </Stack>
      }
      cancel={
        <Button onClick={() => onBack()}>
          <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
        </Button>
      }
      confirm={
        <Button type="submit" colorScheme="primary" isDisabled={loading} isLoading={loading}>
          <FormattedMessage id="generic.next-button" defaultMessage="Next" />
        </Button>
      }
      {...props}
    />
  );
}

function ImportFromExternalSourceDialogSearchResults({
  orgIntegration,
  profileType,
  profileId,
  searchResults,
  data,
  selectedResult: initialSelectedResult,
  onStep,
  onBack,
  fromStep,
  ...props
}: WizardStepDialogProps<
  ImportFromExternalSourceDialogSteps,
  "SEARCH_RESULTS",
  ImportFromExternalSourceDialogResult
>) {
  const [selectedResult, setSelectedResult] = useState(
    initialSelectedResult ?? searchResults.rows[0][searchResults.key],
  );
  const radioRefs = useMultipleRefs<HTMLInputElement>();
  const [search, { loading }] = useMutation(
    ImportFromExternalSourceDialog_profileExternalSourceDetailsDocument,
  );
  const showGenericErrorToast = useGenericErrorToast();
  return (
    <ConfirmDialog
      size="3xl"
      initialFocusRef={radioRefs[selectedResult]}
      content={{
        containerProps: {
          as: "form",
          onSubmit: async (e) => {
            e.preventDefault();
            e.persist();
            try {
              const res = await search({
                variables: {
                  integrationId: orgIntegration.id,
                  profileTypeId: profileType.id,
                  profileId: profileId,
                  externalId: selectedResult,
                },
              });
              if (isNonNullish(res.data)) {
                const result = res.data.profileExternalSourceDetails;
                onStep(
                  "UPDATE_PROFILE",
                  { profileType, profileId, orgIntegration, result },
                  { selectedResult },
                );
              }
            } catch (e: any) {
              showGenericErrorToast(e);
            }
          },
        },
      }}
      hasCloseButton
      header={
        <HeaderWithOrgIntegrationLogo orgIntegration={orgIntegration}>
          <FormattedMessage
            id="component.import-from-external-source-dialog.header-search-results"
            defaultMessage="Search results"
          />{" "}
          (<FormattedNumber value={searchResults.rows.length} />)
        </HeaderWithOrgIntegrationLogo>
      }
      scrollBehavior="inside"
      bodyProps={{ as: "div", display: "flex", flexDirection: "column" }}
      body={
        <Stack minHeight={0}>
          <HStack>
            <Box as="strong">
              <FormattedMessage
                id="component.import-from-external-source-dialog.searching-by"
                defaultMessage="Searching by"
              />
              :
            </Box>
            <HStack divider={<Divider isVertical height={3.5} color="gray.500" />}>
              {orgIntegration.searchParams
                .filter((p) => isTruthy(data[p.key]))
                .map((p) => (
                  <Box key={p.key}>
                    {p.type === "TEXT"
                      ? data[p.key]
                      : p.type === "SELECT"
                        ? p.options!.find((o) => o.value === data[p.key])!.label
                        : null}
                  </Box>
                ))}
            </HStack>
          </HStack>
          <ScrollTableContainer>
            <RadioGroup value={selectedResult} onChange={setSelectedResult}>
              <Table variant="parallel">
                <Thead>
                  <Tr>
                    <Th width="40px"></Th>
                    {searchResults.columns.map((c) => (
                      <Th key={c.key}>{c.label}</Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  {searchResults.rows.map((r) => {
                    const rowKey = r[searchResults.key];
                    const isSelected = selectedResult === rowKey;
                    return (
                      <Tr
                        key={rowKey}
                        data-highlightable
                        data-selected={isSelected || undefined}
                        onClick={(e) => {
                          if (["INPUT", "LABEL"].includes((e.target as HTMLElement).nodeName)) {
                            // ignore events coming from the .click() below
                            return;
                          }
                          const input = radioRefs[rowKey].current;
                          // simulate click on label, so keyboard navigation works after click
                          input?.parentElement?.click();
                        }}
                        cursor="pointer"
                      >
                        <Td padding={0} paddingInlineStart="0 !important">
                          <Center boxSize="40px" pointerEvents="none">
                            <Radio ref={radioRefs[rowKey]} value={rowKey} />
                          </Center>
                        </Td>
                        {searchResults.columns.map((c) => (
                          <Td key={c.key}>{r[c.key]}</Td>
                        ))}
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </RadioGroup>
          </ScrollTableContainer>
        </Stack>
      }
      cancel={
        <Button onClick={() => onBack()}>
          <FormattedMessage
            id="component.import-from-external-source-dialog.modify-search-button"
            defaultMessage="Modify search"
          />
        </Button>
      }
      confirm={
        <Button type="submit" colorScheme="primary" isDisabled={loading} isLoading={loading}>
          <FormattedMessage id="generic.next-button" defaultMessage="Next" />
        </Button>
      }
      {...props}
    />
  );
}

function ImportFromExternalSourceDialogUpdateProfile({
  orgIntegration,
  profileType,
  profileId,
  result,
  onStep,
  onBack,
  fromStep,
  ...props
}: WizardStepDialogProps<
  ImportFromExternalSourceDialogSteps,
  "UPDATE_PROFILE",
  ImportFromExternalSourceDialogResult
>) {
  const intl = useIntl();
  const [resolutions, setResolutions] = useState<
    Record<string, ProfileExternalSourceConflictResolutionAction | undefined>
  >(
    fromEntries(
      result.data.map(({ profileTypeField: field }) => {
        const canWriteValue = field.myPermission === "WRITE";
        const canReadValue = field.myPermission !== "HIDDEN";
        return [field.id, canWriteValue ? "OVERWRITE" : canReadValue ? "IGNORE" : undefined];
      }),
    ),
  );

  const [uniqueValueConflicts, setUniqueValueConflicts] = useState<
    {
      profileId: string;
      profileName: LocalizableUserText;
      profileStatus: ProfileStatus;
      profileTypeFieldId: string;
    }[]
  >([]);

  const confirmRef = useRef<HTMLButtonElement>(null);
  const [completeProfileFromExternalSource, { loading }] = useMutation(
    ImportFromExternalSourceDialog_completeProfileFromExternalSourceDocument,
  );
  const showGenericError = useGenericErrorToast();

  const fieldsWithoutRead = result.data
    .filter(({ profileTypeField: field }) => field.myPermission === "HIDDEN")
    .map(({ profileTypeField: field }) => field);
  const fieldsWithoutWrite = result.data
    .filter(({ profileTypeField: field }) => field.myPermission !== "WRITE")
    .map(({ profileTypeField: field }) => field);
  return (
    <ConfirmDialog
      size="4xl"
      content={{
        containerProps: {
          as: "form",
          onSubmit: async (e) => {
            e.preventDefault();
            e.persist();
            try {
              const res = await completeProfileFromExternalSource({
                variables: {
                  profileExternalSourceEntityId: result.id,
                  profileTypeId: profileType.id,
                  profileId: profileId,
                  conflictResolutions: entries(resolutions).map(([profileTypeFieldId, action]) => ({
                    profileTypeFieldId,
                    action: action ?? "IGNORE",
                  })),
                },
              });
              if (isNonNullish(res.data)) {
                return props.onResolve();
              }
            } catch (error) {
              if (isApolloError(error, "PROFILE_FIELD_VALUE_UNIQUE_CONSTRAINT")) {
                const conflicts =
                  (error.errors[0].extensions?.conflicts as {
                    profileId: string;
                    profileName: LocalizableUserText;
                    profileStatus: ProfileStatus;
                    profileTypeFieldId: string;
                  }[]) ?? [];

                setUniqueValueConflicts(conflicts);
                setResolutions((curr) => ({
                  ...curr,
                  ...Object.fromEntries(
                    conflicts
                      .filter((c) => c.profileId !== profileId)
                      .map(({ profileTypeFieldId }) => [profileTypeFieldId, "IGNORE" as const]),
                  ),
                }));
              } else {
                showGenericError();
              }
            }
          },
        },
      }}
      initialFocusRef={confirmRef}
      hasCloseButton
      header={
        <HeaderWithOrgIntegrationLogo orgIntegration={orgIntegration}>
          <FormattedMessage
            id="component.import-from-external-source-dialog.header-update-profile"
            defaultMessage="Update profile"
          />
        </HeaderWithOrgIntegrationLogo>
      }
      scrollBehavior="inside"
      bodyProps={{ as: "div", display: "flex", flexDirection: "column" }}
      body={
        <Stack minHeight={0}>
          <Text>
            <FormattedMessage
              id="component.import-from-external-source-dialog.update-profile-description"
              defaultMessage="The following properties of profile {profileName} will be updated with the selected results."
              values={{ profileName: <ProfileReference as="strong" profile={result.profile} /> }}
            />
          </Text>
          <Text>
            <FormattedMessage
              id="component.import-from-external-source-dialog.update-profile-description-2"
              defaultMessage="Select the value you want to keep:"
            />
          </Text>
          {fieldsWithoutRead.length > 0 ? (
            <Box>
              <CloseableAlert status="warning" rounded="md">
                <AlertIcon />
                <AlertDescription flex={1}>
                  <Text>
                    <FormattedMessage
                      id="component.import-from-external-source-dialog.fields-without-read"
                      defaultMessage="You don't have read permission on some of the fields for which {providerName} is reporting information:"
                      values={{ providerName: orgIntegration.name }}
                    />{" "}
                    <EnumerateList
                      values={fieldsWithoutRead}
                      maxItems={10}
                      renderItem={({ value }, i) => (
                        <Text as="strong" key={i}>
                          <LocalizableUserTextRender
                            value={value.name}
                            default={intl.formatMessage({
                              id: "generic.unnamed-profile-type-field",
                              defaultMessage: "Unnamed property",
                            })}
                          />
                        </Text>
                      )}
                    />
                  </Text>
                </AlertDescription>
              </CloseableAlert>
            </Box>
          ) : null}
          {fieldsWithoutWrite.length > 0 ? (
            <Box>
              <CloseableAlert status="warning" rounded="md">
                <AlertIcon />
                <AlertDescription flex={1}>
                  <Text>
                    <FormattedMessage
                      id="component.import-from-external-source-dialog.fields-without-write"
                      defaultMessage="You don't have write permission on some of the fields for which {providerName} is reporting information:"
                      values={{ providerName: orgIntegration.name }}
                    />{" "}
                    <EnumerateList
                      values={fieldsWithoutWrite}
                      maxItems={10}
                      renderItem={({ value }, i) => (
                        <Text as="strong" key={i}>
                          <LocalizableUserTextRender
                            value={value.name}
                            default={intl.formatMessage({
                              id: "generic.unnamed-profile-type-field",
                              defaultMessage: "Unnamed property",
                            })}
                          />
                        </Text>
                      )}
                    />
                  </Text>
                </AlertDescription>
              </CloseableAlert>
            </Box>
          ) : null}
          <ScrollTableContainer>
            <Table variant="parallel" layout="fixed" height="1px">
              <Thead>
                <Tr>
                  <Th width="33.3%">
                    <FormattedMessage id="generic.profile-property" defaultMessage="Property" />
                  </Th>
                  <Th width="33.3%">
                    <FormattedMessage
                      id="component.import-from-external-source-dialog.current-value"
                      defaultMessage="Current value"
                    />
                  </Th>
                  <Th width="33.3%">
                    <FormattedMessage
                      id="component.import-from-external-source-dialog.value-from"
                      defaultMessage="From {integrationName}"
                      values={{ integrationName: orgIntegration.name }}
                    />
                  </Th>
                  <Th width="40px"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {result.data.map(({ profileTypeField: field, content }) => {
                  const currentValue = result.profile!.properties.find(
                    (p) => p.field.id === field.id,
                  )!.value;
                  const isSameContent =
                    isNonNullish(content) &&
                    // for CHECKBOX contents value is an array of strings
                    content.value?.toString() === currentValue?.content?.value?.toString();

                  const canWriteValue = field.myPermission === "WRITE";
                  const canReadValue = field.myPermission !== "HIDDEN";

                  const uniqueConflict = uniqueValueConflicts.find(
                    (c) => c.profileTypeFieldId === field.id && c.profileId !== profileId,
                  );

                  return (
                    <SelectableTr
                      key={field.id}
                      type="RADIO"
                      value={resolutions[field.id]}
                      labelId={`import-profile-type-field-${field.id}`}
                      isDisabled={isSameContent}
                      onChange={(value) =>
                        setResolutions((curr) => ({
                          ...curr,
                          [field.id]: value as ProfileExternalSourceConflictResolutionAction,
                        }))
                      }
                    >
                      <Td id={`import-profile-type-field-${field.id}`} verticalAlign="top">
                        <ProfileTypeFieldReference field={field} />
                      </Td>
                      <SelectableTd
                        value="IGNORE"
                        isDisabled={!canReadValue}
                        _content={{ opacity: isSameContent || !canReadValue ? 0.4 : undefined }}
                      >
                        {canReadValue ? (
                          <ProfilePropertyContent field={field} value={currentValue} />
                        ) : (
                          "•".repeat(20)
                        )}
                      </SelectableTd>
                      <SelectableTd
                        value="OVERWRITE"
                        isDisabled={!canWriteValue || !!uniqueConflict}
                        _content={{ opacity: isSameContent || !canWriteValue ? 0.4 : undefined }}
                      >
                        {canReadValue ? (
                          // id is faked but it's not used for anything in this case - only to avoid TS errors - TODO find a better solution
                          <ProfilePropertyContent field={field} value={{ content, id: field.id }} />
                        ) : (
                          "•".repeat(20)
                        )}
                      </SelectableTd>
                      <Td>
                        {isSameContent ? (
                          <Center>
                            <SmallPopover
                              placement="right"
                              content={
                                <Text fontSize="sm">
                                  <FormattedMessage
                                    id="component.import-from-external-source-dialog.value-matches-external-source"
                                    defaultMessage="The current value matches with the one in {providerName}."
                                    values={{
                                      providerName: <Text as="em">{orgIntegration.name}</Text>,
                                    }}
                                  />
                                </Text>
                              }
                            >
                              <CheckIcon
                                color="green.600"
                                _hover={{ color: "green.700" }}
                                _focus={{ color: "green.700" }}
                                tabIndex={0}
                              />
                            </SmallPopover>
                          </Center>
                        ) : !canReadValue ||
                          !canWriteValue ||
                          isNonNullish(currentValue?.content) ||
                          !!uniqueConflict ? (
                          <Center>
                            <SmallPopover
                              placement="right"
                              content={
                                <Text fontSize="sm">
                                  {!canReadValue ? (
                                    <FormattedMessage
                                      id="component.import-from-external-source-dialog.no-read-permission"
                                      defaultMessage="You don't have permission to view this field"
                                    />
                                  ) : !canWriteValue ? (
                                    <FormattedMessage
                                      id="component.import-from-external-source-dialog.no-write-permission"
                                      defaultMessage="You don't have permission to edit this field"
                                    />
                                  ) : !!uniqueConflict ? (
                                    <FormattedMessage
                                      id="component.import-from-external-source-dialog.unique-value-conflict"
                                      defaultMessage="The value in {providerName} is already used by {profileName}."
                                      values={{
                                        providerName: <Text as="em">{orgIntegration.name}</Text>,
                                        profileName: (
                                          <ProfileReference
                                            profile={{
                                              id: uniqueConflict.profileId,
                                              status: uniqueConflict.profileStatus,
                                              localizableName: uniqueConflict.profileName,
                                            }}
                                            asLink
                                          />
                                        ),
                                      }}
                                    />
                                  ) : isNonNullish(currentValue?.content) ? (
                                    <FormattedMessage
                                      id="component.import-from-external-source-dialog.value-differs-external-source"
                                      defaultMessage="The current value differs from the one in {providerName}."
                                      values={{
                                        providerName: <Text as="em">{orgIntegration.name}</Text>,
                                      }}
                                    />
                                  ) : null}
                                </Text>
                              }
                            >
                              <AlertCircleFilledIcon
                                color="yellow.500"
                                _hover={{ color: "yellow.600" }}
                                _focus={{ color: "yellow.600" }}
                                tabIndex={0}
                              />
                            </SmallPopover>
                          </Center>
                        ) : null}
                      </Td>
                    </SelectableTr>
                  );
                })}
              </Tbody>
            </Table>
          </ScrollTableContainer>
        </Stack>
      }
      cancel={
        <Button onClick={() => onBack()}>
          {fromStep === "SEARCH" ? (
            <FormattedMessage
              id="component.import-from-external-source-dialog.modify-search-button"
              defaultMessage="Modify search"
            />
          ) : fromStep === "SEARCH_RESULTS" ? (
            <FormattedMessage id="generic.go-back" defaultMessage="Go back" />
          ) : (
            never()
          )}
        </Button>
      }
      confirm={
        <Button
          ref={confirmRef}
          type="submit"
          colorScheme="primary"
          isDisabled={loading}
          isLoading={loading}
        >
          <FormattedMessage
            id="component.import-from-external-source-dialog.update-profile-button"
            defaultMessage="Update profile"
          />
        </Button>
      }
      {...props}
    />
  );
}

function HeaderWithOrgIntegrationLogo({
  orgIntegration,
  children,
}: PropsWithChildren<{
  orgIntegration: ImportFromExternalSourceDialog_ProfileExternalSourceOrgIntegrationFragment;
}>) {
  return (
    <HStack paddingInlineEnd={6}>
      <Box flex={1}>{children}</Box>
      {orgIntegration.logoUrl300x60 ? (
        <Image
          alt={orgIntegration.name}
          src={orgIntegration.logoUrl300x60}
          width="150px"
          maxHeight="30px"
          objectFit="contain"
        />
      ) : null}
    </HStack>
  );
}

const _fragments = {
  ProfileExternalSourceSearchSingleResult: gql`
    fragment ImportFromExternalSourceDialog_ProfileExternalSourceSearchSingleResult on ProfileExternalSourceSearchSingleResult {
      id
      profile {
        id
        ...ProfileReference_Profile
        properties {
          field {
            id
          }
          value {
            id
            content
          }
        }
      }
      data {
        profileTypeField {
          id
          name
          myPermission
          ...ProfilePropertyContent_ProfileTypeField
        }
        content
      }
    }
  `,
};

const _queries = [
  gql`
    query ImportFromExternalSourceDialog_integrations(
      $profileTypeId: GID!
      $profileId: GID
      $locale: UserLocale!
    ) {
      me {
        id
        organization {
          id
          integrations(type: PROFILE_EXTERNAL_SOURCE, limit: 100) {
            items {
              ... on ProfileExternalSourceOrgIntegration {
                ...ImportFromExternalSourceDialog_ProfileExternalSourceOrgIntegration
              }
            }
          }
        }
      }
    }
    fragment ImportFromExternalSourceDialog_ProfileExternalSourceOrgIntegration on ProfileExternalSourceOrgIntegration {
      id
      name
      logoUrl300x60: logoUrl(options: { resize: { width: 300, height: 60, fit: inside } })
      searchParams(profileTypeId: $profileTypeId, profileId: $profileId, locale: $locale) {
        type
        key
        required
        label
        placeholder
        defaultValue
        minLength
        options {
          value
          label
        }
      }
      searchableProfileTypes {
        id
      }
    }
  `,
];

const _mutations = [
  gql`
    mutation ImportFromExternalSourceDialog_profileExternalSourceSearch(
      $integrationId: GID!
      $locale: UserLocale!
      $search: JSONObject!
      $profileTypeId: GID!
      $profileId: GID
    ) {
      profileExternalSourceSearch(
        integrationId: $integrationId
        locale: $locale
        search: $search
        profileTypeId: $profileTypeId
        profileId: $profileId
      ) {
        ... on ProfileExternalSourceSearchSingleResult {
          ...ImportFromExternalSourceDialog_ProfileExternalSourceSearchSingleResult
        }
        ... on ProfileExternalSourceSearchMultipleResults {
          results {
            ...ImportFromExternalSourceDialog_ProfileExternalSourceSearchMultipleResultsDetail
          }
        }
      }
    }
    fragment ImportFromExternalSourceDialog_ProfileExternalSourceSearchMultipleResultsDetail on ProfileExternalSourceSearchMultipleResultsDetail {
      key
      rows
      columns {
        key
        label
      }
    }
  `,
  gql`
    mutation ImportFromExternalSourceDialog_profileExternalSourceDetails(
      $externalId: ID!
      $integrationId: GID!
      $profileTypeId: GID!
      $profileId: GID
    ) {
      profileExternalSourceDetails(
        externalId: $externalId
        integrationId: $integrationId
        profileTypeId: $profileTypeId
        profileId: $profileId
      ) {
        ...ImportFromExternalSourceDialog_ProfileExternalSourceSearchSingleResult
      }
    }
  `,
  gql`
    mutation ImportFromExternalSourceDialog_completeProfileFromExternalSource(
      $profileExternalSourceEntityId: GID!
      $profileTypeId: GID!
      $profileId: GID!
      $conflictResolutions: [ProfileExternalSourceConflictResolution!]!
    ) {
      completeProfileFromExternalSource(
        profileExternalSourceEntityId: $profileExternalSourceEntityId
        profileTypeId: $profileTypeId
        profileId: $profileId
        conflictResolutions: $conflictResolutions
      ) {
        id
        name
        properties {
          field {
            id
          }
          value {
            id
            content
            createdAt
          }
        }
      }
    }
  `,
];

export function useImportFromExternalSourceDialog() {
  return useWizardDialog(
    {
      SELECT_SOURCE: ImportFromExternalSourceDialogSelectSource,
      SEARCH: ImportFromExternalSourceDialogSearch,
      SEARCH_RESULTS: ImportFromExternalSourceDialogSearchResults,
      UPDATE_PROFILE: ImportFromExternalSourceDialogUpdateProfile,
    },
    "SELECT_SOURCE",
  );
}

const _fragmentsImportFromExternalSourceDialog = {
  ProfileType: gql`
    fragment useImportFromExternalSourceDialog_ProfileType on ProfileType {
      id
      name
    }
  `,
};
