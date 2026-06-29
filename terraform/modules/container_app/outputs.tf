output "id" {
  description = "Container App resource ID."
  value       = azurerm_container_app.this.id
}

output "name" {
  description = "Container App name."
  value       = azurerm_container_app.this.name
}

output "fqdn" {
  description = "Container App FQDN."
  value       = azurerm_container_app.this.ingress[0].fqdn
}

output "environment_id" {
  description = "Container Apps Environment ID."
  value       = azurerm_container_app_environment.this.id
}
