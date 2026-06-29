output "resource_group_name" {
  description = "Resource group name."
  value       = module.resource_group.name
}

output "acr_name" {
  description = "ACR name."
  value       = module.container_registry.name
}

output "acr_login_server" {
  description = "ACR login server."
  value       = module.container_registry.login_server
}

output "key_vault_name" {
  description = "Key Vault name."
  value       = module.key_vault.name
}

output "managed_identity_name" {
  description = "User-assigned managed identity name."
  value       = module.identity.name
}

output "managed_identity_client_id" {
  description = "User-assigned managed identity client ID."
  value       = module.identity.client_id
}

output "log_analytics_workspace_name" {
  description = "Log Analytics Workspace name."
  value       = module.observability.log_analytics_workspace_name
}

output "application_insights_name" {
  description = "Application Insights name."
  value       = module.observability.application_insights_name
}
