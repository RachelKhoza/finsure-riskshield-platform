variable "environment_name" {
  description = "Container Apps Environment name."
  type        = string
}

variable "container_app_name" {
  description = "Container App name."
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

variable "log_analytics_workspace_id" {
  description = "Log Analytics Workspace resource ID."
  type        = string
}

variable "infrastructure_subnet_id" {
  description = "Optional infrastructure subnet ID for private Container Apps Environment."
  type        = string
  default     = null
}

variable "internal_load_balancer_enabled" {
  description = "Use an internal Container Apps Environment."
  type        = bool
  default     = false
}

variable "identity_id" {
  description = "User-assigned managed identity resource ID."
  type        = string
}

variable "acr_login_server" {
  description = "ACR login server."
  type        = string
}

variable "riskshield_secret_uri" {
  description = "Versionless Key Vault secret URI for the RiskShield API key."
  type        = string
}

variable "ingress_external_enabled" {
  description = "Expose Container App externally."
  type        = bool
  default     = true
}

variable "allowed_ip_ranges" {
  description = "Optional public ingress IP allow-list."
  type        = list(string)
  default     = []
}

variable "min_replicas" {
  description = "Minimum app replicas."
  type        = number
}

variable "max_replicas" {
  description = "Maximum app replicas."
  type        = number
}

variable "http_concurrency" {
  description = "HTTP concurrent requests per replica before scaling."
  type        = number
  default     = 50
}

variable "image_repository" {
  description = "Container image repository."
  type        = string
}

variable "image_tag" {
  description = "Container image tag."
  type        = string
}

variable "cpu" {
  description = "Container CPU allocation."
  type        = number
  default     = 0.25
}

variable "memory" {
  description = "Container memory allocation."
  type        = string
  default     = "0.5Gi"
}

variable "environment" {
  description = "Application environment."
  type        = string
}

variable "riskshield_base_url" {
  description = "RiskShield base URL."
  type        = string
}

variable "riskshield_timeout_ms" {
  description = "RiskShield request timeout."
  type        = number
}

variable "riskshield_retries" {
  description = "RiskShield retry count."
  type        = number
}

variable "application_insights_connection_string" {
  description = "Application Insights connection string."
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}
