FROM node:14-alpine
WORKDIR /app
COPY . /app
RUN npm install
RUN chmod 777 -R ./routes/agendas
CMD ["npm", "start"]