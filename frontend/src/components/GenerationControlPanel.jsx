/**
 * @file This file contains the `GenerationControlPanel` component, which provides controls for starting, stopping, and monitoring content generation.
 * @author Paradroid AI
 * @version 1.0.0
 * 
 * @description This component provides buttons and status indicators for controlling the AI content generation process.
 * It manages the generation lifecycle and displays progress information.
 */

import React, { useState, useEffect } from 'react';
import { startGeneration, cancelGeneration } from '../services/apiService';

/**
 * The generation control panel component.
 * This component provides controls for starting, stopping, and monitoring content generation.
 * It manages the generation lifecycle and displays progress information.
 *
 * @param {object} props - The props for the component.
 * @param {object} props.project - The project object for which to generate content.
 * @param {Function} props.onGenerationComplete - Callback function called when generation completes.
 * @param {Function} props.onGenerationStart - Callback function called when generation starts.
 * @param {Function} props.onGenerationStop - Callback function called when generation stops.
 * @param {string} [props.title="Generation Controls"] - The title to display in the panel header.
 * @returns {JSX.Element} The rendered generation control panel.
 */
function GenerationControlPanel({ project, onGenerationComplete, onGenerationStart, onGenerationStop, title = "Generation Controls" }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [duration, setDuration] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Ready to generate');
    const [validationResults, setValidationResults] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [startTime, setStartTime] = useState(null);
    
    // Cleanup function to cancel generation if component unmounts
    useEffect(() => {
        return () => {
            if (isGenerating && !isCancelling) {
                handleCancel();
            }
        };
    }, [isGenerating, isCancelling]);

    const handleGenerate = async () => {
        if (!project) return;

        try {
            onGenerationStart();
            setIsGenerating(true);
            setProgress(0);
            setWordCount(0);
            setDuration(0);
            setValidationResults(null);
            setStatusMessage('Starting generation...');
            setStartTime(Date.now());

            // Start the generation process with progress updates
            const cleanup = startGeneration(
                project,
                (progressData) => {
                    // Handle progress updates
                    if (progressData.type === 'progress') {
                        setProgress(progressData.estimatedProgress || 0);
                        setWordCount(progressData.wordCount || 0);
                        setStatusMessage(`Generating... ${progressData.wordCount || 0} words`);
                    }
                },
                (completeData) => {
                    // Handle completion
                    if (completeData.type === 'complete') {
                        setProgress(100);
                        setStatusMessage('Generation complete!');
                        
                        // Update word count and duration
                        setWordCount(completeData.metadata?.wordCount || 0);
                        setDuration(completeData.metadata?.generationTime || 0);
                        
                        // Set validation results
                        setValidationResults(completeData.metadata?.validation || null);
                        
                        // Call the completion callback
                        onGenerationComplete(completeData.content, completeData.metadata);
                        setIsGenerating(false);
                    }
                },
                (errorData) => {
                    // Handle errors
                    setStatusMessage(`Error: ${errorData.error || 'Generation failed'}`);
                    setIsGenerating(false);
                    
                    // Show error to user
                    if (typeof errorData === 'object' && errorData.error) {
                        alert(`Generation failed: ${errorData.error}`);
                    } else {
                        alert(`Generation failed: ${errorData || 'Unknown error'}`);
                    }
                }
            );

            // Store cleanup function to cancel generation if needed
            window.generationCleanup = cleanup;
        } catch (error) {
            console.error('Error starting generation:', error);
            setStatusMessage('Error starting generation');
            setIsGenerating(false);
        }
    };

    const handleCancel = async () => {
        if (!project) return;

        setIsCancelling(true);
        setStatusMessage('Cancelling generation...');

        try {
            await cancelGeneration(project.id);
            setIsGenerating(false);
            setIsCancelling(false);
            setStatusMessage('Generation cancelled');
            
            // Clean up any remaining generation state
            if (window.generationCleanup) {
                window.generationCleanup();
                delete window.generationCleanup;
            }
            
            onGenerationStop();
        } catch (error) {
            console.error('Error cancelling generation:', error);
            setStatusMessage('Error cancelling generation');
            setIsCancelling(false);
        }
    };

    // Calculate elapsed time if generating
    useEffect(() => {
        let interval;
        if (isGenerating && startTime) {
            interval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                setDuration(elapsed);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isGenerating, startTime]);

    // Calculate progress percentage
    const progressPercentage = Math.min(100, Math.max(0, progress));

    return (
        <div className="panel generation-control-panel">
            <div className="panel-header">
                <h3>
                    <span role="img" aria-label="controls">⚙️</span> {title}
                </h3>
            </div>
            <div className="panel-content">
                <div className="generation-controls">
                    <div className="control-buttons">
                        <button
                            className="generate-btn"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            title={isGenerating ? "Generation in progress" : "Start content generation"}
                        >
                            {isGenerating ? (
                                <>
                                    <span role="img" aria-label="generating">⏳</span> Generating...
                                </>
                            ) : (
                                <>
                                    <span role="img" aria-label="generate">✨</span> Generate Content
                                </>
                            )}
                        </button>
                        
                        {isGenerating && (
                            <button
                                className="cancel-btn"
                                onClick={handleCancel}
                                disabled={isCancelling}
                                title="Cancel generation"
                            >
                                {isCancelling ? (
                                    <>
                                        <span role="img" aria-label="cancelling">⏳</span> Cancelling...
                                    </>
                                ) : (
                                    <>
                                        <span role="img" aria-label="cancel">🚫</span> Cancel
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    
                    <div className="generation-status">
                        <div className={`status-indicator ${isGenerating ? 'generating' : 'active'}`}>
                            <span role="img" aria-label={isGenerating ? 'generating' : 'ready'}>
                                {isGenerating ? '⏳' : '✅'}
                            </span>
                            <span>{statusMessage}</span>
                        </div>
                    </div>
                    
                    {isGenerating && (
                        <div className="generation-progress">
                            <div className="progress-bar-container">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>
                                <span className="progress-percent">{Math.round(progressPercentage)}%</span>
                            </div>
                            
                            <div className="progress-stats">
                                <div className="stat">
                                    <div className="label">Words</div>
                                    <div className="value">{wordCount}</div>
                                </div>
                                <div className="stat">
                                    <div className="label">Time</div>
                                    <div className="value">{duration.toFixed(1)}s</div>
                                </div>
                                <div className="stat">
                                    <div className="label">Status</div>
                                    <div className="value">{isGenerating ? 'Active' : 'Idle'}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {validationResults && (
                    <div className="validation-results">
                        <h4>Validation Results</h4>
                        <div className="validation-summary">
                            <div className="validation-success">
                                {validationResults.valid ? (
                                    <span role="img" aria-label="success">✅</span>
                                ) : (
                                    <span role="img" aria-label="error">❌</span>
                                )}
                                {validationResults.valid ? 'Content meets requirements' : 'Content has issues'}
                            </div>
                        </div>
                        
                        {(validationResults.errors.length > 0 || validationResults.warnings.length > 0) && (
                            <ul>
                                {validationResults.errors.map((error, index) => (
                                    <li key={`error-${index}`} className="error">
                                        <span role="img" aria-label="error">❌</span> {error}
                                    </li>
                                ))}
                                {validationResults.warnings.map((warning, index) => (
                                    <li key={`warning-${index}`} className="warning">
                                        <span role="img" aria-label="warning">⚠️</span> {warning}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default GenerationControlPanel;