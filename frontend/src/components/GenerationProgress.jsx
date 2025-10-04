import React from 'react';

const GenerationProgress = ({ progress, project }) => {
    if (!progress) {
        return (
            <div className="panel generation-progress-panel">
                <h3>Generation Progress</h3>
                <p>Ready to begin content generation.</p>
            </div>
        );
    }

    const renderProgress = () => {
        switch (progress.type) {
            case 'start':
                return (
                    <div className="progress-content">
                        <div className="status">Initializing generation...</div>
                    </div>
                );
            
            case 'progress':
                return (
                    <div className="progress-content">
                        <div className="progress-bar-container">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${Math.min(progress.estimatedProgress, 100)}%` }}
                                ></div>
                            </div>
                            <div className="progress-percent">{Math.round(progress.estimatedProgress)}%</div>
                        </div>
                        <div className="progress-stats">
                            <div className="stat">
                                <span className="label">Words:</span>
                                <span className="value">{progress.wordCount}</span>
                            </div>
                            <div className="stat">
                                <span className="label">Chunks:</span>
                                <span className="value">{progress.chunkCount}</span>
                            </div>
                        </div>
                    </div>
                );
            
            case 'complete':
                return (
                    <div className="progress-content">
                        <div className="status success">Generation Complete!</div>
                        <div className="completion-stats">
                            <div className="stat">
                                <span className="label">Words:</span>
                                <span className="value">{progress.wordCount}</span>
                            </div>
                            <div className="stat">
                                <span className="label">Duration:</span>
                                <span className="value">{progress.duration ? `${progress.duration.toFixed(1)}s` : 'N/A'}</span>
                            </div>
                        </div>
                        {progress.validation && (
                            <div className="validation-results">
                                {progress.validation.valid ? (
                                    <div className="validation-success">
                                        ✓ Content meets framework requirements
                                    </div>
                                ) : (
                                    <div className="validation-errors">
                                        <div className="validation-fail">⚠ Validation Issues:</div>
                                        <ul>
                                            {progress.validation.errors.map((error, idx) => (
                                                <li key={idx} className="error">{error}</li>
                                            ))}
                                        </ul>
                                        {progress.validation.warnings.length > 0 && (
                                            <ul className="warnings">
                                                {progress.validation.warnings.map((warning, idx) => (
                                                    <li key={idx} className="warning">{warning}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            
            case 'error':
                return (
                    <div className="progress-content">
                        <div className="status error">Error: {progress.error}</div>
                    </div>
                );
            
            default:
                return (
                    <div className="progress-content">
                        <div className="status">Ready</div>
                    </div>
                );
        }
    };

    return (
        <div className="panel generation-progress-panel">
            <h3>Generation Progress</h3>
            {renderProgress()}
        </div>
    );
};

export default GenerationProgress;