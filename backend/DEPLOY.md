# Backend deployment (AWS SAM → Lambda + Function URL)

The API is a single Lambda fronted by a Lambda **Function URL** (no API Gateway).
Everything it needs — the S3 bucket, IAM role, and log group with 14-day retention —
is created by [`template.yaml`](template.yaml).

## Prerequisites (one-time)

- An AWS account and an IAM user/role with permission to deploy CloudFormation, Lambda,
  S3, IAM, and CloudWatch Logs.
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  configured: `aws configure` (region `ap-south-1`).
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
- Docker running (used by `sam build --use-container` to produce Linux wheels from any host).

## Deploy

```bash
cd backend
sam build --use-container
sam deploy --guided        # first run: region ap-south-1, stack name "clymlens"
```

`--guided` writes real values into `samconfig.toml`; later deploys are just:

```bash
sam build --use-container && sam deploy
```

Note the stack outputs:

- **FunctionUrl** — the API base URL. Set it as `VITE_API_BASE_URL` in the frontend.
- **BucketName** — the S3 bucket the API writes to.

Do not invoke the function until the stack reaches `CREATE_COMPLETE`, so CloudFormation
creates the log group before Lambda would.

## Wire CORS to the deployed frontend

The frontend origin is only known after its first deploy, so:

1. Deploy this backend, copy **FunctionUrl**.
2. Deploy the frontend with `VITE_API_BASE_URL=<FunctionUrl>`, copy its `*.vercel.app` URL.
3. Redeploy the backend with that origin:

   ```bash
   sam deploy --parameter-overrides \
     "CorsOrigins=https://<project>.vercel.app" \
     "CorsOriginRegex=^https://.*clymlens.*\.vercel\.app$"
   ```

## Verify

```bash
curl "<FunctionUrl>/health"          # -> {"status":"ok","env":"production",...}
```

Then run the full flow from the live dashboard: fetch & store → list → open → chart/table.

## Cost controls

- Log group retention is 14 days (in the template).
- S3 lifecycle expires `weather-data/` objects after 90 days.
- Create a **$1/month** AWS Budgets alert (Billing console → Budgets) as a backstop.

## Tear down

```bash
sam delete        # empties nothing — empty the bucket first if it has objects
```
