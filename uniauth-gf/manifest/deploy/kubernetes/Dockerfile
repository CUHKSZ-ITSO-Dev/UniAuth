FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY bin/linux_amd64/uniauth .
RUN chmod +x uniauth
CMD ["./uniauth"]