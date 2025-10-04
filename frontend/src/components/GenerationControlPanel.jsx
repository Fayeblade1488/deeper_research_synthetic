import React, { useState, useEffect } from 'react';
import { startGeneration, checkGenerationStatus } from '../services/apiService';

const GenerationControlPanel = ({ project, onGenerationComplete, onGenerationStart, onGenerationStop }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(null);
    const [generationStatus, setGenerationStatus] = useState(null);
    const [statusCheckInterval, setStatusCheckInterval] = useState(null);

    // Check initial status when project changes
    useEffect(() => {
        if (project?.id) {
            checkCurrentStatus();
        }
    }, [project]);

    const checkCurrentStatus = async () => {
        if (!project?.id) return;
        
        try {
            const status = await checkGenerationStatus(project.id);
            setGenerationStatus(status);
        } catch (error) {
            console.error('Error checking generation status:', error);
        }
    };

    const handleStartGeneration = async () => {
        if (!project) return;

        setIsGenerating(true);
        if (onGenerationStart) onGenerationStart();
        
        setProgress({
            type: 'start',
            wordCount: 0,
            chunkCount: 0,
            estimatedProgress: 0,
        });

        // Start checking status periodically
        const interval = setInterval(async () => {
            await checkCurrentStatus();
        }, 2000);
        setStatusCheckInterval(interval);

        // Start generation with streaming
        startGeneration(
            project,
            // onProgress
            (progressData) => {
                setProgress(progressData);
            },
            // onComplete
            (completeData) => {
                setIsGenerating(false);
                if (onGenerationStop) onGenerationStop();
                
                setProgress({
                    type: 'complete',
                    wordCount: completeData.metadata?.wordCount || 0,
                    duration: completeData.metadata?.generationTime,
                    validation: completeData.metadata?.validation,
                });
                
                if (onGenerationComplete) {
                    onGenerationComplete(completeData.content, completeData.metadata);
                }
                
                // Clear status check interval
                if (interval) {
                    clearInterval(interval);
                    setStatusCheckInterval(null);
                }
            },
            // onError
            (errorMessage) => {
                setIsGenerating(false);
                if (onGenerationStop) onGenerationStop();
                
                setProgress({
                    type: 'error',
                    error: errorMessage,
                });
                
                // Clear status check interval
                if (interval) {
                    clearInterval(interval);
                    setStatusCheckInterval(null);
                }
            }
        );
    };

    const handleCancelGeneration = async () => {
        // TODO: Implement cancel generation API call
        setIsGenerating(false);
        if (onGenerationStop) onGenerationStop();
        
        // Clear status check interval
        if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            setStatusCheckInterval(null);
        }
    };

    if (!project) {
        return (
            <div className="panel">
                <h3>Generation Controls</h3>
                <p>Select a project to begin generation.</p>
            </div>
        );
    }

    return (
        <div className="panel generation-control-panel">
            <h3>Keystone: SPARK</h3>
            <div className="generation-controls">
                <div className="control-buttons">
                    {!isGenerating ? (
                        <button 
                            className="generate-btn" 
                            onClick={handleStartGeneration}
                            disabled={isGenerating || !project.sourceContext}
                        >
                            {project.sourceContext ? 'Initiate Generation' : 'Add Source Context First'}
                        </button>
                    ) : (
                        <button 
                            className="cancel-btn" 
                            onClick={handleCancelGeneration}
                        >
                            Cancel Generation
                        </button>
                    )}
                </div>

                {progress && (
                    <div className="generation-progress">
                        {progress.type === 'start' && (
                            <div className="status">Ready to begin generation...</div>
                        )}
                        
                        {progress.type === 'progress' && (
                            <div className="progress-details">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${Math.min(progress.estimatedProgress, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="progress-info">
                                    <span className="word-count">{progress.wordCount} words generated</span>
                                    <span className="chunk-count">{progress.chunkCount} chunks</span>
                                    <span className="progress-percent">{Math.round(progress.estimatedProgress)}%</span>
                                </div>
                            </div>
                        )}
                        
                        {progress.type === 'complete' && (
                            <div className="generation-complete">
                                <div className="status success">Generation Complete!</div>
                                <div className="completion-stats">
                                    <span className="word-count">{progress.wordCount} words</span>
                                    <span className="duration">{progress.duration?.toFixed(1)}s</span>
                                </div>
                                {progress.validation && (
                                    <div className="validation-results">
                                        {progress.validation.valid ? (
                                            <span className="validation-success">✓ Content meets framework requirements</span>
                                        ) : (
                                            <div className="validation-errors">
                                                <span className="validation-fail">⚠ Validation issues found:</span>
                                                <ul>
                                                    {progress.validation.errors.map((error, idx) => (
                                                        <li key={idx} className="error">{error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {progress.type === 'error' && (
                            <div className="generation-error">
                                <div className="status error">Generation Error: {progress.error}</div>
                            </div>
                        )}
                    </div>
                )}

                {generationStatus && generationStatus.active && (
                    <div className="active-status">
                        Generation in progress...
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerationControlPanel;