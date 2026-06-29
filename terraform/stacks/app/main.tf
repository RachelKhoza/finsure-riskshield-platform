module "container_app" {
  source                                 = "../../modules/container_app"
  environment_name                       = local.names.container_env
  container_app_name                     = local.names.container_app
  location                               = var.location
  resource_group_name                    = data.azurerm_resource_group.this.name
  log_analytics_workspace_id             = data.azurerm_log_analytics_workspace.this.id
  identity_id                            = data.azurerm_user_assigned_identity.this.id
  acr_login_server                       = data.azurerm_container_registry.this.login_server
  riskshield_secret_uri                  = "${data.azurerm_key_vault.this.vault_uri}secrets/${var.riskshield_secret_name}"
  ingress_external_enabled               = var.ingress_external_enabled
  allowed_ip_ranges                      = var.allowed_ip_ranges
  min_replicas                           = var.min_replicas
  max_replicas                           = var.max_replicas
  http_concurrency                       = var.http_concurrency
  image_repository                       = var.image_repository
  image_tag                              = var.image_tag
  cpu                                    = var.container_cpu
  memory                                 = var.container_memory
  environment                            = var.environment
  riskshield_base_url                    = var.riskshield_base_url
  riskshield_timeout_ms                  = var.riskshield_timeout_ms
  riskshield_retries                     = var.riskshield_retries
  application_insights_connection_string = data.azurerm_application_insights.this.connection_string
  tags                                   = local.tags
}

module "container_app_diagnostics" {
  count                      = 0
  source                     = "../../modules/diagnostics"
  name                       = "diag-ca-to-law"
  target_resource_id         = module.container_app.id
  log_analytics_workspace_id = data.azurerm_log_analytics_workspace.this.id
}
