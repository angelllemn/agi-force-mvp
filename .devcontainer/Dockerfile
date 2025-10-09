FROM mcr.microsoft.com/devcontainers/typescript-node:20

# Install PostgreSQL client tools for psql access inside the container
RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get install -y --no-install-recommends postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
