# 📖 How to Use Deeper Research Synthetic

A comprehensive guide for beginners to get started with AI-powered content generation.

## 📋 Table of Contents

- [What is Deeper Research Synthetic?](#what-is-deeper-research-synthetic)
- [Getting Started](#getting-started)
- [Content Generation Workflows](#content-generation-workflows)
- [Understanding Content Frameworks](#understanding-content-frameworks)
- [Step-by-Step Tutorial](#step-by-step-tutorial)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)
- [Tips & Best Practices](#tips--best-practices)

## What is Deeper Research Synthetic?

Deeper Research Synthetic is an AI-powered platform that transforms raw source material into comprehensive, professional content across three specialized formats:

🎓 **Academic Papers** - Detailed research documents with citations  
🎙️ **Podcast Scripts** - Narrative-driven audio content  
📊 **Risk Assessments** - Data-driven analysis reports  

## Getting Started

### Prerequisites Checklist

Before you begin, make sure you have:

- [ ] **Node.js 14 or higher** ([Download here](https://nodejs.org/))
- [ ] **npm** (comes with Node.js)
- [ ] **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))
- [ ] **Text editor** (VS Code, Sublime Text, etc.)
- [ ] **Web browser** (Chrome, Firefox, Safari)

### Quick Setup (5 minutes)

1. **Download the project**
   ```bash
   git clone https://github.com/Fayeblade1488/deeper_research_synthetic.git
   cd deeper_research_synthetic
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

3. **Add your API key**
   - Open `backend/.env` in your text editor
   - Replace `your_gemini_api_key_here` with your actual API key
   ```bash
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start the application**
   
   **Terminal 1** (Backend):
   ```bash
   cd backend
   npm run dev
   ```
   
   **Terminal 2** (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**
   - Go to http://localhost:5173
   - You should see the Deeper Research Synthetic interface!

## Content Generation Workflows

### The Basic Workflow

1. **Create a Project** → Choose your content type
2. **Add Source Material** → Paste your research, notes, or data
3. **Generate Content** → Let AI transform your material
4. **Review & Edit** → Make adjustments as needed
5. **Export** → Download your finished content

### Workflow Diagram

```
Raw Material → AI Processing → Validated Output → Final Content
     ↑              ↑              ↑              ↑
  (Your Input)  (Gemini AI)   (Quality Check)  (Download)
```

## Understanding Content Frameworks

### 🎓 PROJECT_DEEPDIVE (Academic Papers)

**Best for:**
- Research papers
- White papers  
- Technical documentation
- In-depth analysis

**What you'll get:**
- 10,000+ words
- Professional citations
- Multiple sections and subsections
- Academic writing style

**Example use case:** "I need to create a comprehensive research paper about climate change impacts on agriculture."

### 🎙️ PROJECT_SYNTHETIC (Podcast Scripts)

**Best for:**
- Audio content scripts
- Narrative storytelling
- Educational content
- Entertainment media

**What you'll get:**
- 15,000+ words
- Engaging narrative structure
- "Good morning" opener style
- Key insight sections

**Example use case:** "I want to create a podcast episode about the history of space exploration."

### 📊 PROJECT_BENCHMARK (Risk Assessments)

**Best for:**
- Business risk analysis
- Crisis assessments
- Data-driven reports
- Strategic planning

**What you'll get:**
- 5,000+ words
- DEFCON-style ratings
- Data tables and metrics
- Evidence-based conclusions

**Example use case:** "I need to assess cybersecurity risks for my organization."

## Step-by-Step Tutorial

### Tutorial 1: Creating Your First Academic Paper

**Scenario:** You want to create a research paper about renewable energy.

1. **Start the application**
   - Make sure both backend and frontend are running
   - Open http://localhost:5173

2. **Create a new project**
   - Click "Create New Project"
   - Enter name: "Renewable Energy Analysis"
   - Select: "PROJECT_DEEPDIVE"
   - Click "Create"

3. **Add source material**
   ```
   Example source material to paste:
   
   "Solar energy has grown 20% annually over the past decade. 
   Wind power now accounts for 8% of global electricity generation.
   Key challenges include storage technology and grid integration.
   Countries like Denmark generate 50% of electricity from wind.
   Cost of solar panels has decreased 85% since 2010."
   ```

4. **Generate content**
   - Click "Generate Content"
   - Watch the progress bar as AI creates your paper
   - This typically takes 2-5 minutes

5. **Review the output**
   - Check the generated sections
   - Verify citations are included
   - Ensure word count meets requirements (10,000+)

6. **Make adjustments**
   - You can regenerate specific sections
   - Add more source material if needed
   - Request focus on particular aspects

### Tutorial 2: Creating a Podcast Script

**Scenario:** You want to create engaging content about space exploration.

1. **Create project**
   - Name: "Space Exploration Journey"
   - Type: "PROJECT_SYNTHETIC"

2. **Add narrative source material**
   ```
   "The Apollo 11 mission launched on July 16, 1969.
   Neil Armstrong was the first human to walk on the moon.
   'That's one small step for man, one giant leap for mankind.'
   The mission took 8 days total.
   It required the efforts of 400,000 people.
   The Saturn V rocket was 363 feet tall."
   ```

3. **Generate and review**
   - The output will be narrative-driven
   - Look for the "Good morning" opening
   - Check for Key Implication sections
   - Ensure storytelling flow

### Tutorial 3: Creating a Risk Assessment

**Scenario:** You need to assess cybersecurity threats for your business.

1. **Create project**
   - Name: "Cybersecurity Threat Analysis"
   - Type: "PROJECT_BENCHMARK"

2. **Add data and context**
   ```
   "Company has 500 employees, mostly remote work.
   Current security measures: basic firewalls, antivirus software.
   Recent incidents: 2 phishing attempts last month.
   Budget constraints: $50,000 for security improvements.
   Industry: Financial services, handles customer data.
   Compliance requirements: PCI DSS, SOX."
   ```

3. **Generate and review**
   - Look for DEFCON-style ratings
   - Check data tables are included
   - Verify quantitative analysis
   - Review risk prioritization

## Common Use Cases

### 📚 Academic & Research
- **Literature reviews** - Synthesize research papers
- **Grant proposals** - Create compelling funding requests  
- **Conference papers** - Develop presentation content
- **Thesis chapters** - Expand research into full sections

### 🎥 Content Creation
- **Video scripts** - Create educational video content
- **Blog posts** - Generate comprehensive articles
- **Course materials** - Develop training content
- **Presentations** - Build slide deck narratives

### 💼 Business & Professional
- **Market analysis** - Research industry trends
- **Strategic plans** - Develop business strategies
- **Risk assessments** - Evaluate threats and opportunities
- **Technical documentation** - Create user manuals

### 🏫 Educational
- **Study guides** - Create comprehensive learning materials
- **Lesson plans** - Develop curriculum content
- **Research projects** - Structure academic investigations
- **Case studies** - Analyze real-world scenarios

## Troubleshooting

### Common Issues & Solutions

#### ❌ "Generation failed" error
**Possible causes:**
- Invalid API key
- No internet connection
- API rate limits exceeded

**Solutions:**
1. Check your API key in `backend/.env`
2. Verify internet connection
3. Wait a few minutes and try again
4. Check console for detailed error messages

#### ❌ Frontend won't start
**Error:** `npm run dev` fails

**Solutions:**
1. Make sure you're in the `frontend` folder
2. Run `npm install` again
3. Check Node.js version (`node --version`)
4. Clear npm cache: `npm cache clean --force`

#### ❌ Backend connection refused
**Error:** Cannot connect to backend

**Solutions:**
1. Verify backend is running on port 3001
2. Check for port conflicts
3. Restart the backend server
4. Review backend logs for errors

#### ❌ Generated content is too short
**Issue:** Output doesn't meet word count requirements

**Solutions:**
1. Add more detailed source material
2. Provide specific topics to cover
3. Include more context and background
4. Regenerate with additional prompts

### Getting Help

If you're still having issues:

1. **Check the logs**
   - Backend: Look at the terminal running the backend
   - Frontend: Open browser developer tools (F12)

2. **Review documentation**
   - [API Documentation](./docs/API_DOCS.md)
   - [Troubleshooting Guide](./docs/TROUBLESHOOTING_GUIDE.md)

3. **Report issues**
   - [GitHub Issues](https://github.com/Fayeblade1488/deeper_research_synthetic/issues)
   - Include error messages and steps to reproduce

## Tips & Best Practices

### 🎯 Writing Effective Source Material

**Do:**
- ✅ Include specific facts, dates, and numbers
- ✅ Provide context and background information
- ✅ Use clear, well-structured input
- ✅ Include different perspectives or angles

**Don't:**
- ❌ Use extremely short or vague input
- ❌ Include sensitive or personal information
- ❌ Rely solely on opinions without facts
- ❌ Expect perfect output without review

### 🚀 Optimizing Generation Quality

1. **Source Material Quality**
   - Minimum 500 words of source material
   - Include diverse information sources
   - Provide specific details and examples
   - Structure your input logically

2. **Framework Selection**
   - Choose the right framework for your needs
   - Academic papers need research depth
   - Podcasts need engaging narratives
   - Risk assessments need data and analysis

3. **Review and Iteration**
   - Always review generated content
   - Fact-check important claims
   - Verify citations and references
   - Consider regenerating sections if needed

### ⚡ Performance Tips

1. **Faster Generation**
   - Keep source material focused and relevant
   - Use stable internet connection
   - Avoid concurrent generations
   - Close unnecessary browser tabs

2. **Better Results**
   - Be specific about desired outcomes
   - Provide clear context and goals
   - Include relevant background information
   - Specify target audience if relevant

### 🔐 Security Best Practices

1. **API Key Security**
   - Never share your API key
   - Don't commit `.env` files to version control
   - Rotate keys regularly
   - Use different keys for development/production

2. **Content Safety**
   - Review generated content before sharing
   - Fact-check important information
   - Respect copyright and attribution
   - Follow your organization's content policies

---

## 🎉 Ready to Create Amazing Content!

You're now ready to use Deeper Research Synthetic to transform your ideas into professional, comprehensive content. Start with a small project to get familiar with the workflow, then scale up to larger, more complex content generation tasks.

### Next Steps
1. Try the step-by-step tutorials above
2. Experiment with different content frameworks
3. Read the [full documentation](./README.md) for advanced features
4. Join the community and share your results!

---

**Need more help?** Check out our [full documentation](./README.md) or [report an issue](https://github.com/Fayeblade1488/deeper_research_synthetic/issues).