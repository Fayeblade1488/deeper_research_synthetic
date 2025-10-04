/**
 * THE LENS - Main Application Component
 * 
 * Root React component for the Deeper Research Synthetic frontend.
 * Manages project state, sidebar navigation, and modal dialogs for project creation.
 * Serves as the primary interface to THE FORGE backend system.
 * 
 * @component
 * @author Paradroid AI
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import Workspace from './components/Workspace';
import './App.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/** @const {string} Base URL for THE FORGE API endpoints */
const API_URL = 'http://localhost:3001/api';

/**
 * Main Application Component
 * 
 * Manages the overall application state including projects list,
 * selected project, and project creation workflow.
 * 
 * @returns {JSX.Element} The complete application interface
 */
function App() {
    /** @type {[Array<Object>, Function]} List of all projects */
    const [projects, setProjects] = useState([]);
    
    /** @type {[Object|null, Function]} Currently selected project */
    const [selectedProject, setSelectedProject] = useState(null);
    
    /** @type {[boolean, Function]} Whether project creation modal is open */
    const [isCreating, setIsCreating] = useState(false);
    
    /** @type {[string, Function]} Name input for new project */
    const [newProjectName, setNewProjectName] = useState('');
    
    /** @type {[string, Function]} Framework selection for new project */
    const [newProjectFramework, setNewProjectFramework] = useState('PROJECT_DEEPDIVE');

    // Load projects on component mount
    useEffect(() => {
        fetchProjects();
    }, []);

    /**
     * Fetch all projects from THE FORGE backend
     * 
     * Retrieves the current list of projects and updates the component state.
     * Handles errors gracefully by logging to console.
     */
    const fetchProjects = async () => {
        try {
            const response = await fetch(`${API_URL}/projects`);
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    /**
     * Handle project creation form submission
     * 
     * Creates a new project with the specified name and framework,
     * updates the projects list, resets the form, closes the modal,
     * and automatically selects the new project.
     * 
     * @param {Event} e - Form submission event
     */
    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newProjectName, framework: newProjectFramework }),
            });
            const newProject = await response.json();
            setProjects([...projects, newProject]);
            setNewProjectName('');
            setNewProjectFramework('PROJECT_DEEPDIVE');
            setIsCreating(false);
            setSelectedProject(newProject);
        } catch (error) {
            console.error('Error creating project:', error);
        }
    };

    /**
     * Update a project's source context
     * 
     * Updates the source context for a specific project and refreshes
     * both the projects list and selected project state.
     * 
     * @param {string} projectId - Unique identifier of the project
     * @param {string} newContext - New source context content
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
     * Update a project with generated content and metadata
     * 
     * Saves generated content and associated metadata to a project,
     * updating both the projects list and selected project state.
     * 
     * @param {string} projectId - Unique identifier of the project
     * @param {string} content - Generated content text
     * @param {Object} metadata - Generation metadata (timing, validation, etc.)
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
     * Delete a project after user confirmation
     * 
     * Prompts the user for confirmation before permanently deleting a project.
     * Removes the project from the list and clears selection if it was selected.
     * 
     * @param {string} projectId - Unique identifier of the project to delete
     */
    const handleDeleteProject = async (projectId) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
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
                    <h1>Initiative: IRONCLAD</h1>
                    <p>Creation Interface</p>
                </div>
                <div className="project-list">
                    {projects.map(p => (
                        <div 
                            key={p.id} 
                            className={`project-item ${selectedProject?.id === p.id ? 'selected' : ''}`}
                            onClick={() => setSelectedProject(p)}
                        >
                            <h3>{p.name}</h3>
                            <p>{p.framework}</p>
                        </div>
                    ))}
                </div>
                <button className="new-project-btn" onClick={() => setIsCreating(true)}>+ New Project</button>
            </aside>

            <main className="main-content">
                <Workspace 
                    project={selectedProject} 
                    onUpdateContext={handleUpdateProjectContext}
                    onUpdateGeneratedContent={handleUpdateGeneratedContent}
                    onDeleteProject={handleDeleteProject}
                />
            </main>

            {isCreating && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Project</h2>
                        <form onSubmit={handleCreateProject}>
                            <label>Project Name</label>
                            <input 
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g., Analysis of Q2 Economic Trends"
                                required
                            />
                            <label>Select Framework</label>
                            <select 
                                value={newProjectFramework}
                                onChange={(e) => setNewProjectFramework(e.target.value)}
                            >
                                <option value="PROJECT_DEEPDIVE">PROJECT DEEPDIVE (TOME)</option>
                                <option value="PROJECT_SYNTHETIC">PROJECT SYNTHETIC (TRANSMISSION)</option>
                                <option value="PROJECT_BENCHMARK">PROJECT BENCHMARK (SNAPSHOT)</option>
                            </select>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsCreating(false)}>Cancel</button>
                                <button type="submit">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;