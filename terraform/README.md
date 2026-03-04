# Terraform — smhi-visualizer

Provisions the cloud infrastructure for smhi-visualizer:

| Component | Provider | What it creates |
|-----------|----------|-----------------|
| ECR repository | AWS | Stores backend Docker images |
| ECS Fargate cluster + service | AWS | Runs the FastAPI container |
| Application Load Balancer | AWS | Exposes the backend publicly on port 80 |
| Security groups | AWS | Locks down traffic between ALB and ECS |
| CloudWatch log group | AWS | Streams container logs (14-day retention) |
| Vercel project | Vercel | Deploys the Next.js frontend |
| Vercel env vars | Vercel | Injects `BACKEND_URL` and `GOOGLE_MAPS_API_KEY` |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.6
- AWS credentials configured (e.g. `aws configure` or `AWS_*` env vars)
- A [Vercel API token](https://vercel.com/account/tokens)

## First-time setup

```bash
# 1. Copy the example vars file and fill in your values
cp terraform.tfvars.example terraform.tfvars

# 2. Initialise providers and modules
terraform init
```

## Deploy infrastructure

```bash
# Preview what Terraform will create/change
terraform plan

# Apply the changes
terraform apply
```

After `apply`, Terraform prints:

```
backend_alb_dns    = "smhi-visualizer-alb-<id>.<region>.elb.amazonaws.com"
backend_url        = "http://smhi-visualizer-alb-<id>.<region>.elb.amazonaws.com"
ecr_repository_url = "<account>.dkr.ecr.<region>.amazonaws.com/smhi-visualizer-backend"
vercel_project_id  = "<id>"
```

## Build and push the backend image

Run these commands from the project root after `terraform apply` has succeeded:

```bash
# Retrieve the ECR URL from Terraform output
ECR_URL=$(terraform -chdir=terraform output -raw ecr_repository_url)
AWS_REGION=$(terraform -chdir=terraform output -raw backend_alb_dns | cut -d. -f2)  # or set manually

# Authenticate Docker with ECR
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR_URL

# Build and push
docker build -t $ECR_URL:latest ./backend
docker push $ECR_URL:latest

# Force ECS to redeploy with the new image
aws ecs update-service \
  --cluster smhi-visualizer \
  --service smhi-visualizer-backend \
  --force-new-deployment \
  --region $AWS_REGION
```

## Tear down

```bash
terraform destroy
```

## Remote state (recommended for teams)

The configuration currently uses local state. For shared environments, add an S3
backend with DynamoDB locking to `providers.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-tfstate-bucket"
    key            = "smhi-visualizer/terraform.tfstate"
    region         = "eu-north-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```
