import { DashboardModuleType } from "../../hooks/useDashboardModules";
import { PetitionButtonModuleSettings } from "./PetitionButtonModuleSettings";
import { PetitionsChartModuleSettings } from "./PetitionsChartModuleSettings";
import { PetitionsNumberModuleSettings } from "./PetitionsNumberModuleSettings";
import { PetitionsRatioModuleSettings } from "./PetitionsRatioModuleSettings";

export function DashboardModulePetitionForm({
  moduleType,
  isUpdating,
}: {
  moduleType: DashboardModuleType;
  isUpdating?: boolean;
}) {
  return moduleType === "DashboardCreatePetitionButtonModule" ? (
    <PetitionButtonModuleSettings isUpdating={isUpdating} />
  ) : moduleType === "DashboardPetitionsNumberModule" ? (
    <PetitionsNumberModuleSettings isUpdating={isUpdating} />
  ) : moduleType === "DashboardPetitionsRatioModule" ? (
    <PetitionsRatioModuleSettings isUpdating={isUpdating} />
  ) : moduleType === "DashboardPetitionsPieChartModule" ? (
    <PetitionsChartModuleSettings isUpdating={isUpdating} />
  ) : null;
}
