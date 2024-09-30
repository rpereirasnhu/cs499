
# CS 499 Capstone Project

## Introduction

This is a series of enhancements made upon a project from CS 340 - Client / Server Development.

## Docker

Although the backend can be started manually after transpilation and installing MongoDB directly on the local machine, Docker makes it easy to build and test temporary instances of software (which may be bound to permanent storage). By executing the './run.sh' script (on systems supporting a Bourne shell variant), Docker Compose will build the customized Node image (if necessary), pull the MongoDB image (also if necessary), and start the containers if everything is successful. Realistically, an NGINX container would be proxied behind our application and Mongo, but that separates the "raw" demonstration from the app itself. Additionally, the state of the database is preserved; this allows us to run the setup script once and start Mongo as many times as we need.

## Database

The 'mongo-setup.js' script is copied into the MongoDB container. The 'mongo-setup.sh' script can be run to execute this script from the host while the service is running.

## Enhancement One - Software Engineering

This enhancement is composed of the entire implementation of TypeScript and the Node.js and CDN modules used. The original program was written in Python (Jupyter) using Dash and Plotly.

Modules:
- Express (HTTP server)
- MongoDB (database driver)
- Tabulator (client-side table display and behavior)
- Chart.js (client-side graph displays)

## Environment

The default '.env' file included is sufficient for development purposes, although it's intended to be configured for a secure environment. Variables involved with secrets and authentication should be changed to secure values in a production environment. Configuration variables exist for better customization, though some are limited to definitions made in the 'compose.yaml' configuration (e.g. IP address subnet and range). The following environment variables must be defined for the server to work:
- DB_ROOT_USER
- DB_ROOT_PASS
- DB_APP_USER
- DB_APP_PASS
- APP_IP
- DB_IP
- HTTP_PORT
- DB_PORT