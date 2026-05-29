# WeddingOS — Shared Terraform locals (provider + backend config)
# Each environment directory calls this via module reference.

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "WeddingOS"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
