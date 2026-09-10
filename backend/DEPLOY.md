# Backend deployment (AWS SAM → Lambda + Function URL)

The API is a single Lambda fronted by a Lambda **Function URL** (no API Gateway).
[`template.yaml`](template.yaml) creates the Lambda, its execution role (least-privilege S3
access), the Function URL, and a log group with 14-day retention.

The **S3 bucket is not created by the stack** — it is a pre-existing, privately-managed
bucket passed in by name. This keeps stored data safe from `sam delete`.

## Prerequisites (one-time)

### AWS resources

- A private S3 bucket in `ap-south-1` — Block Public Access on, SSE-S3 encryption.
  Default name: `clymlens-weather-data-20260910`.
- (Recommended) a lifecycle rule to expire `weather-data/` objects after 90 days:

  ```bash
  aws s3api put-bucket-lifecycle-configuration \
    --bucket clymlens-weather-data-20260910 \
    --lifecycle-configuration '{"Rules":[{"ID":"expire-weather-data","Status":"Enabled","Filter":{"Prefix":"weather-data/"},"Expiration":{"Days":90}}]}'
  ```

### Tooling

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  configured with credentials that can deploy CloudFormation / Lambda / IAM / Logs
  (`aws configure`, region `ap-south-1`).
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).
- Docker running (`sam build --use-container` builds Linux wheels from any host).

## Deploy

```bash
cd backend
sam build --use-container
sam deploy --guided        # first run: region ap-south-1, stack name "clymlens",
                           # WeatherBucketName = your bucket
```

`--guided` writes the chosen values into `samconfig.toml`; later deploys are just:

```bash
sam build --use-container && sam deploy
```

Stack outputs:

- **FunctionUrl** — the API base URL. Set it as `VITE_API_BASE_URL` in the frontend.
- **BucketName** — echo of the bucket the API uses.

Do not invoke the function until the stack reaches `CREATE_COMPLETE`, so CloudFormation
creates the log group before Lambda would.

## Wire CORS to the deployed frontend

The frontend origin is only known after its first Vercel deploy, so:

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
- Add the 90-day S3 lifecycle rule (above) if not already set.
- Create a **$1/month** AWS Budgets alert (Billing console → Budgets) as a backstop.

## Tear down

```bash
sam delete                 # removes the Lambda, role, and log group only
# the S3 bucket and its contents are left untouched
```
