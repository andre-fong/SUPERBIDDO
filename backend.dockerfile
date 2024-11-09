FROM --platform=linux/amd64 node:lts-slim AS build

RUN mkdir -p /app
WORKDIR /app
COPY ./backend /app
RUN npm install

FROM --platform=linux/amd64 node:lts-slim AS main
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3001
CMD ["npm","run","prod"]