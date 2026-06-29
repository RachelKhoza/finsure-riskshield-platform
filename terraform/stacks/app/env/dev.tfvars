environment              = "dev"
location                 = "southafricanorth"
location_short           = "san"
name_suffix              = "001"
image_tag                = "latest"
min_replicas             = 0
max_replicas             = 3
container_cpu            = 0.25
container_memory         = "0.5Gi"
http_concurrency         = 50
ingress_external_enabled = true
riskshield_timeout_ms    = 2500
riskshield_retries       = 2

tags = {
  cost_center = "platform-dev"
  criticality = "low"
}
