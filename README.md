
# CS 499 Capstone Project

## Introduction

This is a series of enhancements made upon a project from CS 340 - Client / Server Development.

## Docker

Although the backend can be started manually after transpilation and installing MongoDB directly on the local machine, Docker makes it easy to build and test temporary instances of software (which may be bound to permanent storage). By executing the './run.sh' script (on systems supporting a Bourne shell variant), Docker Compose will build the customized Node image (if necessary), pull the MongoDB image (also if necessary), and start the containers if everything is successful. Realistically, an NGINX container would be proxied behind our application and Mongo, but that separates the "raw" demonstration from the app itself. Additionally, the state of the database is preserved; this allows us to run the setup script once and start Mongo as many times as we need.

## Database

The 'mongo-setup.js' script is copied into the MongoDB container. The 'mongo-setup.sh' script can be run to execute this script from the host while the service is running.
There are two collections used: 'spm' and 'users', the former used to store process data and the latter used to store user authentication credentials (only one user is added).

## Enhancement One - Software Engineering

This enhancement is composed of the entire implementation of TypeScript and the Node.js and CDN modules used. The original program was written in Python (Jupyter) using Dash and Plotly.

Modules:
- Express (HTTP server)
- MongoDB (database driver)
- Tabulator (client-side table display and behavior)
- Chart.js (client-side graph displays)

## Enhancement Two - Data Structures and Algorithms

This enhancement is dedicated to the process scheduling aspects of the frontend.
Essentially, each process scheduling algorithm step can be broken down into three loops:
1. Move all starting processes from 'unstarted' list into process queue.
2. Increment process run times and terminate finished processes. Also useful for transferring active processes back to queue for preemptive algorithms.
3. Transfer queued processes to 'active' as intended by the specific algorithm.

The C code must be compiled to WebAssembly during the build process. Emscripten can be installed using the instructions on the following page:
https://emscripten.org/docs/getting_started/downloads.html

This will clone the repository locally, and the build script should carry the rest (including the updates). As long as the repository is cloned here, the build script should work.

## Enhancement Three - Databases

This enhancement implements the authentication mechanism using the scrypt hash function and 24-hour JSON web tokens. This also adds the "owner" field for the pie chart to better represent data based on frequency. The "users" collection is also made useful through adding a default user if one doesn't already exist.
The default username is 'default' and the password is 'default123'. The backend logic may be verified by reinitializing the database data and setting alternative environment variables.
To remove the persistent database volume to reset the data, run 'docker volume rm spm_db_data' while the container is inactive.

## Environment

The default '.env' file included is sufficient for development purposes, although it's intended to be configured for a secure environment. Variables involved with secrets and authentication should be changed to secure values in a production environment. Configuration variables exist for better customization, though some are limited to definitions made in the 'compose.yaml' configuration (e.g. IP address subnet and range). The following environment variables must be defined for the server to work:
- DB_APP_USER
- DB_APP_PASS
- APP_DEFAULT_USER
- APP_DEFAULT_PASS
- APP_DEFAULT_SALT
- APP_COOKIE_SECRET
- APP_JWT_SECRET
- APP_IP
- DB_IP
- HTTP_PORT
- DB_PORT
- NODE_ENV
