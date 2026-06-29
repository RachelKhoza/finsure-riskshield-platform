output "id" {
  description = "Managed identity resource ID."
  value       = azurerm_user_assigned_identity.this.id
}

output "name" {
  description = "Managed identity name."
  value       = azurerm_user_assigned_identity.this.name
}

output "principal_id" {
  description = "Managed identity principal ID."
  value       = azurerm_user_assigned_identity.this.principal_id
}

output "client_id" {
  description = "Managed identity client ID."
  value       = azurerm_user_assigned_identity.this.client_id
}
