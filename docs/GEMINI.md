# Gemini Context: Deeper Research Synthetic

This document provides essential context for the "Deeper Research Synthetic" project, an AI-powered content generation framework. The project is under active development with a focus on stabilizing the CI/CD pipeline and introducing new features.

## 1. Project Overview

This is a full-stack web application designed to transform raw data into comprehensive academic papers, podcast narratives, and risk assessments.

*   **Frontend**: A React 18 application built with Vite. It features a modern, responsive UI with a "Dracula" dark mode theme.
*   **Backend**: A Node.js/Express.js server that exposes a RESTful API. It handles business logic, communicates with AI providers, and manages content generation frameworks.
*   **AI**: The core content generation was originally powered by the Google Gemini Pro API, but is being expanded to support multiple providers.

The application is structured as a monorepo with distinct `frontend` and `backend` directories.

## 2. Project Status & Roadmap

Based on internal agent logs (`.agent-logs/`), the project is undergoing significant development.

### Recent Accomplishments
*   **Major UI/UX Overhaul**: The frontend has been updated with a modern design, improved layouts, and a comprehensive "Dracula" dark mode theme.
*   **Initial Test Infrastructure**: Basic testing setups for both the backend (Jest) and frontend (Vitest) have been established to enable CI/CD.

### In Progress
*   **CI/CD Pipeline Stabilization**: The primary focus is on fixing and stabilizing the GitHub Actions workflow. This involves writing more comprehensive tests and ensuring all pipeline jobs (build, test, scan, deploy) pass reliably.

### Upcoming Features
*   **Bring Your Own Key (BYOK)**: A major upcoming feature is to allow users to bring their own API keys for various AI providers, including **Venice AI**, OpenAI, and Anthropic, with Venice AI intended as the privacy-first default.
*   **Code Cleanup & Hardening**: A full code review is planned to improve error handling, add type safety (JSDoc/TypeScript), and fix bugs.

## 3. Building and Running

### Backend
*   **Installation**: `cd backend && npm install`
*   **Running (Dev)**: `npm run dev` (starts on `http://localhost:3001`)
*   **Testing**: `npm test` (using Jest)

### Frontend
*   **Installation**: `cd frontend && npm install`
*   **Running (Dev)**: `npm run dev` (starts on `http://localhost:5173`)
*   **Building**: `npm run build`
*   **Testing**: `npm test` (using Vitest)

### Prerequisites
*   Node.js >= 14.0.0
*   An API key for an AI provider (e.g., Google Gemini), configured in `backend/.env`.

## 4. Development Conventions

*   **Backend**: Follows standard Node.js/Express.js conventions. Business logic is separated into a `services` directory.
*   **Frontend**: Built with React functional components and hooks. API interactions are handled in the `src/services` directory.
*   **Testing**: The goal is to have comprehensive test coverage. The backend uses **Jest**, and the frontend uses **Vitest**.
*   **Key Documentation**:
    *   General project docs are in the `/docs` directory.
    *   The detailed development plan and progress logs can be found in the `.agent-logs/Progress&context/` directory, which provides critical insight into the project's trajectory.
