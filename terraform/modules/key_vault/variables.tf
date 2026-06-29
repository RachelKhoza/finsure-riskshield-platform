variable "name" {
  description = "Key Vault name."
  type        = string
}

variable "location" {
  description = "Azure region."
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name."
  type        = string
}

variable "purge_protection_enabled" {
  description = "Enable purge protection. Recommended for production."
  type        = bool
  default     = true
}

variable "soft_delete_retention_days" {
  description = "Soft delete retention period."
  type        = number
  default     = 90
}

variable "public_network_access_enabled" {
  description = "Whether Key Vault has public network access enabled."
  type        = bool
  default     = true
}

variable "allowed_ip_ranges" {
  description = "Optional public IP allow-list for Key Vault."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}
