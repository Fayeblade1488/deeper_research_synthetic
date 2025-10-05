# Deeper Research Synthetic - Backend API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [API Endpoints](#api-endpoints)
   - [Project Management](#project-management)
   - [Content Generation](#content-generation)
   - [Server Status](#server-status)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

## Overview

This document provides detailed information about the Deeper Research Synthetic backend API. The API is built with Node.js and Express, and it provides endpoints for managing research projects and generating content using the Gemini AI.

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible. In a production environment, authentication should be implemented to secure the API.

## Base URL

The base URL for the API is:
```
http://localhost:3001/api
```

Replace `localhost:3001` with your actual server address when deploying.

## API Endpoints

### Project Management

#### GET `/projects`

Retrieve all projects.

**Request**
```
GET /api/projects
```

**Response**
```json
[
  {
    "id": "string",
    "name": "string",
    "framework": "PROJECT_DEEPDIVE|PROJECT_SYNTHETIC|PROJECT_BENCHMARK",
    "sourceContext": "string",
    "generatedContent": "string",
    "generationMetadata": {
      "framework": "string",
      "outputType": "string",
      "wordCount": 0,
      "generationTime": 0,
      "timestamp": "ISO timestamp",
      "validation": {}
    },
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp",
    "status": "string"
  }
]
```

**Status Codes**
- `200 OK` - Successfully retrieved projects
- `500 Internal Server Error` - Server error occurred

#### POST `/projects`

Create a new project.

**Request**
```
POST /api/projects
Content-Type: application/json

{
  "name": "string",
  "framework": "PROJECT_DEEPDIVE|PROJECT_SYNTHETIC|PROJECT_BENCHMARK"
}
```

**Response**
```json
{
  "id": "string",
  "name": "string",
  "framework": "PROJECT_DEEPDIVE|PROJECT_SYNTHETIC|PROJECT_BENCHMARK",
  "sourceContext": "string",
  "generatedContent": "string",
  "generationMetadata": null,
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "status": "New"
}
```

**Status Codes**
- `201 Created` - Successfully created project
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server error occurred

#### GET `/projects/{id}`

Retrieve a specific project by ID.

**Request**
```
GET /api/projects/{id}
```

**Response**
```json
{
  "id": "string",
  "name": "string",
  "framework": "PROJECT_DEEPDIVE|PROJECT_SYNTHETIC|PROJECT_BENCHMARK",
  "sourceContext": "string",
  "generatedContent": "string",
  "generationMetadata": {},
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "status": "string"
}
```

**Status Codes**
- `200 OK` - Successfully retrieved project
- `404 Not Found` - Project with specified ID not found
- `500 Internal Server Error` - Server error occurred

#### PUT `/projects/{id}`

Update a project.

**Request**
```
PUT /api/projects/{id}
Content-Type: application/json

{
  "sourceContext": "string",
  "generatedContent": "string",
  "generationMetadata": {}
}
```

**Response**
```json
{
  "id": "string",
  "name": "string",
  "framework": "PROJECT_DEEPDIVE|PROJECT_SYNTHETIC|PROJECT_BENCHMARK",
  "sourceContext": "string",
  "generatedContent": "string",
  "generationMetadata": {},
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "status": "string"
}
```

**Status Codes**
- `200 OK` - Successfully updated project
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Project with specified ID not found
- `500 Internal Server Error` - Server error occurred

#### DELETE `/projects/{id}`

Delete a project.

**Request**
```
DELETE /api/projects/{id}
```

**Response**
- Empty response with status code `204 No Content`

**Status Codes**
- `204 No Content` - Successfully deleted project
- `404 Not Found` - Project with specified ID not found
- `500 Internal Server Error` - Server error occurred

### Content Generation

#### POST `/generate/{projectId}`

Start content generation for a project with Server-Sent Events (SSE) streaming.

**Request**
```
POST /generate/{projectId}
Content-Type: application/json

{
  "project": {
    "id": "string",
    "name": "string",
    "framework": "PROJECT_DEEPDIVE|PROJECT_SYNTHETIC|PROJECT_BENCHMARK",
    "sourceContext": "string"
  }
}
```

**Response**
Server-Sent Events stream with updates in the following format:

Progress update:
```json
{
  "type": "progress",
  "wordCount": 0,
  "chunkCount": 0,
  "estimatedProgress": 0
}
```

Completion:
```json
{
  "type": "complete",
  "content": "string",
  "metadata": {
    "framework": "string",
    "outputType": "string",
    "wordCount": 0,
    "duration": 0,
    "timestamp": "ISO timestamp",
    "validation": {}
  }
}
```

Error:
```json
{
  "type": "error",
  "error": "string"
}
```

**Status Codes**
- `200 OK` - Generation started, updates sent via SSE
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Project with specified ID not found
- `409 Conflict` - Generation already in progress for this project
- `500 Internal Server Error` - Server error occurred

#### GET `/generate/{projectId}/status`

Check the status of generation for a project.

**Request**
```
GET /generate/{projectId}/status
```

**Response**
```json
{
  "active": true|false,
  "status": "string",
  "startTime": "timestamp",
  "duration": 0
}
```

**Status Codes**
- `200 OK` - Successfully retrieved generation status
- `404 Not Found` - Project with specified ID not found
- `500 Internal Server Error` - Server error occurred

#### DELETE `/generate/{projectId}`

Cancel active generation for a project.

**Request**
```
DELETE /generate/{projectId}
```

**Response**
```json
{
  "message": "Generation cancelled"
}
```

**Status Codes**
- `200 OK` - Successfully cancelled generation
- `404 Not Found` - No active generation found
- `500 Internal Server Error` - Server error occurred

### Server Status

#### GET `/status`

Retrieve the status of the backend server.

**Request**
```
GET /api/status
```

**Response**
```json
{
  "status": "THE FORGE is operational",
  "phase": "Operation COGNITION",
  "projectCount": 0,
  "geminiConfigured": true|false
}
```

**Status Codes**
- `200 OK` - Successfully retrieved server status
- `500 Internal Server Error` - Server error occurred

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- `200 OK` - The request was successful
- `201 Created` - The resource was successfully created
- `204 No Content` - The request was successful and there is no additional content to send
- `400 Bad Request` - The request was invalid or cannot be served
- `404 Not Found` - The requested resource could not be found
- `409 Conflict` - The request conflicts with the current state of the server
- `500 Internal Server Error` - An error occurred on the server

Error responses will include a JSON object with an error message:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Rate Limiting

Currently, the API does not implement rate limiting. In a production environment, rate limiting should be implemented to protect the server from abuse and ensure fair usage.

## Examples

### Creating a new project
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Analysis of Climate Change Impact",
    "framework": "PROJECT_DEEPDIVE"
  }'
```

### Starting content generation
```bash
curl -X POST http://localhost:3001/api/generate/project-id-123 \
  -H "Content-Type: application/json" \
  -d '{
    "project": {
      "id": "project-id-123",
      "name": "Analysis of Climate Change Impact",
      "framework": "PROJECT_DEEPDIVE",
      "sourceContext": "Climate change is affecting the planet in numerous ways..."
    }
  }'
```

### Updating a project
```bash
curl -X PUT http://localhost:3001/api/projects/project-id-123 \
  -H "Content-Type: application/json" \
  -d '{
    "sourceContext": "Updated source context with more recent data..."
  }'
```

### Deleting a project
```bash
curl -X DELETE http://localhost:3001/api/projects/project-id-123
```

This API documentation provides a comprehensive guide to using the Deeper Research Synthetic backend API. Developers should refer to this document when integrating with the API or developing new features.