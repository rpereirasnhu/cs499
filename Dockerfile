
# use node image
FROM node:latest

# set pwd
WORKDIR /app/

# copy files
COPY ./src/ /app/src/
COPY ./package.json /app/package.json
COPY ./package-lock.json /app/package-lock.json
COPY ./tsconfig.json /app/tsconfig.json
COPY ./build.sh /app/build.sh

# build
RUN ./build.sh

# run
EXPOSE 8080
CMD ["node", "."]