FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Install build dependencies first
RUN apt-get update && apt-get install -y \
    curl \
    git \
    make \
    gcc \
    postgresql-client \
    redis-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Go 1.22 — auto detect ARM64 or AMD64
RUN ARCH=$(dpkg --print-architecture) \
    && if [ "$ARCH" = "arm64" ]; then GO_ARCH="arm64"; else GO_ARCH="amd64"; fi \
    && curl -fsSL https://go.dev/dl/go1.22.3.linux-${GO_ARCH}.tar.gz \
    | tar -C /usr/local -xzf - \
    && echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/bash.bashrc \
    && echo 'export GOPATH=/go' >> /etc/bash.bashrc \
    && echo 'export PATH=$PATH:/go/bin' >> /etc/bash.bashrc

# Install Node.js 20 via nvm
RUN su vscode -c "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash \
    && . /home/vscode/.nvm/nvm.sh \
    && nvm install 20 \
    && nvm use 20 \
    && nvm alias default 20"

# Install Go tools (pinned versions, ARM64 compatible)
RUN /usr/local/go/bin/go install golang.org/x/tools/gopls@v0.15.3 \
    && /usr/local/go/bin/go install github.com/go-delve/delve/cmd/dlv@latest \
    && /usr/local/go/bin/go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.57.2

# Set Go environment
ENV GOPATH=/go
ENV GOROOT=/usr/local/go
ENV PATH=$PATH:/usr/local/go/bin:/go/bin

# Create go directory with proper permissions
RUN mkdir -p /go && chown -R vscode:vscode /go

USER vscode