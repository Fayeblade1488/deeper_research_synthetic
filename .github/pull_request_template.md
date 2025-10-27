---
name: 📋 Pull Request
description: Submit code changes
labels: []
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thank you for contributing!
        
        Please provide clear description of your changes.

  - type: textarea
    attributes:
      label: Description
      description: Describe the changes you've made
      placeholder: "This PR..."
    validations:
      required: true

  - type: input
    attributes:
      label: Related Issue
      description: Link to the issue this fixes (e.g., #123)
      placeholder: "#123"

  - type: checkboxes
    attributes:
      label: Type of Change
      options:
        - label: "🐛 Bug fix (non-breaking change that fixes an issue)"
        - label: "✨ New feature (non-breaking change that adds functionality)"
        - label: "🔄 Breaking change (fix or feature that would cause existing functionality to change)"
        - label: "📝 Documentation update"
        - label: "♻️ Refactoring (no functional changes)"
    validations:
      required: true

  - type: checkboxes
    attributes:
      label: Testing
      description: Please confirm testing was performed
      options:
        - label: "I have tested these changes locally"
        - label: "I have added tests to cover my changes"
        - label: "All tests pass locally"
    validations:
      required: true

  - type: checkboxes
    attributes:
      label: Code Quality
      description: Please confirm code quality checks
      options:
        - label: "My code follows the code style of this project"
        - label: "I have performed a self-review of my own code"
        - label: "I have commented my code, particularly in hard-to-understand areas"
    validations:
      required: true

  - type: checkboxes
    attributes:
      label: Documentation
      description: Please confirm documentation
      options:
        - label: "I have updated the documentation (if needed)"
        - label: "I have added/updated JSDoc comments (if applicable)"
    validations:
      required: true

  - type: textarea
    attributes:
      label: Additional Notes
      description: Any other information or concerns?

  - type: checkboxes
    attributes:
      label: AI Disclosure
      description: "If your PR includes AI-assisted code, please disclose it"
      options:
        - label: "This PR includes AI-assisted code (see AI_USAGE.md)"
