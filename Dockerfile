# Use Deno official image
FROM denoland/deno:1.45.0

# Set working directory
WORKDIR /app

# Copy dependency files
COPY deno.json ./

# Copy source code
COPY src ./src
COPY server.ts .

# Expose port for webhook (adjust as needed)
EXPOSE 8000

# Set environment variables (these should be overridden at runtime)
ENV BOT_TOKEN=""
ENV CHAT_ID=""
ENV API_WALLET_ADDRESS=""
ENV ASTER_PRIVATE_KEY=""
ENV SUPABASE_URL=""
ENV SUPABASE_PUBLIC_KEY=""

# Run the server in production mode (webhook)
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "server.ts"]
