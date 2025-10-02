# Build stage
FROM golang:1.25-alpine AS builder

# Install swag for generating swagger docs
RUN go install github.com/swaggo/swag/cmd/swag@latest

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Generate swagger documentation
RUN swag init

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Copy the docs folder (contains swagger files)
COPY --from=builder /app/docs ./docs

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"]
