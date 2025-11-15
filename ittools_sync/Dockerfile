FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --chmod=0755 ittools_sync .

CMD ["./ittools_sync"]