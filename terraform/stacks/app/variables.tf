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

variable "image_repository" {
  description = "Container image repository in ACR."
  type        = string
  default     = "riskshield-service"
}

variable "image_tag" {
  description = "Container image tag."
  type        = string
}

variable "riskshield_secret_name" {
  description = "Key Vault secret name containing the RiskShield API key."
  type        = string
  default     = "riskshield-api-key"
}

variable "riskshield_base_url" {
  description = "RiskShield base URL."
  type        = string
  default     = "https://api.riskshield.com"
}

variable "riskshield_timeout_ms" {
  description = "RiskShield request timeout."
  type        = number
  default     = 2500
}

variable "riskshield_retries" {
  description = "RiskShield retry count."
  type        = number
  default     = 2
}

variable "min_replicas" {
  description = "Minimum Container App replicas."
  type        = number
}

variable "max_replicas" {
  description = "Maximum Container App replicas."
  type        = number
}

variable "container_cpu" {
  description = "Container CPU allocation."
  type        = number
  default     = 0.25
}

variable "container_memory" {
  description = "Container memory allocation."
  type        = string
  default     = "0.5Gi"
}

variable "http_concurrency" {
  description = "HTTP concurrent requests per replica before scaling."
  type        = number
  default     = 50
}

variable "ingress_external_enabled" {
  description = "Expose the Container App publicly."
  type        = bool
  default     = true
}

variable "allowed_ip_ranges" {
  description = "Optional public ingress IP allow-list."
  type        = list(string)
  default     = []
}

variable "enable_diagnostic_settings" {
  description = "Enable Azure Monitor diagnostic settings where supported."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Common Azure tags."
  type        = map(string)
  default     = {}
}
