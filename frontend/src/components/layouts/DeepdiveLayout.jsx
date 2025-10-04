import React, { useState } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import SourcePanel from '../panels/SourcePanel';
import DraftPanel from '../panels/DraftPanel';
import GenerationControlPanel from '../GenerationControlPanel';

const ReactGridLayout = WidthProvider(RGL);

const DeepdiveLayout = ({ project, onUpdateGeneratedContent }) => {
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
        { i: 'a', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
        { i: 'b', x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
        { i: 'c', x: 0, y: 8, w: 12, h: 6, minW: 4, minH: 4 },
    ];

    return (
        <ReactGridLayout className="layout" layout={layout} cols={12} rowHeight={30} >
            <div key="a"><SourcePanel project={project} /></div>
            <div key="b">
                <DraftPanel 
                    project={project} 
                    content={generatedContent} 
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
        </ReactGridLayout>
    );
};

export default DeepdiveLayout;
