### compilation stage
FROM node:latest AS build

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN mkdir /build
WORKDIR /build

COPY package.json .
RUN npm install

COPY . .
RUN npm run build

### runtime stage — polyfea spa-base hosts the bundle
FROM ghcr.io/polyfea/spa-base
COPY --from=build /build/www /spa/public

ENV OTEL_SERVICE_NAME=orp-or-planner-ufe
ENV SPA_BASE_PORT=8080
EXPOSE 8080
