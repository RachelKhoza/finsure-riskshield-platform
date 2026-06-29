environment              = "prod"
location                 = "southafricanorth"
location_short           = "san"
name_suffix              = "001"
image_tag                = "latest"
min_replicas             = 1
max_replicas             = 10
container_cpu            = 0.25
container_memory         = "0.5Gi"
http_concurrency         = 40
ingress_external_enabled = true
riskshield_timeout_ms    = 2000
riskshield_retries       = 2

tags = {
  cost_center = "platform-prod"
  criticality = "high"
}
