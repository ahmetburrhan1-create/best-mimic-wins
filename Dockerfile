FROM node:20-bookworm-slim

# Install system dependencies: Python3, pip, and ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp for AI scene extractor
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp || true

WORKDIR /app

# Copy root and package manifests
COPY package.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install server and client dependencies
RUN npm install --prefix server
RUN npm install --prefix client

# Copy the rest of the application
COPY . .

# Build client production bundle
RUN npm run build --prefix client

# Expose default port
ENV PORT=3001
EXPOSE 3001

# Start the fullstack application
CMD ["npm", "start"]
