environment                   = "prod"
location                      = "southafricanorth"
location_short                = "san"
name_suffix                   = "001"
acr_sku                       = "Basic"
log_retention_days            = 90
purge_protection_enabled      = true
public_network_access_enabled = true
# key_vault_secret_officer_object_ids = ["<azure-devops-service-principal-object-id>"]

tags = {
  cost_center = "platform-prod"
  criticality = "high"
}
