/**
 * @file This file contains the `BenchmarkLayout` component, which defines the user interface for the PROJECT_BENCHMARK framework.
 * @author Paradroid AI
 * @version 1.0.0
 * 
 * @description This component arranges the `SourcePanel`, `DraftPanel`, and `GenerationControlPanel` in a responsive grid layout.
 * It manages the state of the generated content and the generation process for the Benchmark framework.
 */

import React, { useState } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import SourcePanel from '../panels/SourcePanel';
import DraftPanel from '../panels/DraftPanel';
import GenerationControlPanel from '../GenerationControlPanel';

const ReactGridLayout = WidthProvider(RGL);

/**
 * The layout component for the PROJECT_BENCHMARK framework.
 * This component uses `react-grid-layout` to create a draggable and resizable grid of panels.
 * The layout consists of a `SourcePanel` for the input, a `DraftPanel` for the output, and a `GenerationControlPanel` to control the generation process.
 *
 * @param {object} props - The props for the component.
 * @param {object} props.project - The currently selected project object.
 * @param {function} props.onUpdateGeneratedContent - A callback function to save the generated content and metadata.
 * @returns {JSX.Element} The rendered Benchmark layout.
 */
function BenchmarkLayout({ project, onUpdateGeneratedContent, onUpdateContext }) {
    const [generatedContent, setGeneratedContent] = useState(project.generatedContent || '');
    const [isGenerating, setIsGenerating] = useState(false);

    /**
     * Handles the completion of the content generation process.
     * It updates the component's state with the newly generated content and sets the `isGenerating` flag to false.
     * It also calls the `onUpdateGeneratedContent` callback to save the content and metadata to the project.
     *
     * @param {string} content - The generated content.
     * @param {object} metadata - The metadata associated with the generation process.
     */
    const handleGenerationComplete = async (content, metadata) => {
        setGeneratedContent(content);
        setIsGenerating(false);
        
        // Update the project with the generated content and metadata
        if (project && onUpdateGeneratedContent) {
            await onUpdateGeneratedContent(project.id, content, metadata);
        }
    };

    /**
     * Handles the start of the content generation process.
     * It sets the `isGenerating` flag to true.
     */
    const handleGenerationStart = () => {
        setIsGenerating(true);
    };

    /**
     * Handles the stopping of the content generation process.
     * It sets the `isGenerating` flag to false.
     */
    const handleGenerationStop = () => {
        setIsGenerating(false);
    };

    const layout = [
        { i: 'a', x: 0, y: 0, w: 6, h: 9, minW: 4, minH: 6 },
        { i: 'b', x: 6, y: 0, w: 6, h: 9, minW: 4, minH: 6 },
        { i: 'c', x: 0, y: 9, w: 12, h: 6, minW: 4, minH: 4 },
    ];

    return (
        <ReactGridLayout className="layout" layout={layout} cols={12} rowHeight={30} >
            <div key="a">
                <SourcePanel 
                    project={project} 
                    onSaveContext={onUpdateContext}
                    title="Benchmark Source Data"
                    description="Input the data and metrics for the benchmark analysis"
                />
            </div>
            <div key="b">
                <DraftPanel 
                    project={project} 
                    content={generatedContent} 
                    isGenerating={isGenerating}
                    onSaveDraft={(projectId, draft) => onUpdateGeneratedContent(projectId, draft, null)}
                    title="Analysis Results"
                    description="Benchmark analysis and DEFCON assessment will be generated here"
                />
            </div>
            <div key="c">
                <GenerationControlPanel 
                    project={project} 
                    onGenerationComplete={handleGenerationComplete}
                    onGenerationStart={handleGenerationStart}
                    onGenerationStop={handleGenerationStop}
                    title="Analysis Controls"
                />
            </div>
        </ReactGridLayout>
    );
};

export default BenchmarkLayout;