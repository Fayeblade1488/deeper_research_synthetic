import React, { useState } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import SourcePanel from '../panels/SourcePanel';
import DraftPanel from '../panels/DraftPanel';
import GenerationControlPanel from '../GenerationControlPanel';

const ReactGridLayout = WidthProvider(RGL);

const SyntheticLayout = ({ project, onUpdateGeneratedContent }) => {
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
        { i: 'a', x: 0, y: 0, w: 4, h: 8 },
        { i: 'b', x: 4, y: 0, w: 5, h: 8 },
        { i: 'c', x: 9, y: 0, w: 3, h: 8 },
        { i: 'd', x: 0, y: 8, w: 12, h: 4 },
    ];

    return (
        <ReactGridLayout className="layout" layout={layout} cols={12} rowHeight={30}>
            <div key="a"><SourcePanel project={project} /></div>
            <div key="b">
                <DraftPanel 
                    project={project} 
                    content={generatedContent} 
                    title="Script Editor"
                    isGenerating={isGenerating}
                />
            </div>
            <div key="c">
                <GenerationControlPanel 
                    project={project} 
                    onGenerationComplete={handleGenerationComplete}
                    onGenerationStart={handleGenerationStart}
                    onGenerationStop={handleGenerationStop}
                />
            </div>
            <div key="d" className="panel-placeholder"><h3>Audio Assets</h3><p>Future audio asset management panel.</p></div>
        </ReactGridLayout>
    );
};

export default SyntheticLayout;
