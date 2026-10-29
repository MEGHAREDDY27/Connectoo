FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .
RUN mkdir -p /var/lib/connectoo /app/database /app/public/uploads \
    && chown -R node:node /var/lib/connectoo /app/database /app/public/uploads

ENV PORT=3000
ENV DB_PATH=/var/lib/connectoo/connectoo.db
EXPOSE 3000

USER node
CMD ["npm", "start"]
