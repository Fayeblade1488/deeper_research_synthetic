const ProviderFactory = require("./providers/ProviderFactory");
const { constructPrompt, getFrameworkMetadata } = require("./frameworkService");
const { validateOutput } = require("./validationService");

// Initialize AI provider from environment
let aiProvider = null;

/**
 * Get or initialize the AI provider
 * @returns {AIProvider} Configured AI provider instance
 */
function getProvider() {
  if (!aiProvider) {
    aiProvider = ProviderFactory.createFromEnv();
  }
  return aiProvider;
}

/**
 * Generates content for a given project by constructing a prompt, streaming the output from the AI provider, and validating the result.
 * This function orchestrates the entire content generation process, from input validation to final output.
 * Supports multiple AI providers (Venice.ai, Gemini) with BYOK (Bring Your Own Key).
 *
 * @param {Object} project - The project object containing all necessary data for generation.
 * @param {string} project.framework - The framework type for the generation (e.g., PROJECT_DEEPDIVE).
 * @param {string} project.sourceContext - The source text or context to be used as input for the generation.
 * @param {string} project.name - The name of the project.
 * @param {string} [project.provider] - Optional AI provider to use (venice, gemini). Defaults to environment setting.
 * @param {Function} onProgress - A callback function that is invoked with progress updates during the generation process.
 * The updates are sent as objects with a `type` property (e.g., 'progress', 'complete', 'error').
 *
 * @returns {Promise<Object>} A Promise that resolves to an object containing the generated content and its metadata.
 * The resolved object includes the generated text, framework information, word count, generation time, and validation results.
 *
 * @throws {Error} Throws an error if the source context is missing, the framework is invalid, or the generation process fails.
 */
async function generateContent(project, onProgress) {
  const { framework, sourceContext, name } = project;

  // Validate inputs
  if (!sourceContext || sourceContext.trim().length === 0) {
    throw new Error("Source context is required for generation");
  }

  // Get framework metadata
  const frameworkMeta = getFrameworkMetadata(framework);
  if (!frameworkMeta) {
    throw new Error(`Invalid framework: ${framework}`);
  }

  // Construct full prompt
  const prompt = await constructPrompt(framework, sourceContext);

  // Get AI provider
  const provider = getProvider();
  const providerInfo = provider.getInfo();

  console.log(`🤖 Using ${providerInfo.name} for generation`);
  console.log(`🔒 Privacy: ${providerInfo.dataRetention}`);

  // Track generation progress
  let generatedText = "";
  let wordCount = 0;
  let chunkCount = 0;

  const startTime = Date.now();

  // Generate with streaming using provider
  try {
    const result = await provider.generateWithStreaming({
      prompt,
      onProgress: (update) => {
        chunkCount++;

        // For Venice/Gemini, accumulate content from progress updates
        if (update.content) {
          generatedText = update.content;
          wordCount = countWords(generatedText);
        }

        // Send progress update every 10 chunks
        if (chunkCount % 10 === 0 && onProgress) {
          onProgress({
            type: "progress",
            wordCount,
            chunkCount,
            provider: update.provider || providerInfo.name,
            estimatedProgress: Math.min(
              (wordCount / frameworkMeta.minWords) * 100,
              95
            ),
          });
        }
      },
      context: [],
    });

    // Use final content from provider result
    generatedText = result.content;

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // seconds

    // Final word count
    wordCount = countWords(generatedText);

    // Validate output
    const validation = validateOutput(generatedText, framework);

    // Send completion update
    if (onProgress) {
      onProgress({
        type: "complete",
        wordCount,
        duration,
        validation,
      });
    }

    return {
      content: generatedText,
      metadata: {
        framework: frameworkMeta.name,
        outputType: frameworkMeta.outputType,
        wordCount,
        generationTime: duration,
        timestamp: new Date().toISOString(),
        validation,
        provider: providerInfo.name,
        privacyMode: providerInfo.privacyFocused ? "enabled" : "standard",
        dataRetention: providerInfo.dataRetention,
      },
    };
  } catch (error) {
    console.error("Generation error:", error);

    if (onProgress) {
      onProgress({
        type: "error",
        error: error.message,
      });
    }

    throw new Error(`Generation failed: ${error.message}`);
  }
}

/**
 * Counts the number of words in a given string of text.
 * Words are separated by one or more whitespace characters.
 *
 * @param {string} text - The text in which to count the words.
 * @returns {number} The total number of words in the text.
 */
function countWords(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Estimates the remaining time for a content generation task based on the current progress.
 * This function includes robust handling for edge cases, such as invalid inputs, no progress, and very slow generation rates.
 *
 * @param {number} currentWords - The number of words that have been generated so far.
 * @param {number} targetWords - The target number of words for the generation.
 * @param {number} elapsedSeconds - The total time in seconds that has elapsed since the generation started.
 *
 * @returns {number} The estimated time remaining in seconds. Returns 0 if the generation is complete or if the inputs are invalid.
 */

module.exports = {
  generateContent,
  countWords,
  getProvider, // Export for testing
};
