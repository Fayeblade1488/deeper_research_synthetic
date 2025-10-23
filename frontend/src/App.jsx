/**
 * @file This file contains the main application component for "THE LENS", the frontend for the Deeper Research Synthetic project.
 * @author Paradroid AI
 * @version 2.0.0
 *
 * @description This root React component manages the overall application state using React Context for better state management.
 * It communicates with "THE FORGE" backend to fetch, create, update, and delete projects.
 */

import React, { useState } from "react";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./App.css";
import Workspace from "./components/Workspace";

// Import context providers
import { ProjectProvider, useProject } from "./context/ProjectContext";
import { GenerationProvider, useGeneration } from "./context/GenerationContext";

/**
 * The main application component with modern UI design.
 * This component manages the application's overall state using React Context for better state management.
 * It renders a modern, responsive interface with improved UX for project navigation and content generation.
 *
 * @returns {JSX.Element} The rendered application interface with enhanced UI.
 */
function App() {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <ProjectProvider>
      <GenerationProvider>
        <div className="app-container">
          <AppContent 
            isCreating={isCreating}
            setIsCreating={setIsCreating}
          />
        </div>
      </GenerationProvider>
    </ProjectProvider>
  );
}

/**
 * Application content component that uses context
 * @param {Object} props - Component props
 * @param {boolean} props.isCreating - Whether project creation modal is open
 * @param {Function} props.setIsCreating - Function to set project creation modal state
 */
function AppContent({ isCreating, setIsCreating }) {
  const [uiError, setUiError] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectFramework, setNewProjectFramework] = useState("PROJECT_DEEPDIVE");

  // Get project context
  const { 
    projects, 
    selectedProject, 
    setSelectedProject, 
    createProject, 
    updateProject, 
    deleteProject,
    loading,
    error
  } = useProject();

  // Get generation context
  const { 
    isGenerating, 
    progress, 
    error: generationError,
    generateContent,
    cancelActiveGeneration
  } = useGeneration();

  /**
   * Handles the submission of the new project form.
   * It sends a POST request to the backend to create a new project with the specified name and framework.
   * Upon successful creation, it updates the projects list, resets the form fields, closes the creation modal, and selects the newly created project.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const newProject = await createProject(newProjectName, newProjectFramework);
      setNewProjectName("");
      setNewProjectFramework("PROJECT_DEEPDIVE");
      setIsCreating(false);
      setUiError(null);
    } catch (error) {
      console.error("Error creating project:", error);
      setUiError("Failed to create project");
    }
  };

  /**
   * Updates the source context of a specific project.
   * It sends a PUT request to the backend to update the project with the new data.
   * Upon successful update, it refreshes both the projects list and the selected project in the component's state.
   *
   * @param {string} projectId - The unique identifier of the project to update.
   * @param {string} newContext - The new source context to be saved.
   */
  const handleUpdateProjectContext = async (projectId, newContext) => {
    try {
      const updatedProject = await updateProject(projectId, { sourceContext: newContext });
      setSelectedProject(updatedProject);
    } catch (error) {
      console.error("Error updating project context:", error);
      setUiError("Failed to update project context");
    }
  };

  /**
   * Updates a project with newly generated content and its associated metadata.
   * It sends a PUT request to the backend to save the generated content and metadata to the project.
   * Upon successful update, it refreshes both the projects list and the selected project in the component's state.
   *
   * @param {string} projectId - The unique identifier of the project to update.
   * @param {string} content - The generated content to be saved.
   * @param {Object} metadata - The metadata associated with the generation process (e.g., timing, validation results).
   */
  const handleUpdateGeneratedContent = async (projectId, content, metadata) => {
    try {
      const updatedProject = await updateProject(projectId, {
        generatedContent: content,
        generationMetadata: metadata,
      });
      setSelectedProject(updatedProject);
    } catch (error) {
      console.error("Error updating generated content:", error);
      setUiError("Failed to update generated content");
    }
  };

  /**
   * Deletes a project after receiving user confirmation.
   * It sends a DELETE request to the backend to remove the project.
   * Upon successful deletion, it removes the project from the projects list and clears the selection if the deleted project was the currently selected one.
   *
   * @param {string} projectId - The unique identifier of the project to delete.
   */
  const handleDeleteProject = async (projectId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error("Error deleting project:", error);
        setUiError("Failed to delete project");
      }
    }
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">🔬</div>
            <div>
              <h1>Deeper Research</h1>
              <div className="app-subtitle">AI-Powered Content Generation</div>
            </div>
          </div>
        </div>

        <div className="controls-section">
          <div className="section-header">
            <h3>Projects</h3>
            <span className="project-count">{projects.length}</span>
          </div>
          <button
            className="new-project-btn"
            onClick={() => setIsCreating(true)}
            title="Create new project"
            disabled={loading}
          >
            <span role="img" aria-label="add">
              ➕
            </span>{" "}
            New Project
          </button>
        </div>

        <div className="project-list">
          {projects.length === 0 ? (
            <div className="empty-state">
              <div role="img" aria-label="empty" className="empty-icon">
                📚
              </div>
              <p>No projects yet</p>
              <p className="subtext">
                Create your first project to get started
              </p>
            </div>
          ) : (
            projects.map((p) => (
              <div
                key={p.id}
                className={`project-item ${
                  selectedProject?.id === p.id ? "selected" : ""
                }`}
                onClick={() => setSelectedProject(p)}
                title={p.name}
              >
                <div className="project-info">
                  <h3 className="project-name">{p.name}</h3>
                  <div className="project-meta">
                    <span
                      className={`framework-tag ${p.framework
                        .toLowerCase()
                        .replace("project_", "")}`}
                    >
                      {p.framework.replace("PROJECT_", "")}
                    </span>
                    <span className="project-status">{p.status || "New"}</span>
                  </div>
                  {p.updatedAt && (
                    <div className="project-updated">
                      Updated: {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="project-actions">
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(p.id);
                    }}
                    title="Delete project"
                    disabled={loading}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="main-content">
        {(uiError || error || generationError) && (
          <div role="alert" className="error-banner">
            {uiError || error || generationError}
          </div>
        )}
        <Workspace
          project={selectedProject}
          onUpdateContext={handleUpdateProjectContext}
          onUpdateGeneratedContent={handleUpdateGeneratedContent}
          onDeleteProject={handleDeleteProject}
        />
      </main>

      {isCreating && (
        <div className="modal-overlay" onClick={() => setIsCreating(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button
                className="modal-close"
                onClick={() => setIsCreating(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="projectName">Project Name</label>
                <input
                  id="projectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="frameworkSelect">Framework Type</label>
                <select
                  id="frameworkSelect"
                  value={newProjectFramework}
                  onChange={(e) => setNewProjectFramework(e.target.value)}
                  disabled={loading}
                >
                  <option value="PROJECT_DEEPDIVE">
                    {" "}
                    PROJECT DEEPDIVE (Academic Paper)
                  </option>
                  <option value="PROJECT_SYNTHETIC">
                    {" "}
                    PROJECT_SYNTHETIC (Podcast Script)
                  </option>
                  <option value="PROJECT_BENCHMARK">
                    {" "}
                    PROJECT_BENCHMARK (Risk Assessment)
                  </option>
                </select>
              </div>

              <div className="form-info">
                <div className="framework-info">
                  <div className="info-item deepdive">
                    <strong>PROJECT_DEEPDIVE:</strong> Academic-style research
                    papers with citations, minimum 10,000 words, 5+ sections
                  </div>
                  <div className="info-item synthetic">
                    <strong>PROJECT_SYNTHETIC:</strong> Narrative podcast
                    episodes with storytelling, minimum 15,000 words, "Good
                    morning" opener
                  </div>
                  <div className="info-item benchmark">
                    <strong>PROJECT_BENCHMARK:</strong> Data-driven risk
                    assessments with DEFCON ratings, minimum 5,000 words, 10+
                    data tables
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreating(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="status-bar">
        <div className={`status-item ${loading ? "loading" : "connected"}`}>
          <span role="img" aria-label="connection">
            {loading ? "🔄" : "📡"}
          </span>
          <span>{loading ? "Loading..." : "Backend Connected"}</span>
        </div>
        <div className="status-item">
          <span role="img" aria-label="projects">
            📚
          </span>
          <span>{projects.length} Projects</span>
        </div>
        <div className={`status-item ${isGenerating ? "generating" : "ready"}`}>
          <span role="img" aria-label="ai">
            {isGenerating ? "⚡" : "🤖"}
          </span>
          <span>
            {isGenerating ? "Generating..." : "AI Ready"}
            {progress && ` (${progress.wordCount || 0} words)`}
          </span>
        </div>
        <div className="status-item">
          <span role="img" aria-label="user">
            👤
          </span>
          <span>User: Researcher</span>
        </div>
      </div>
    </>
  );
}

export default App;