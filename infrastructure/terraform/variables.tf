# WeddingOS — Terraform Root Variables
# These variables are shared across staging and production.

variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment: staging or production"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}

variable "image_tag" {
  description = "Docker image tag (typically the Git commit SHA)"
  type        = string
}

variable "db_password" {
  description = "Master password for the RDS PostgreSQL instance"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret (HS256) or leave empty when using RS256 key files"
  type        = string
  sensitive   = true
  default     = ""
}

variable "razorpay_key_id" {
  description = "Razorpay Key ID"
  type        = string
  sensitive   = true
}

variable "razorpay_key_secret" {
  description = "Razorpay Key Secret"
  type        = string
  sensitive   = true
}

variable "sendgrid_api_key" {
  description = "SendGrid API key for transactional email"
  type        = string
  sensitive   = true
  default     = ""
}

variable "msg91_auth_key" {
  description = "MSG91 authentication key for SMS / WhatsApp"
  type        = string
  sensitive   = true
  default     = ""
}

variable "firebase_admin_credentials" {
  description = "Firebase Admin SDK JSON credentials (stringified)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API key for AI service"
  type        = string
  sensitive   = true
  default     = ""
}

variable "razorpay_account_number" {
  description = "Razorpay X account number for Payouts API"
  type        = string
  sensitive   = true
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones within the region"
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "cache_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "ecs_cpu" {
  description = "Default ECS task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_memory" {
  description = "Default ECS task memory in MiB"
  type        = number
  default     = 512
}
