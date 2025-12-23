# Use lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files first (for better caching) to app folder.
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "src/server.js"]
