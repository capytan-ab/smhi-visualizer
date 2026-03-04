resource "vercel_project" "frontend" {
  name      = var.app_name
  framework = "nextjs"

  # Optional: set team_id when deploying under a Vercel team
  team_id = var.vercel_team_id != "" ? var.vercel_team_id : null
}

resource "vercel_project_environment_variable" "backend_url" {
  project_id = vercel_project.frontend.id
  team_id    = var.vercel_team_id != "" ? var.vercel_team_id : null
  key        = "BACKEND_URL"
  value      = "http://${aws_lb.backend.dns_name}"
  target     = ["production", "preview", "development"]
}

resource "vercel_project_environment_variable" "google_maps_api_key" {
  project_id = vercel_project.frontend.id
  team_id    = var.vercel_team_id != "" ? var.vercel_team_id : null
  key        = "GOOGLE_MAPS_API_KEY"
  value      = var.google_maps_api_key
  target     = ["production", "preview", "development"]
  sensitive  = true
}
