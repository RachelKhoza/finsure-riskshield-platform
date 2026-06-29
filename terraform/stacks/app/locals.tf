locals {
  base_name = lower("${var.workload}-${var.environment}-${var.location_short}-${var.name_suffix}")
  compact   = replace(local.base_name, "-", "")

  names = {
    resource_group       = "rg-${local.base_name}"
    acr                  = "acr${local.compact}"
    key_vault            = "kv-${var.workload}-${var.environment}-${var.name_suffix}"
    identity             = "id-${local.base_name}"
    log_analytics        = "log-${local.base_name}"
    application_insights = "appi-${local.base_name}"
    container_env        = "cae-${local.base_name}"
    container_app        = "ca-${local.base_name}"
  }

  tags = merge(
    {
      application         = "vendor-payment-risk-scoring"
      business_unit       = "sme-lending"
      data_classification = "confidential-pii"
      environment         = var.environment
      managed_by          = "terraform"
      owner               = "platform-engineering"
      workload            = var.workload
    },
    var.tags
  )
}
