# Base image
FROM node:18

# Working directory
WORKDIR /usr/src/app

# Copy package.json & package-lock.json first (for caching)
COPY package*.json ./

# Install only missing deps, reuse existing if cached
RUN npm install --legacy-peer-deps || true

# Copy rest of app
COPY . .

# Install missing deps again (if new)
RUN npm install --legacy-peer-deps || true

# Expose port
EXPOSE 8192

# Start app
CMD ["npm", "start"]
