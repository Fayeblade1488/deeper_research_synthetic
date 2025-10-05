/**
 * @file This file contains the main application component for "THE LENS", the frontend for the Deeper Research Synthetic project.
 * @author Paradroid AI
 * @version 1.0.0
 * 
 * @description This root React component manages the overall application state, including the list of projects, the currently selected project, and the user interface for creating new projects.
 * It communicates with "THE FORGE" backend to fetch, create, update, and delete projects.
 */

import React, { useState, useEffect } from 'react';
import Workspace from './components/Workspace';
import './App.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/** @const {string} Base URL for THE FORGE API endpoints */
const API_URL = 'http://localhost:3001/api';

/**
 * The main application component with modern UI design.
 * This component manages the application's overall state, including the list of projects, the currently selected project, and the project creation workflow.
 * It renders a modern, responsive interface with improved UX for project navigation and content generation.
 *
 * @returns {JSX.Element} The rendered application interface with enhanced UI.
 */
function App() {
    /** @type {[Array<Object>, Function]} List of all projects */
    const [projects, setProjects] = useState([]);
    
    /** @type {[Object|null, Function]} Currently selected project */
    const [selectedProject, setSelectedProject] = useState(null);
    
    /** @type {[boolean, Function]} Whether project creation modal is open */
    const [isCreating, setIsCreating] = useState(false);
    const [uiError, setUiError] = useState(null);
    
    /** @type {[string, Function]} Name input for new project */
    const [newProjectName, setNewProjectName] = useState('');
    
    /** @type {[string, Function]} Framework selection for new project */
    const [newProjectFramework, setNewProjectFramework] = useState('PROJECT_DEEPDIVE');

    // Load projects on component mount
    useEffect(() => {
        fetchProjects();
    }, []);

    /**
     * Fetches the list of all projects from the backend API.
     * The fetched projects are then used to update the component's state.
     * Errors during the fetch operation are logged to the console.
     */
    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_URL}/projects`);
            if (!response.ok) {
                throw new Error(`Fetch projects failed: ${response.status}`);
            }
            const data = await response.json();
            setProjects(data);
            setUiError(null);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setUiError('Failed to fetch projects');
        }
    };

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
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newProjectName, framework: newProjectFramework }),
            });
            if (!response.ok) {
                throw new Error(`Create project failed: ${response.status}`);
            }
            const newProject = await response.json();
            // functional updates avoid stale closures
            setProjects(prev => [...prev, newProject]);
            setNewProjectName('');
            setNewProjectFramework('PROJECT_DEEPDIVE');
            setSelectedProject(newProject);
            setIsCreating(false);
            setUiError(null);
        } catch (error) {
            console.error('Error creating project:', error);
            setUiError('Failed to create project');
        }
    };

    /**
     * Updates the source context of a specific project.
     * It sends a PUT request to the backend to update the project with the new context.
     * Upon successful update, it refreshes both the projects list and the selected project in the component's state.
     *
     * @param {string} projectId - The unique identifier of the project to be updated.
     * @param {string} newContext - The new source context to be saved.
     */
    const handleUpdateProjectContext = async (projectId, newContext) => {
        try {
            const response = await fetch(`${API_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceContext: newContext })
            });
            const updatedProject = await response.json();
            // Update the project in the list and the selected project
            setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
            setSelectedProject(updatedProject);
        } catch (error) {
            console.error('Error updating project context:', error);
        }
    };

    /**
     * Updates a project with newly generated content and its associated metadata.
     * It sends a PUT request to the backend to save the generated content and metadata to the project.
     * Upon successful update, it refreshes both the projects list and the selected project in the component's state.
     *
     * @param {string} projectId - The unique identifier of the project to be updated.
     * @param {string} content - The generated content to be saved.
     * @param {Object} metadata - The metadata associated with the generation process (e.g., timing, validation results).
     */
    const handleUpdateGeneratedContent = async (projectId, content, metadata) => {
        try {
            const response = await fetch(`${API_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    generatedContent: content,
                    generationMetadata: metadata
                })
            });
            const updatedProject = await response.json();
            // Update the project in the list and the selected project
            setProjects(projects.map(p => p.id === projectId ? updatedProject : p));
            setSelectedProject(updatedProject);
        } catch (error) {
            console.error('Error updating generated content:', error);
        }
    };

    /**
     * Deletes a project after receiving user confirmation.
     * It sends a DELETE request to the backend to remove the project.
     * Upon successful deletion, it removes the project from the projects list and clears the selection if the deleted project was the currently selected one.
     *
     * @param {string} projectId - The unique identifier of the project to be deleted.
     */
    const handleDeleteProject = async (projectId) => {
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await fetch(`${API_URL}/projects/${projectId}`, { method: 'DELETE' });
                setProjects(projects.filter(p => p.id !== projectId));
                if (selectedProject?.id === projectId) {
                    setSelectedProject(null);
                }
            } catch (error) {
                console.error('Error deleting project:', error);
            }
        }
    };

    return (
        <div className="app-container">
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
                    >
                        <span role="img" aria-label="add">➕</span> New Project
                    </button>
                </div>

                <div className="project-list">
                    {projects.length === 0 ? (
                        <div className="empty-state">
                            <div role="img" aria-label="empty" className="empty-icon">📚</div>
                            <p>No projects yet</p>
                            <p className="subtext">Create your first project to get started</p>
                        </div>
                    ) : (
                        projects.map(p => (
                            <div 
                                key={p.id} 
                                className={`project-item ${selectedProject?.id === p.id ? 'selected' : ''}`}
                                onClick={() => setSelectedProject(p)}
                                title={p.name}
                            >
                                <div className="project-info">
                                    <h3 className="project-name">{p.name}</h3>
                                    <div className="project-meta">
                                        <span className={`framework-tag ${p.framework.toLowerCase().replace('project_', '')}`}>
                                            {p.framework.replace('PROJECT_', '')}
                                        </span>
                                        <span className="project-status">
                                            {p.status || 'New'}
                                        </span>
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
                {uiError && (
                  <div role="alert" className="error-banner">
                    {uiError}
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
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="frameworkSelect">Framework Type</label>
                                <select 
                                    id="frameworkSelect"
                                    value={newProjectFramework}
                                    onChange={(e) => setNewProjectFramework(e.target.value)}
                                >
                                    <option value="PROJECT_DEEPDIVE"> PROJECT DEEPDIVE (Academic Paper)</option>
                                    <option value="PROJECT_SYNTHETIC"> PROJECT SYNTHETIC (Podcast Script)</option>
                                    <option value="PROJECT_BENCHMARK"> PROJECT BENCHMARK (Risk Assessment)</option>
                                </select>
                            </div>
                            
                            <div className="form-info">
                                <div className="framework-info">
                                    <div className="info-item deepdive">
                                        <strong>PROJECT DEEPDIVE:</strong> Academic-style research papers with citations, minimum 10,000 words, 5+ sections
                                    </div>
                                    <div className="info-item synthetic">
                                        <strong>PROJECT SYNTHETIC:</strong> Narrative podcast episodes with storytelling, minimum 15,000 words, "Good morning" opener
                                    </div>
                                    <div className="info-item benchmark">
                                        <strong>PROJECT BENCHMARK:</strong> Data-driven risk assessments with DEFCON ratings, minimum 5,000 words, 10+ data tables
                                    </div>
                                </div>
                            </div>
                            
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-secondary" 
                                    onClick={() => setIsCreating(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <div className="status-bar">
                <div className="status-item connected">
                    <span role="img" aria-label="connection">📡</span>
                    <span>Backend Connected</span>
                </div>
                <div className="status-item">
                    <span role="img" aria-label="projects">📚</span>
                    <span>{projects.length} Projects</span>
                </div>
                <div className="status-item">
                    <span role="img" aria-label="ai">🤖</span>
                    <span>AI Ready</span>
                </div>
                <div className="status-item">
                    <span role="img" aria-label="user">👤</span>
                    <span>User: Researcher</span>
                </div>
            </div>
        </div>
    );
}

export default App;