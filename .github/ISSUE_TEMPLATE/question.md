---
name: ❓ Question
description: Ask a question about the project
labels: ["question"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thank you for your question!
        
        Before asking, please check:
        - [README.md](../../README.md)
        - [Troubleshooting Guide](../../docs/TROUBLESHOOTING_GUIDE.md)
        - [API Documentation](../../docs/API_DOCS.md)
        - [Existing Issues](../issues)

  - type: textarea
    attributes:
      label: Question
      description: What would you like to know?
      placeholder: "How do I...?"
    validations:
      required: true

  - type: textarea
    attributes:
      label: Context
      description: Provide any relevant context
      placeholder: "I'm trying to... and I..."

  - type: textarea
    attributes:
      label: What have you already tried?
      description: What steps have you taken to find the answer?
      placeholder: "I've already..."
