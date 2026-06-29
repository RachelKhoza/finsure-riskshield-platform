module "resource_group" {
  source   = "../../modules/resource_group"
  name     = local.names.resource_group
  location = var.location
  tags     = local.tags
}

module "identity" {
  source              = "../../modules/identity"
  name                = local.names.identity
  location            = module.resource_group.location
  resource_group_name = module.resource_group.name
  tags                = local.tags
}

module "container_registry" {
  source                        = "../../modules/container_registry"
  name                          = local.names.acr
  resource_group_name           = module.resource_group.name
  location                      = module.resource_group.location
  sku                           = var.acr_sku
  public_network_access_enabled = var.public_network_access_enabled
  tags                          = local.tags
}

module "key_vault" {
  source                        = "../../modules/key_vault"
  name                          = local.names.key_vault
  location                      = module.resource_group.location
  resource_group_name           = module.resource_group.name
  purge_protection_enabled      = var.purge_protection_enabled
  public_network_access_enabled = var.public_network_access_enabled
  allowed_ip_ranges             = var.allowed_ip_ranges
  tags                          = local.tags
}

module "observability" {
  source                    = "../../modules/observability"
  log_analytics_name        = local.names.log_analytics
  application_insights_name = local.names.application_insights
  location                  = module.resource_group.location
  resource_group_name       = module.resource_group.name
  log_retention_days        = var.log_retention_days
  tags                      = local.tags
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = module.container_registry.id
  role_definition_name = "AcrPull"
  principal_id         = module.identity.principal_id
}

resource "azurerm_role_assignment" "key_vault_secrets_user" {
  scope                = module.key_vault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.identity.principal_id
}

resource "azurerm_role_assignment" "key_vault_secret_officers" {
  for_each             = toset(var.key_vault_secret_officer_object_ids)
  scope                = module.key_vault.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = each.value
}

module "key_vault_diagnostics" {
  count                      = var.enable_diagnostic_settings ? 1 : 0
  source                     = "../../modules/diagnostics"
  name                       = "diag-kv-to-law"
  target_resource_id         = module.key_vault.id
  log_analytics_workspace_id = module.observability.log_analytics_workspace_id
}

module "acr_diagnostics" {
  count                      = var.enable_diagnostic_settings ? 1 : 0
  source                     = "../../modules/diagnostics"
  name                       = "diag-acr-to-law"
  target_resource_id         = module.container_registry.id
  log_analytics_workspace_id = module.observability.log_analytics_workspace_id
}
