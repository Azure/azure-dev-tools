import os

from agent_framework.foundry import FoundryChatClient
from azure.identity.aio import DefaultAzureCredential
from azure_functions_agents import ClientManager, create_function_app, set_client_manager


class FoundryClientManager(ClientManager):
    name = "foundry"

    def __init__(self):
        client_id = os.environ.get("AZURE_CLIENT_ID")
        self._credential = (
            DefaultAzureCredential(managed_identity_client_id=client_id)
            if client_id
            else DefaultAzureCredential()
        )

    def resolve_model(self, requested: str | None) -> str:
        model = requested or os.environ.get("FOUNDRY_MODEL") or os.environ.get("AZURE_FUNCTIONS_AGENTS_MODEL")
        if not model:
            raise RuntimeError("Configure a Microsoft Foundry model before invoking this function.")
        return model

    def build_chat_client(self, model: str | None):
        return FoundryChatClient(
            project_endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"],
            model=self.resolve_model(model),
            credential=self._credential,
        )

    async def close(self):
        await self._credential.close()


set_client_manager(FoundryClientManager())
app = create_function_app()
