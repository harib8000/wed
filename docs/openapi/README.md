# WeddingOS OpenAPI

Unified OpenAPI spec: `docs/openapi/openapi.yaml`

## View locally

### Swagger Editor
- Open https://editor.swagger.io/
- Paste the YAML contents

### Redoc CLI
```bash
npx redoc-cli serve docs/openapi/openapi.yaml
```

### Swagger UI in Docker
```bash
docker run --rm -p 8080:8080 \
  -e SWAGGER_JSON=/spec/openapi.yaml \
  -v "$PWD/docs/openapi:/spec" \
  swaggerapi/swagger-ui
```

Then open `http://localhost:8080`.

## Notes
- Paths are documented as unified gateway-facing routes.
- Chat Socket.IO events are not first-class OpenAPI operations; only HTTP chat endpoints are included.
- Internal routes may use `x-internal-api-key` or an admin bearer token.
