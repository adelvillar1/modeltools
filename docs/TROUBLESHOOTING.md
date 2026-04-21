# Troubleshooting

## Common Issues

### Docker build fails with canvas/pdkit native dependencies

**Problem**: Build fails with errors about `canvas` or `pdfkit` native dependencies.

**Solution**: Ensure Dockerfile includes all required Alpine packages:
```dockerfile
RUN apk add --no-cache \
    python3 \
    g++ \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    librsvg-dev
```

### Vision analysis returns "API key not set"

**Problem**: Tool fails with "ANTHROPIC_API_KEY environment variable not set".

**Solution**: Set the environment variable before running:
```bash
export ANTHROPIC_API_KEY=your_key_here
```

### File operations fail with "Security: Cannot access files outside working directory"

**Problem**: File read/write operations fail with security error.

**Solution**: This is expected behavior. The tools are sandboxed to the working directory for security. Use absolute paths within the project.

### npm publish fails with 2FA error

**Problem**: `npm publish` fails with "This operation requires a one-time password".

**Solution**: npm requires 2FA for publishing. Generate an OTP from your authenticator app and pass it:
```bash
npm publish --otp=123456
```

Or configure the GitHub Action with a granular access token that bypasses 2FA.

## Getting Help

- GitHub Issues: https://github.com/adelvillar1/modeltools/issues
- MCP Documentation: https://modelcontextprotocol.io/
