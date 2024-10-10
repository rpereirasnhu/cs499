
# use node image
FROM node:latest

# set pwd
WORKDIR /app/

# copy files
COPY ./dist/ /app/dist/
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json

# build
RUN npm i

# run
EXPOSE 8080
CMD ["node", "."]