# WeddingOS — Production Secrets Reference

This document lists all secrets required before the first production deployment.
Set each one in **GitHub Settings → Secrets → Actions** (Repository secrets).

## Required GitHub Actions Secrets

| Secret Name | Description | Where to obtain |
|-------------|-------------|-----------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key for CD deployments | AWS Console → IAM → Users → Security credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | Same as above |
| `RAZORPAY_KEY_ID` | Razorpay live API key ID | [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys) → Live mode |
| `RAZORPAY_KEY_SECRET` | Razorpay live API key secret | Same as above |
| `RAZORPAY_ACCOUNT_NUMBER` | Razorpay X account number for payouts | Razorpay Dashboard → Banking → Payouts |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signing secret | Razorpay Dashboard → Webhooks |
| `SENDGRID_API_KEY` | SendGrid API key for email delivery | [SendGrid](https://app.sendgrid.com/settings/api_keys) |
| `MSG91_AUTH_KEY` | MSG91 authentication key for SMS/WhatsApp | [MSG91 Console](https://control.msg91.com/app/api) |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK JSON (base64-encoded) | Firebase Console → Project Settings → Service accounts |
| `OPENAI_API_KEY` | OpenAI API key for AI service | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `JWT_PRIVATE_KEY` | RS256 private key for JWT signing | Generate: `openssl genrsa -out private.pem 2048` |
| `JWT_PUBLIC_KEY` | RS256 public key for JWT verification | Generate: `openssl rsa -in private.pem -pubout -out public.pem` |
| `DB_PASSWORD` | PostgreSQL master password for RDS | Generate a strong random password (min 20 chars) |
| `REDIS_AUTH_TOKEN` | Redis AUTH token for ElastiCache | Generate: `openssl rand -hex 32` |
| `INTERNAL_API_KEY` | Shared secret for service-to-service calls | Generate: `openssl rand -hex 32` |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook for CD notifications | [Slack API Apps](https://api.slack.com/apps) → Incoming Webhooks |
| `SENTRY_DSN_BACKEND` | Sentry DSN for backend services | [Sentry.io](https://sentry.io) → Project → Settings → Client Keys |
| `SENTRY_DSN_WEB` | Sentry DSN for web frontend | Sentry.io → separate web project |
| `ECR_REGISTRY` | AWS ECR registry URL | AWS Console → ECR → Repositories |
| `AWS_REGION` | AWS region (e.g., ap-south-1) | Your deployment region |

## Terraform Variables (staging.tfvars / production.tfvars)

Store these in GitHub secrets and pass to `terraform apply -var-file=<file>`:

```hcl
# infrastructure/terraform/staging/staging.tfvars
image_tag              = "latest"
db_password            = "<from-secret-manager>"
razorpay_key_id        = "<RAZORPAY_KEY_ID>"
razorpay_key_secret    = "<RAZORPAY_KEY_SECRET>"
razorpay_account_number = "<RAZORPAY_ACCOUNT_NUMBER>"
sendgrid_api_key       = "<SENDGRID_API_KEY>"
msg91_auth_key         = "<MSG91_AUTH_KEY>"
firebase_admin_creds   = "<FIREBASE_SERVICE_ACCOUNT base64>"
openai_api_key         = "<OPENAI_API_KEY>"
```

## Service-Level Environment Variables

Each service reads secrets from environment variables at runtime. The Terraform modules
inject them via ECS task definition `environment` blocks. See `infrastructure/terraform/staging/main.tf`.

## First-Deploy Checklist

- [ ] AWS account set up with correct IAM permissions (ECS, RDS, ElastiCache, ALB, ECR)
- [ ] `weddingos-terraform-state` S3 bucket created in `ap-south-1`
- [ ] `weddingos-terraform-locks` DynamoDB table created
- [ ] All secrets above added to GitHub Actions
- [ ] Razorpay live mode enabled and KYC completed
- [ ] SendGrid domain verification completed
- [ ] Domain registered and Route53 hosted zone created
- [ ] SSL certificate issued via ACM
- [ ] `terraform init && terraform apply` run for staging
- [ ] Smoke tests passing on staging
- [ ] `terraform apply` run for production
- [ ] DNS records pointing to ALB
