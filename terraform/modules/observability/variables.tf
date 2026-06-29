variable "log_analytics_name" {
  description = "Log Analytics Workspace name."
  type        = string
}

variable "application_insights_name" {
  description = "Application Insights name."
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

variable "log_retention_days" {
  description = "Log retention period."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}
