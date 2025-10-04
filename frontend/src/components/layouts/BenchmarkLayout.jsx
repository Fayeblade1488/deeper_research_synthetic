import React, { useState } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import DataInputPanel from '../panels/DataInputPanel';
import PreviewPanel from '../panels/PreviewPanel';
import DraftPanel from '../panels/DraftPanel';
import GenerationControlPanel from '../GenerationControlPanel';

const ReactGridLayout = WidthProvider(RGL);

const BenchmarkLayout = ({ project, onUpdateGeneratedContent }) => {
    const [generatedContent, setGeneratedContent] = useState(project.generatedContent || '');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerationComplete = async (content, metadata) => {
        setGeneratedContent(content);
        setIsGenerating(false);
        
        // Update the project with the generated content and metadata
        if (project && onUpdateGeneratedContent) {
            await onUpdateGeneratedContent(project.id, content, metadata);
        }
    };

    const handleGenerationStart = () => {
        setIsGenerating(true);
    };

    const handleGenerationStop = () => {
        setIsGenerating(false);
    };

    const layout = [
        { i: 'a', x: 0, y: 0, w: 12, h: 6 },
        { i: 'b', x: 0, y: 6, w: 5, h: 6 },
        { i: 'c', x: 5, y: 6, w: 4, h: 6 },
        { i: 'd', x: 9, y: 6, w: 3, h: 6 },
    ];

    return (
        <ReactGridLayout className="layout" layout={layout} cols={12} rowHeight={30}>
            <div key="a"><PreviewPanel project={project} /></div>
            <div key="b"><DataInputPanel project={project} /></div>
            <div key="c">
                <DraftPanel 
                    project={project} 
                    content={generatedContent} 
                    title="Narrative Summary"
                    isGenerating={isGenerating}
                />
            </div>
            <div key="d">
                <GenerationControlPanel 
                    project={project} 
                    onGenerationComplete={handleGenerationComplete}
                    onGenerationStart={handleGenerationStart}
                    onGenerationStop={handleGenerationStop}
                />
            </div>
        </ReactGridLayout>
    );
};

export default BenchmarkLayout;
