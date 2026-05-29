terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws"; version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "weddingos-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "weddingos-terraform-locks"
  }
}

provider "aws" {
  region = "ap-south-1"
  default_tags {
    tags = {
      Project     = "WeddingOS"
      Environment = "production"
      ManagedBy   = "Terraform"
    }
  }
}

# ── Variables ─────────────────────────────────────────────────────────────────

variable "image_tag"              { type = string }
variable "db_password"            { type = string; sensitive = true }
variable "jwt_secret"             { type = string; sensitive = true; default = "" }
variable "razorpay_key_id"        { type = string; sensitive = true }
variable "razorpay_key_secret"    { type = string; sensitive = true }
variable "razorpay_account_number"{ type = string; sensitive = true; default = "" }
variable "sendgrid_api_key"       { type = string; sensitive = true; default = "" }
variable "msg91_auth_key"         { type = string; sensitive = true; default = "" }
variable "firebase_admin_creds"   { type = string; sensitive = true; default = "" }
variable "openai_api_key"         { type = string; sensitive = true; default = "" }
variable "certificate_arn"        { type = string; default = "" }

locals {
  env          = "production"
  cluster_name = "weddingos-production"
  registry     = "ghcr.io/harib8000/weddingos"
  image_tag    = var.image_tag
}

# ── VPC ───────────────────────────────────────────────────────────────────────

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "weddingos-production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = false  # redundant NAT gateways for prod
  one_nat_gateway_per_az = true
  enable_dns_hostnames = true
}

# ── Security Groups ───────────────────────────────────────────────────────────

resource "aws_security_group" "services" {
  name   = "weddingos-production-services-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [module.alb.alb_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ── ALB ───────────────────────────────────────────────────────────────────────

module "alb" {
  source          = "../modules/alb"
  name            = "weddingos-production"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.public_subnets
  certificate_arn = var.certificate_arn
}

# ── RDS ───────────────────────────────────────────────────────────────────────

module "rds" {
  source             = "../modules/rds"
  identifier         = "weddingos-production-postgres"
  password           = var.db_password
  instance_class     = "db.t3.medium"
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  multi_az           = true
  deletion_protection= true
  backup_retention   = 14
  environment        = local.env
}

# ── ElastiCache (Redis) ───────────────────────────────────────────────────────

module "redis" {
  source             = "../modules/elasticache"
  cluster_id         = "weddingos-production-redis"
  node_type          = "cache.t3.small"
  num_cache_nodes    = 2
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
}

# ── ECS Cluster ───────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "main" {
  name = local.cluster_name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals { type = "Service"; identifiers = ["ecs-tasks.amazonaws.com"] }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "weddingos-production-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ── Shared env vars ────────────────────────────────────────────────────────────

locals {
  common_env = [
    { name = "NODE_ENV",           value = "production" },
    { name = "DATABASE_URL",       value = "postgresql://weddingos:${var.db_password}@${module.rds.endpoint}/${module.rds.db_name}" },
    { name = "REDIS_URL",          value = "rediss://:token@${module.redis.primary_endpoint}:6379" },
    { name = "RAZORPAY_KEY_ID",    value = var.razorpay_key_id },
    { name = "RAZORPAY_KEY_SECRET",value = var.razorpay_key_secret },
    { name = "SENDGRID_API_KEY",   value = var.sendgrid_api_key },
    { name = "MSG91_AUTH_KEY",     value = var.msg91_auth_key },
  ]
}

# ── ECS Services (desired_count = 2 in production) ────────────────────────────

module "auth_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "auth-service"
  image              = "${local.registry}-auth-service:${local.image_tag}"
  container_port     = 4001
  desired_count      = 2
  cpu                = 512
  memory             = 1024
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/production/auth-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4001" }])
}

module "booking_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "booking-service"
  image              = "${local.registry}-booking-service:${local.image_tag}"
  container_port     = 4004
  desired_count      = 2
  cpu                = 512
  memory             = 1024
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/production/booking-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4004" }])
}

module "payment_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "payment-service"
  image              = "${local.registry}-payment-service:${local.image_tag}"
  container_port     = 4005
  desired_count      = 2
  cpu                = 512
  memory             = 1024
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/production/payment-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [
    { name = "PORT",                    value = "4005" },
    { name = "RAZORPAY_ACCOUNT_NUMBER", value = var.razorpay_account_number },
  ])
}

module "vendor_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "vendor-service"
  image              = "${local.registry}-vendor-service:${local.image_tag}"
  container_port     = 4003
  desired_count      = 2
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/production/vendor-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4003" }])
}

module "notification_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "notification-service"
  image              = "${local.registry}-notification-service:${local.image_tag}"
  container_port     = 4008
  desired_count      = 2
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/production/notification-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [
    { name = "PORT",                       value = "4008" },
    { name = "FIREBASE_ADMIN_CREDENTIALS", value = var.firebase_admin_creds },
  ])
}

module "review_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "review-service"
  image              = "${local.registry}-review-service:${local.image_tag}"
  container_port     = 4009
  desired_count      = 2
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/production/review-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4009" }])
}

module "search_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "search-service"
  image              = "${local.registry}-search-service:${local.image_tag}"
  container_port     = 4011
  desired_count      = 2
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/production/search-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4011" }])
}

module "chat_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "chat-service"
  image              = "${local.registry}-chat-service:${local.image_tag}"
  container_port     = 4010
  desired_count      = 2
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/production/chat-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4010" }])
}

module "execution_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "execution-service"
  image              = "${local.registry}-execution-service:${local.image_tag}"
  container_port     = 4006
  desired_count      = 2
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/production/execution-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4006" }])
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "alb_dns_name"     { value = module.alb.alb_dns_name }
output "rds_endpoint"     { value = module.rds.endpoint }
output "redis_endpoint"   { value = module.redis.primary_endpoint }
output "ecs_cluster_name" { value = aws_ecs_cluster.main.name }
