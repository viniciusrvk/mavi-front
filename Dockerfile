# Stage 1: Build da aplicação React/Vite
FROM node:20-alpine AS build
WORKDIR /app

# Copiar arquivos de dependências primeiro (cache de layers)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copiar código-fonte e buildar
COPY . .

# VITE_API_URL vazio pois o Nginx fará proxy reverso para /api
ENV VITE_API_URL=""
ARG VITE_API_KEY=mavi-dev-key-123
ENV VITE_API_KEY=${VITE_API_KEY}

RUN npm run build

# Stage 2: Servir com Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remover config default do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar config customizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build da aplicação
COPY --from=build /app/dist .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
