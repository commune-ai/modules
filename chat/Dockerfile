
FROM node:18

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy application code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
