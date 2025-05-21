import { ContainerModule } from "inversify";
import { ADVERSE_MEDIA_SEARCH_CLIENT, IAdverseMediaSearchClient } from "./AdverseMediaSearchClient";
import { OPointClient } from "./OPointClient";

export const adverseMediaSearchClientsModule = new ContainerModule((options) => {
  options.bind<IAdverseMediaSearchClient>(ADVERSE_MEDIA_SEARCH_CLIENT).to(OPointClient);
});
