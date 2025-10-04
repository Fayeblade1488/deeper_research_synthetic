/**
 * @file This file contains the `DataInputPanel` component, which provides a textarea for inputting quantitative data.
 * @author Paradroid AI
 * @version 1.0.0
 * 
 * @description This component is a simple textarea that allows users to input quantitative data, such as CSV-formatted text.
 */

/**
 * A component that displays a textarea for inputting quantitative data.
 *
 * @param {object} props - The props for the component.
 * @param {object} props.project - The currently selected project object.
 * @returns {JSX.Element} The rendered data input panel.
 */
    return (
        <div className="panel">
            <h3>Data Input</h3>
            <textarea 
                placeholder="Paste quantitative data here (e.g., CSV format)..."
            />
        </div>
    );
};

export default DataInputPanel;
