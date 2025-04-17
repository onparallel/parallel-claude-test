import { ModuleType } from "../../DashboardModuleDrawer";
import { PetitionButtonModuleSettings } from "./PetitionButtonModuleSettings";
import { PetitionsChartModuleSettings } from "./PetitionsChartModuleSettings";
import { PetitionsNumberModuleSettings } from "./PetitionsNumberModuleSettings";
import { PetitionsRatioModuleSettings } from "./PetitionsRatioModuleSettings";

export function DashboardModulePetitionForm({ moduleType }: { moduleType: ModuleType }) {
  return (
    <>
      {moduleType === "DashboardCreatePetitionButtonModule" ? (
        <PetitionButtonModuleSettings />
      ) : null}
      {moduleType === "DashboardPetitionsPieChartModule" ? <PetitionsChartModuleSettings /> : null}
      {moduleType === "DashboardPetitionsNumberModule" ? <PetitionsNumberModuleSettings /> : null}
      {moduleType === "DashboardPetitionsRatioModule" ? <PetitionsRatioModuleSettings /> : null}
    </>
  );
}
