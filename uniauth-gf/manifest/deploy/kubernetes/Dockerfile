FROM alpine:latest

WORKDIR /root/

RUN apk add --no-cache ca-certificates tzdata

COPY bin/linux_amd64/uniauth .

CMD ["./uniauth"]