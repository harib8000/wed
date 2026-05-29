# modules/rds/main.tf — PostgreSQL RDS instance module

variable "identifier"        { type = string }
variable "db_name"           { type = string; default = "weddingos" }
variable "username"          { type = string; default = "weddingos" }
variable "password"          { type = string; sensitive = true }
variable "instance_class"    { type = string; default = "db.t3.medium" }
variable "subnet_ids"        { type = list(string) }
variable "security_group_ids"{ type = list(string) }
variable "multi_az"          { type = bool; default = false }
variable "deletion_protection"{ type = bool; default = true }
variable "backup_retention"  { type = number; default = 7 }
variable "environment"       { type = string }

resource "aws_db_subnet_group" "rds" {
  name       = "${var.identifier}-subnet-group"
  subnet_ids = var.subnet_ids
}

resource "aws_db_instance" "postgres" {
  identifier              = var.identifier
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = var.instance_class
  db_name                 = var.db_name
  username                = var.username
  password                = var.password
  db_subnet_group_name    = aws_db_subnet_group.rds.name
  vpc_security_group_ids  = var.security_group_ids
  multi_az                = var.multi_az
  deletion_protection     = var.deletion_protection
  backup_retention_period = var.backup_retention
  skip_final_snapshot     = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "${var.identifier}-final-snapshot" : null
  storage_encrypted       = true
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_type            = "gp3"

  tags = { Name = var.identifier }
}

output "endpoint"    { value = aws_db_instance.postgres.endpoint }
output "db_name"     { value = aws_db_instance.postgres.db_name }
output "username"    { value = aws_db_instance.postgres.username }
