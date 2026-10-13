FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json server.mjs ai-provider.mjs schemas.mjs catalog.json ./
RUN mkdir /app/data && chown -R node:node /app
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATA_DIR=/app/data
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server.mjs"]
