data "azurerm_resource_group" "this" {
  name = local.names.resource_group
}

data "azurerm_container_registry" "this" {
  name                = local.names.acr
  resource_group_name = data.azurerm_resource_group.this.name
}

data "azurerm_key_vault" "this" {
  name                = local.names.key_vault
  resource_group_name = data.azurerm_resource_group.this.name
}

data "azurerm_user_assigned_identity" "this" {
  name                = local.names.identity
  resource_group_name = data.azurerm_resource_group.this.name
}

data "azurerm_log_analytics_workspace" "this" {
  name                = local.names.log_analytics
  resource_group_name = data.azurerm_resource_group.this.name
}

data "azurerm_application_insights" "this" {
  name                = local.names.application_insights
  resource_group_name = data.azurerm_resource_group.this.name
}
