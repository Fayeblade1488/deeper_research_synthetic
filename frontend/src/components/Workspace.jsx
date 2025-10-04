/**
 * Workspace Component - Dynamic Layout Manager
 * 
 * Main workspace component that dynamically renders the appropriate layout
 * based on the selected project's framework type. Acts as a router for
 * the three content generation frameworks.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object|null} props.project - Currently selected project object
 * @param {Function} props.onUpdateContext - Callback to update project source context
 * @param {Function} props.onUpdateGeneratedContent - Callback to save generated content
 * @param {Function} props.onDeleteProject - Callback to delete the current project
 * @returns {JSX.Element} Workspace interface with framework-specific layout
 */

import React from 'react';
import DeepdiveLayout from './layouts/DeepdiveLayout';
import SyntheticLayout from './layouts/SyntheticLayout';
import BenchmarkLayout from './layouts/BenchmarkLayout';

const Workspace = ({ project, onUpdateContext, onUpdateGeneratedContent, onDeleteProject }) => {
    // Show empty state when no project is selected
    if (!project) {
        return <div className="empty-state"><h2>Select a project or create a new one to begin.</h2></div>;
    }

    /**
     * Render the appropriate layout component based on project framework
     * 
     * Dynamically selects and renders the correct layout component for the
     * project's framework type (DEEPDIVE, SYNTHETIC, or BENCHMARK).
     * 
     * @returns {JSX.Element} Framework-specific layout component
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
                <button className="delete-btn" onClick={() => onDeleteProject(project.id)}>Delete Project</button>
            </div>
            <div className="project-details">
                <p><strong>ID:</strong> {project.id}</p>
                <p><strong>Framework:</strong> {project.framework}</p>
                <p><strong>Status:</strong> {project.status}</p>
            </div>
            {renderLayout()}
        </div>
    );
};

export default Workspace;
