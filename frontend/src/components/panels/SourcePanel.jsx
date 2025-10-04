/**
 * @file This file contains the `SourcePanel` component, which provides a text area for users to input source material for content generation.
 * @author Paradroid AI
 * @version 1.0.0
 * 
 * @description This component renders a text area where users can provide source context for the content generation process.
 * It handles saving the source context to the project when the user finishes editing.
 */

import React, { useState, useEffect } from 'react';

/**
 * The source panel component.
 * This component renders a text area where users can provide source context for the content generation process.
 * It handles saving the source context to the project when the user finishes editing.
 *
 * @param {object} props - The props for the component.
 * @param {object} props.project - The currently selected project object.
 * @param {string} [props.title="Source Context"] - The title to display in the panel header.
 * @param {string} [props.description="Enter source material for generation"] - The description to display in the panel.
 * @returns {JSX.Element} The rendered source panel.
 */
function SourcePanel({ project, title = "Source Context", description = "Enter source material for generation" }) {
    const [sourceContext, setSourceContext] = useState(project?.sourceContext || '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setSourceContext(project?.sourceContext || '');
    }, [project?.sourceContext]);

    const handleSave = async () => {
        if (project && sourceContext !== project.sourceContext) {
            try {
                const response = await fetch(`http://localhost:3001/api/projects/${project.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sourceContext }),
                });
                if (!response.ok) {
                    throw new Error('Failed to save source context');
                }
                setIsEditing(false);
            } catch (error) {
                console.error('Error saving source context:', error);
                alert('Failed to save source context');
            }
        }
    };

    const handleKeyDown = (e) => {
        // Auto-save on Cmd/Ctrl+S
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <div className="panel">
            <div className="panel-header">
                <h3>
                    <span role="img" aria-label="source">📄</span> {title}
                </h3>
            </div>
            <div className="panel-content">
                <p>{description}</p>
                <textarea
                    value={sourceContext}
                    onChange={(e) => {
                        setSourceContext(e.target.value);
                        setIsEditing(true);
                    }}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your source material here. This will be used as input for the AI generation process. You can include research data, notes, questions, or any other relevant information."
                    className="source-input"
                />
                {isEditing && (
                    <div className="save-indicator">
                        <button 
                            className="btn-primary" 
                            onClick={handleSave}
                            style={{ marginTop: '10px' }}
                        >
                            Save Source Context
                        </button>
                        <small style={{ display: 'block', marginTop: '5px', color: '#7f8c8d' }}>
                            Press Cmd/Ctrl+S to save
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SourcePanel;