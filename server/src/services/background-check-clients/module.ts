import { ContainerModule } from "inversify";
import {
  BACKGROUND_CHECK_CLIENT,
  BACKGROUND_CHECK_CLIENT_FACTORY,
  BackgroundCheckClientFactory,
  getBackgroundCheckClientFactory,
  IBackgroundCheckClient,
} from "./BackgroundCheckClient";
import { OpenSanctionsClient } from "./OpenSanctionsClient";

export const backgroundCheckClientsModule = new ContainerModule((options) => {
  options
    .bind<IBackgroundCheckClient>(BACKGROUND_CHECK_CLIENT)
    .to(OpenSanctionsClient)
    .inSingletonScope()
    .whenNamed("OPEN_SANCTIONS");

  options
    .bind<BackgroundCheckClientFactory>(BACKGROUND_CHECK_CLIENT_FACTORY)
    .toFactory(getBackgroundCheckClientFactory);
});
