# FinSure RiskShield Integration Platform

Assessment-ready implementation for a secure vendor payment risk scoring integration on Azure.

## Live Dev Validation

The dev environment has been validated on Azure Container Apps in `southafricanorth`. It uses ACR for the container image, Key Vault for the RiskShield API key, managed identity for secret access, and Log Analytics/Application Insights for observability.

The live endpoint is intentionally not committed to the public README because it is internet-exposed. During review, provide the health/readiness URLs separately or tear the environment down after the review window.

## What Is Included

- `app/`: dependency-light Node.js REST API with `POST /validate`, health checks, structured JSON logs, correlation IDs, timeout handling, retry logic, and tests.
- `app/Dockerfile`: multi-stage production image, non-root runtime user, Alpine base, health check, no application dependencies.
- `terraform/`: reusable Azure modules and dev/prod stacks for Container Apps, ACR, Key Vault, managed identity, Log Analytics, and Application Insights. Container App logs are sent through the Container Apps Environment Log Analytics integration.
- `pipelines/azure-pipelines.yml`: Azure DevOps pipeline for test/build/push, Terraform provisioning, production approval, deployment, and smoke test.
- `docs/architecture.mmd`: Mermaid architecture diagram required by the assessment.

## Architecture

```mermaid
flowchart LR
  borrower["SME Loan Workflow"] -->|"POST /validate HTTPS + correlation ID"| app["Azure Container App\nRiskShield Integration API"]
  app -->|"POST /v1/score HTTPS\nx-api-key + correlation ID"| vendor["RiskShield API"]
  app -->|"versionless secret reference\nmanaged identity"| kv["Azure Key Vault\nriskshield-api-key"]
  app -->|"pull image\nmanaged identity AcrPull"| acr["Azure Container Registry"]
  app -->|"stdout JSON logs\nhealth/readiness probes"| logs["Log Analytics Workspace"]
  logs --> appi["Application Insights\nmetrics, traces, alerts"]
  ado["Azure DevOps Pipeline"] -->|"test, build, scan, push"| acr
  ado -->|"terraform apply"| rg["Azure Resource Group\nContainer Apps, ACR, KV, Observability"]
  ado -->|"masked secret variable"| kv
```

## API

`POST /validate`

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "idNumber": "9001011234088"
}
```

Returns:

```json
{
  "riskScore": 72,
  "riskLevel": "MEDIUM"
}
```

The service accepts or generates `x-correlation-id`, passes it to RiskShield, and returns it in the response header. Applicant ID numbers are masked in logs because they are PII.

## Run Locally

```bash
cd app
npm ci
npm test
npm run mock:riskshield
```

In another terminal:

```bash
cd app
RISKSHIELD_API_KEY=local-dev-key \
RISKSHIELD_BASE_URL=http://127.0.0.1:9090 \
npm start
```

Smoke test:

```bash
curl -sS -X POST http://127.0.0.1:8080/validate \
  -H 'content-type: application/json' \
  -H 'x-correlation-id: demo-001' \
  -d '{"firstName":"Jane","lastName":"Doe","idNumber":"9001011234088"}'
```

## Docker

```bash
cd app
docker build --platform linux/amd64 -t finsure-riskshield-service:local .
docker run --rm -p 8080:8080 \
  -e RISKSHIELD_API_KEY=local-dev-key \
  -e RISKSHIELD_BASE_URL=http://host.docker.internal:9090 \
  finsure-riskshield-service:local
```

Image choices:

- Multi-stage build runs tests before producing the runtime image.
- Runtime uses `node:22-alpine` and the built-in `node` non-root user.
- No application packages are pulled from npm, reducing supply-chain and patching surface.

## Terraform Deployment

Remote state is expected in Azure Storage. Bootstrap once:

```bash
az group create -n rg-finsure-tfstate -l southafricanorth
az storage account create \
  -g rg-finsure-tfstate \
  -n stfinsuretfstate001 \
  -l southafricanorth \
  --sku Standard_LRS \
  --https-only true \
  --min-tls-version TLS1_2
az storage container create \
  --account-name stfinsuretfstate001 \
  -n tfstate \
  --auth-mode login
```

Storage account names are globally unique, so adjust `stfinsuretfstate001` in the backend files if it is already taken. The tfvars default to `southafricanorth` for South African data residency; switch `location` if Container Apps is not enabled for your subscription in that region.

Deploy foundation:

```bash
cd terraform/stacks/foundation
terraform init -backend-config=../../backend.foundation.dev.hcl
terraform plan -var-file=env/dev.tfvars -out=tfplan
terraform apply tfplan
```

Seed the vendor secret without putting it in Terraform state:

```bash
KEY_VAULT_NAME="$(terraform output -raw key_vault_name)"
az keyvault secret set \
  --vault-name "$KEY_VAULT_NAME" \
  --name riskshield-api-key \
  --value "$RISKSHIELD_API_KEY"
```

With Key Vault RBAC enabled, the identity running this command needs `Key Vault Secrets Officer`. Set `key_vault_secret_officer_object_ids` in the foundation tfvars to the Azure DevOps service connection principal object ID, or grant an equivalent role through your normal access process.

Build and push the image:

```bash
ACR_NAME="$(terraform output -raw acr_name)"
ACR_LOGIN_SERVER="$(terraform output -raw acr_login_server)"
az acr login --name "$ACR_NAME"
docker build --platform linux/amd64 -t "$ACR_LOGIN_SERVER/riskshield-service:latest" ../../../app
docker push "$ACR_LOGIN_SERVER/riskshield-service:latest"
```

Deploy app:

```bash
cd ../app
terraform init -backend-config=../../backend.app.dev.hcl
terraform plan -var-file=env/dev.tfvars -var=image_tag=latest -out=tfplan
terraform apply tfplan
terraform output -raw app_url
```

Dev uses `min_replicas = 0` to reduce cost. Prod uses `min_replicas = 1` to avoid cold starts in a loan approval path.

## Azure DevOps

The assessment requires Azure DevOps, so the YAML is included at `pipelines/azure-pipelines.yml`. It automates the same flow used during manual validation:

1. Run Node.js tests.
2. Build and push the Docker image to ACR.
3. Run Terraform against the Azure Storage remote backend.
4. Seed the RiskShield API key into Key Vault from a masked pipeline variable.
5. Deploy the Container App.
6. Smoke test `/healthz`.

Required pipeline inputs:

- Service connection: `azureServiceConnection`
- ACR service connection: `acrServiceConnection`
- ACR login server: `acrLoginServer`
- Secret variable: `RiskShieldApiKey`
- Secret name variable: `riskShieldSecretName`

Backend config files must match the names referenced by the pipeline:

- `terraform/backend.app.dev.hcl`
- `terraform/backend.app.prod.hcl`
- `terraform/backend.foundation.dev.hcl`
- `terraform/backend.foundation.prod.hcl`

Use scoped Azure permissions for the service connection where possible: state storage access on the Terraform backend storage account, contributor access on the workload resource group, and Key Vault secret write access only on the project vault.

## Security Considerations

- Secret handling: RiskShield API key is stored in Key Vault and injected into Container Apps through a managed identity Key Vault reference. It is not stored in code, container image, or Terraform state.
- Identity: User-assigned managed identity has only `AcrPull` on ACR and `Key Vault Secrets User` on the vault.
- Transport: Container Apps ingress disables insecure HTTP and exposes HTTPS.
- PII: `idNumber` is validated and masked in logs. Responses do not echo applicant details.
- Observability: structured logs include correlation ID, vendor latency, retry attempts, and sanitized error codes.
- Network: public ingress can be restricted with `allowed_ip_ranges`; production can move to internal Container Apps Environment and private endpoints if the lending workflow is inside a private network.
- Operations: readiness checks fail when the vendor secret is missing; liveness checks avoid restarting the app for vendor outages.

## Threat Model Summary

| Threat | Mitigation |
| --- | --- |
| API key leakage | Key Vault storage, managed identity access, no secret in Terraform state or image. |
| PII leakage | No applicant payload logging; ID number masking; `cache-control: no-store`. |
| Vendor outage or slow response | Short timeout, bounded retries with jitter, 502/503/504 mapping. |
| Replay or unauthorised caller | HTTPS-only baseline; add Entra ID auth/API Management before internet-facing production use. |
| Overly broad cloud permissions | Least-privilege role assignments scoped to ACR and Key Vault. |
| Cost runaway | Consumption Container Apps, small CPU/memory, max replica caps, ACR Basic, retention by environment. |

## Trade-Offs

- Azure Container Apps was chosen over AKS to avoid cluster management overhead and cost for a single integration service.
- The app has no external npm dependencies. That keeps the image small and reviewable, but a larger API would likely move to Fastify or NestJS for routing and schema management.
- Dev can scale to zero for savings. Prod keeps one warm replica because loan approval latency matters.
- The example deploys direct public HTTPS ingress for assessment simplicity. A production fintech deployment would usually front this with API Management, Entra ID, WAF rules, and private networking where the calling system allows it.
