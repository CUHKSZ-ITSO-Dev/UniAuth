FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --chmod=0755 bin/linux_amd64/uniauth .
CMD ["./uniauth"]