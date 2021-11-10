## BUILD STAGE
FROM node:14 as build-stage

WORKDIR /app

# Update platform dependencies
RUN apt-get update && apt-get install libsecret-1-0 -y

# Prepare native plugin
COPY ./cordova/cordova-plugin-moodleapp/package*.json /app/cordova/cordova-plugin-moodleapp/
RUN npm ci --prefix cordova/cordova-plugin-moodleapp
COPY ./cordova/cordova-plugin-moodleapp/ /app/cordova/cordova-plugin-moodleapp/
RUN npm run prod --prefix cordova/cordova-plugin-moodleapp

# Prepare node dependencies
COPY package*.json ./
RUN npm ci

# Build source
ARG build_command="npm run build:prod"
COPY . /app
RUN ${build_command}

## SERVE STAGE
FROM nginx:alpine as serve-stage

# Copy assets & config
COPY --from=build-stage /app/www /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
HEALTHCHECK --interval=10s --timeout=4s CMD curl -f http://localhost/assets/env.json || exit 1
