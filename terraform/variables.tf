variable "aws_region" {
  description = "AWS region to deploy resources into."
  type        = string
  default     = "eu-north-1"
}

variable "app_name" {
  description = "Base name used for all provisioned resources."
  type        = string
  default     = "smhi-visualizer"
}

variable "vercel_api_token" {
  description = "Vercel API token used by the Vercel Terraform provider."
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Optional Vercel team ID. Leave empty for personal accounts."
  type        = string
  default     = ""
}

variable "google_maps_api_key" {
  description = "Google Maps API key injected as a Vercel environment variable."
  type        = string
  sensitive   = true
}

variable "image_tag" {
  description = "Docker image tag for the backend container stored in ECR."
  type        = string
  default     = "latest"
}

variable "backend_cpu" {
  description = "CPU units for the ECS Fargate task (256 = 0.25 vCPU)."
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Memory in MiB for the ECS Fargate task."
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Number of ECS task replicas to keep running."
  type        = number
  default     = 1
}
