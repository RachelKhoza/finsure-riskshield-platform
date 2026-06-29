variable "subscription_id" {
  description = "Azure subscription ID. Can be omitted when ARM_SUBSCRIPTION_ID is set."
  type        = string
  default     = null
}

variable "environment" {
  description = "Deployment environment."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be dev or prod."
  }
}

variable "workload" {
  description = "Short workload name used in Azure resource names."
  type        = string
  default     = "finsure-rs"
}

variable "name_suffix" {
  description = "Short suffix for globally unique resource names."
  type        = string
}

variable "location" {
  description = "Azure region."
  type        = string
}

variable "location_short" {
  description = "Short region code used in names."
  type        = string
}

variable "acr_sku" {
  description = "Azure Container Registry SKU."
  type        = string
  default     = "Basic"
}

variable "public_network_access_enabled" {
  description = "Enable public network access for ACR and Key Vault. Restrict with allow-lists or private endpoints for production."
  type        = bool
  default     = true
}

variable "allowed_ip_ranges" {
  description = "Optional IP allow-list for public Key Vault access."
  type        = list(string)
  default     = []
}

variable "purge_protection_enabled" {
  description = "Enable Key Vault purge protection."
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Log Analytics retention."
  type        = number
  default     = 30
}

variable "enable_diagnostic_settings" {
  description = "Enable Azure Monitor diagnostic settings where supported."
  type        = bool
  default     = true
}

variable "key_vault_secret_officer_object_ids" {
  description = "Object IDs allowed to set/update Key Vault secrets, for example the Azure DevOps service connection principal."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common Azure tags."
  type        = map(string)
  default     = {}
}
