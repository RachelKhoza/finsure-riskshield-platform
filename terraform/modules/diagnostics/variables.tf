variable "name" {
  description = "Diagnostic setting name."
  type        = string
}

variable "target_resource_id" {
  description = "Resource ID to collect diagnostics from."
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Destination Log Analytics Workspace ID."
  type        = string
}

variable "log_category_group" {
  description = "Optional log category group, for example allLogs."
  type        = string
  default     = "allLogs"
}

variable "log_categories" {
  description = "Explicit diagnostic log categories to enable when category groups are not supported."
  type        = set(string)
  default     = []
}

variable "enable_metrics" {
  description = "Whether to collect AllMetrics."
  type        = bool
  default     = true
}
