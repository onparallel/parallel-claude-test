import { ContainerModule } from "inversify";
import { BACKGROUND_CHECK_CLIENT, IBackgroundCheckClient } from "./BackgroundCheckClient";
import { OpenSanctionsClient } from "./OpenSanctionsClient";

export const backgroundCheckClientsModule = new ContainerModule((bind) => {
  bind<IBackgroundCheckClient>(BACKGROUND_CHECK_CLIENT)
    .to(OpenSanctionsClient)
    .whenTargetNamed("OPEN_SANCTIONS");
});
