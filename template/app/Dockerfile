# Use Node.js base image
FROM node:20-bookworm

# Install curl, bash, and git
RUN apt-get update && apt-get install -y curl bash git && rm -rf /var/lib/apt/lists/*

# Install Wasp CLI globally
RUN curl -sSL https://get.wasp-lang.dev/installer.sh | sh

# Add Wasp to PATH
ENV PATH="/root/.local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy dependency configs
COPY package.json ./

# Copy the rest of the application files
COPY . .

# Expose dev ports: 3000 for frontend, 3001 for backend
EXPOSE 3000 3001

# Start the Wasp development server
CMD ["wasp", "start"]
