output "container_app_name" {
  description = "Container App name."
  value       = module.container_app.name
}

output "container_app_fqdn" {
  description = "Container App FQDN."
  value       = module.container_app.fqdn
}

output "app_url" {
  description = "Container App HTTPS URL."
  value       = "https://${module.container_app.fqdn}"
}
