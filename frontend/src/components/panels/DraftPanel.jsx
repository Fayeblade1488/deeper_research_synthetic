import React from 'react';

const DraftPanel = ({ project, content, title = 'Outline & Draft', isGenerating = false }) => {
    const handleContentChange = (e) => {
        // This would be connected to a state management system to update the project content
        // For now, we'll just disable editing during generation
    };

    return (
        <div className="panel draft-panel">
            <h3>{title}</h3>
            <div className="draft-content-wrapper">
                {isGenerating && (
                    <div className="generating-overlay">
                        <div className="generating-indicator">Generating content...</div>
                    </div>
                )}
                <textarea 
                    value={content || ''}
                    onChange={handleContentChange}
                    placeholder={`Generated content for ${project?.name || 'selected project'} will appear here...`}
                    readOnly={isGenerating}
                    className={isGenerating ? 'generating' : ''}
                />
            </div>
        </div>
    );
};

export default DraftPanel;
