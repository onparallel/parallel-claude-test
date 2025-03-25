import { ContainerModule } from "inversify";
import { BACKGROUND_CHECK_CLIENT, IBackgroundCheckClient } from "./BackgroundCheckClient";
import { OpenSanctionsClient } from "./OpenSanctionsClient";

export const backgroundCheckClientsModule = new ContainerModule((options) => {
  options
    .bind<IBackgroundCheckClient>(BACKGROUND_CHECK_CLIENT)
    .to(OpenSanctionsClient)
    .inSingletonScope()
    .whenNamed("OPEN_SANCTIONS");
});
