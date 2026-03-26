FROM golang:1.25 AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/worker ./worker

FROM docker:28-cli

COPY --from=build /out/worker /worker

ENTRYPOINT ["/worker"]
