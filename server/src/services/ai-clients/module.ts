import { ContainerModule } from "inversify";
import { AI_COMPLETION_CLIENT, IAiCompletionClient } from "./AiCompletionClient";
import { AzureOpenAiClient } from "./AzureOpenAIClient";

export const aiCompletionClientsModule = new ContainerModule((bind) => {
  bind<IAiCompletionClient<any>>(AI_COMPLETION_CLIENT)
    .to(AzureOpenAiClient)
    .whenTargetNamed("AZURE_OPEN_AI");
});
