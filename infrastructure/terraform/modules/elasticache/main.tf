# modules/elasticache/main.tf — Redis ElastiCache module

variable "cluster_id"        { type = string }
variable "node_type"         { type = string; default = "cache.t3.micro" }
variable "num_cache_nodes"   { type = number; default = 1 }
variable "subnet_ids"        { type = list(string) }
variable "security_group_ids"{ type = list(string) }

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.cluster_id}-subnet-group"
  subnet_ids = var.subnet_ids
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = var.cluster_id
  description          = "WeddingOS Redis cluster"
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_nodes
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = var.security_group_ids
  at_rest_encryption_enabled  = true
  transit_encryption_enabled  = true
  auth_token_enabled          = true
  automatic_failover_enabled  = var.num_cache_nodes > 1
  multi_az_enabled            = var.num_cache_nodes > 1
  engine_version       = "7.0"

  tags = { Name = var.cluster_id }
}

output "primary_endpoint" { value = aws_elasticache_replication_group.redis.primary_endpoint_address }
output "reader_endpoint"  { value = aws_elasticache_replication_group.redis.reader_endpoint_address }
