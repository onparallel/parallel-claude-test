export type ProfileSyncAction = ProfileSyncActionUpsert;

interface ProfileSyncActionUpsert {
  profileTypeId: number;
  matchBy: [profileTypeFieldId: number, value: any][];
  data: [profileTypeFieldId: number, value: any][];
}
