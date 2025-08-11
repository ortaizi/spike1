#!/bin/bash
echo "Installing MCP servers for Spike project..."
npm install -g \
  @modelcontextprotocol/server-postgres \
  @modelcontextprotocol/server-filesystem \
  @modelcontextprotocol/server-git \
  @modelcontextprotocol/server-fetch \
  @modelcontextprotocol/server-memory
echo "MCP servers installed successfully!"