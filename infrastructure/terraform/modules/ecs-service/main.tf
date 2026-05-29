# modules/ecs-service/main.tf — reusable ECS Fargate service module

variable "cluster_id"        { type = string }
variable "cluster_name"      { type = string }
variable "service_name"      { type = string }
variable "image"             { type = string }
variable "container_port"    { type = number }
variable "cpu"               { type = number; default = 256 }
variable "memory"            { type = number; default = 512 }
variable "desired_count"     { type = number; default = 1 }
variable "subnet_ids"        { type = list(string) }
variable "security_group_ids"{ type = list(string) }
variable "task_role_arn"     { type = string; default = "" }
variable "execution_role_arn"{ type = string }
variable "environment_vars"  { type = list(object({ name = string, value = string })); default = [] }
variable "secrets"           { type = list(object({ name = string, valueFrom = string })); default = [] }
variable "target_group_arn"  { type = string; default = "" }
variable "log_group_name"    { type = string }
variable "aws_region"        { type = string }

locals {
  has_lb = var.target_group_arn != ""
}

resource "aws_cloudwatch_log_group" "service" {
  name              = var.log_group_name
  retention_in_days = 30
}

resource "aws_ecs_task_definition" "service" {
  family                   = "${var.cluster_name}-${var.service_name}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn != "" ? var.task_role_arn : null

  container_definitions = jsonencode([
    {
      name         = var.service_name
      image        = var.image
      portMappings = [{ containerPort = var.container_port, protocol = "tcp" }]
      environment  = var.environment_vars
      secrets      = var.secrets
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.log_group_name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = var.service_name
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "curl -sf http://localhost:${var.container_port}/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
}

resource "aws_ecs_service" "service" {
  name                               = var.service_name
  cluster                            = var.cluster_id
  task_definition                    = aws_ecs_task_definition.service.arn
  desired_count                      = var.desired_count
  launch_type                        = "FARGATE"
  health_check_grace_period_seconds  = local.has_lb ? 120 : null

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = false
  }

  dynamic "load_balancer" {
    for_each = local.has_lb ? [1] : []
    content {
      target_group_arn = var.target_group_arn
      container_name   = var.service_name
      container_port   = var.container_port
    }
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

output "service_name" { value = aws_ecs_service.service.name }
output "task_definition_arn" { value = aws_ecs_task_definition.service.arn }
