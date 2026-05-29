terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws"; version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "weddingos-terraform-state"
    key            = "staging/terraform.tfstate"
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
      Environment = "staging"
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

locals {
  env          = "staging"
  cluster_name = "weddingos-staging"
  registry     = "ghcr.io/harib8000/weddingos"
  image_tag    = var.image_tag
}

# ── VPC ───────────────────────────────────────────────────────────────────────

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "weddingos-staging-vpc"
  cidr = "10.1.0.0/16"

  azs             = ["ap-south-1a", "ap-south-1b"]
  private_subnets = ["10.1.1.0/24", "10.1.2.0/24"]
  public_subnets  = ["10.1.101.0/24", "10.1.102.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true  # single NAT saves cost in staging
  enable_dns_hostnames = true
}

# ── Security Groups ───────────────────────────────────────────────────────────

resource "aws_security_group" "services" {
  name   = "weddingos-staging-services-sg"
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
  source     = "../modules/alb"
  name       = "weddingos-staging"
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets
}

# ── RDS ───────────────────────────────────────────────────────────────────────

module "rds" {
  source             = "../modules/rds"
  identifier         = "weddingos-staging-postgres"
  password           = var.db_password
  instance_class     = "db.t3.micro"
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  multi_az           = false
  deletion_protection= false
  backup_retention   = 3
  environment        = local.env
}

# ── ElastiCache (Redis) ───────────────────────────────────────────────────────

module "redis" {
  source             = "../modules/elasticache"
  cluster_id         = "weddingos-staging-redis"
  node_type          = "cache.t3.micro"
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

# IAM execution role for ECS tasks
data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals { type = "Service"; identifiers = ["ecs-tasks.amazonaws.com"] }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "weddingos-staging-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ── Shared env vars injected into every service ────────────────────────────────

locals {
  common_env = [
    { name = "NODE_ENV",           value = "staging" },
    { name = "DATABASE_URL",       value = "postgresql://weddingos:${var.db_password}@${module.rds.endpoint}/${module.rds.db_name}" },
    { name = "REDIS_URL",          value = "rediss://:token@${module.redis.primary_endpoint}:6379" },
    { name = "RAZORPAY_KEY_ID",    value = var.razorpay_key_id },
    { name = "RAZORPAY_KEY_SECRET",value = var.razorpay_key_secret },
    { name = "SENDGRID_API_KEY",   value = var.sendgrid_api_key },
    { name = "MSG91_AUTH_KEY",     value = var.msg91_auth_key },
  ]
}

# ── ECS Services ──────────────────────────────────────────────────────────────

module "auth_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "auth-service"
  image              = "${local.registry}-auth-service:${local.image_tag}"
  container_port     = 4001
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/auth-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4001" }])
}

module "user_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "user-service"
  image              = "${local.registry}-user-service:${local.image_tag}"
  container_port     = 4002
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/user-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4002" }])
}

module "vendor_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "vendor-service"
  image              = "${local.registry}-vendor-service:${local.image_tag}"
  container_port     = 4003
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/vendor-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4003" }])
}

module "booking_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "booking-service"
  image              = "${local.registry}-booking-service:${local.image_tag}"
  container_port     = 4004
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/booking-service"
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
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/payment-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [
    { name = "PORT",                    value = "4005" },
    { name = "RAZORPAY_ACCOUNT_NUMBER", value = var.razorpay_account_number },
  ])
}

module "notification_service" {
  source             = "../modules/ecs-service"
  cluster_id         = aws_ecs_cluster.main.id
  cluster_name       = local.cluster_name
  service_name       = "notification-service"
  image              = "${local.registry}-notification-service:${local.image_tag}"
  container_port     = 4008
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/notification-service"
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
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/review-service"
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
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/search-service"
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
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/chat-service"
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
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.services.id]
  execution_role_arn = aws_iam_role.ecs_execution.arn
  log_group_name     = "/weddingos/staging/execution-service"
  aws_region         = "ap-south-1"
  environment_vars   = concat(local.common_env, [{ name = "PORT", value = "4006" }])
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "alb_dns_name"     { value = module.alb.alb_dns_name }
output "rds_endpoint"     { value = module.rds.endpoint }
output "redis_endpoint"   { value = module.redis.primary_endpoint }
output "ecs_cluster_name" { value = aws_ecs_cluster.main.name }
