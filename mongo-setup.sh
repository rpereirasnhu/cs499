#!/bin/bash

# This script interacts with the 'mongo-setup.js' script in the mongo container.
docker exec -t spm-mongo-1 mongosh -f /mongo-setup.js --username "root" --password "pass123" --authenticationDatabase admin