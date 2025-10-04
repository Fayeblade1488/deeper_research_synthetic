/**
 * @file This file contains the `Workspace` component, which is responsible for rendering the main content area of the application.
 * @author Paradroid AI
 * @version 1.0.0
 * 
 * @description This component acts as a dynamic layout manager, selecting and rendering the appropriate layout based on the selected project's framework type.
 * It serves as a router for the different content generation frameworks (DEEPDIVE, SYNTHETIC, BENCHMARK).
 */

import React from 'react';
import DeepdiveLayout from './layouts/DeepdiveLayout';
import SyntheticLayout from './layouts/SyntheticLayout';
import BenchmarkLayout from './layouts/BenchmarkLayout';

/**
 * The main workspace component.
 * This component displays the details of the selected project and renders the appropriate layout for its framework type.
 * If no project is selected, it displays an empty state message.
 *
 * @param {object} props - The props for the component.
 * @param {object|null} props.project - The currently selected project object, or `null` if no project is selected.
 * @param {function} props.onUpdateContext - A callback function to update the source context of the project.
 * @param {function} props.onUpdateGeneratedContent - A callback function to save the generated content and metadata.
 * @param {function} props.onDeleteProject - A callback function to delete the current project.
 * @returns {JSX.Element} The rendered workspace interface.
 */
function Workspace({ project, onUpdateContext, onUpdateGeneratedContent, onDeleteProject }) {
    // Show empty state when no project is selected
    if (!project) {
        return <div className="empty-state"><h2>Select a project or create a new one to begin.</h2></div>;
    }

    /**
     * Renders the appropriate layout component based on the selected project's framework.
     * This function acts as a router, dynamically selecting and rendering the correct layout for the project's framework type.
     *
     * @returns {JSX.Element} The framework-specific layout component.
     */
    const renderLayout = () => {
        switch (project.framework) {
            case 'PROJECT_DEEPDIVE':
                return <DeepdiveLayout 
                    project={project} 
                    onUpdateGeneratedContent={onUpdateGeneratedContent} 
                />;
            case 'PROJECT_SYNTHETIC':
                return <SyntheticLayout 
                    project={project} 
                    onUpdateGeneratedContent={onUpdateGeneratedContent} 
                />;
            case 'PROJECT_BENCHMARK':
                return <BenchmarkLayout 
                    project={project} 
                    onUpdateGeneratedContent={onUpdateGeneratedContent} 
                />;
            default:
                return <div>Unknown project framework.</div>;
        }
    };

    return (
        <div className="workspace">
            <div className="workspace-header">
                <h2>{project.name}</h2>
                <button 
                    className="delete-btn" 
                    onClick={() => onDeleteProject(project.id)}
                    title="Delete project"
                >
                    🗑️ Delete
                </button>
            </div>
            
            <div className="project-details">
                <div className="project-detail-item">
                    <strong>Project ID</strong>
                    <span>{project.id.substring(0, 8)}...</span>
                </div>
                <div className="project-detail-item">
                    <strong>Framework</strong>
                    <span>{project.framework.replace('PROJECT_', '')}</span>
                </div>
                <div className="project-detail-item">
                    <strong>Status</strong>
                    <span>{project.status || 'New'}</span>
                </div>
                <div className="project-detail-item">
                    <strong>Created</strong>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            
            {renderLayout()}
        </div>
    );
};

export default Workspace;