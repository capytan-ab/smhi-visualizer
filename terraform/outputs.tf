output "backend_alb_dns" {
  description = "Public DNS name of the ALB fronting the FastAPI backend."
  value       = aws_lb.backend.dns_name
}

output "backend_url" {
  description = "Full HTTP URL of the backend API."
  value       = "http://${aws_lb.backend.dns_name}"
}

output "ecr_repository_url" {
  description = "ECR repository URL for pushing backend Docker images."
  value       = aws_ecr_repository.backend.repository_url
}

output "vercel_project_id" {
  description = "Vercel project ID for the frontend."
  value       = vercel_project.frontend.id
}
