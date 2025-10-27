---
name: 🐛 Bug Report
description: Report a bug or issue
labels: ["bug"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thank you for helping improve deeper_research_synthetic!
        
        Please fill out this form as completely as possible.

  - type: checkboxes
    attributes:
      label: Is there an existing issue for this?
      description: Please search to see if an issue already exists for the bug you encountered.
      options:
        - label: I have searched the existing issues

  - type: textarea
    attributes:
      label: Description
      description: A clear and concise description of what the bug is.
      placeholder: "When I do X, the application does Y instead of Z."
    validations:
      required: true

  - type: textarea
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior
      placeholder: |
        1. Navigate to...
        2. Click on...
        3. Scroll down to...
        4. See error...
    validations:
      required: true

  - type: textarea
    attributes:
      label: Expected Behavior
      description: A clear description of what you expected to happen.
      placeholder: "The application should do Z"
    validations:
      required: true

  - type: textarea
    attributes:
      label: Actual Behavior
      description: A clear description of what actually happens.
      placeholder: "The application does Y instead"
    validations:
      required: true

  - type: dropdown
    attributes:
      label: Environment
      description: Where are you running this?
      options:
        - Local development
        - Docker Compose
        - Production
        - Other
    validations:
      required: true

  - type: input
    attributes:
      label: Node Version
      description: What version of Node.js are you using? (run `node --version`)
      placeholder: "v20.10.0"

  - type: input
    attributes:
      label: Operating System
      description: What operating system are you using?
      placeholder: "macOS 14.1"

  - type: textarea
    attributes:
      label: Error Logs
      description: Please paste any relevant error messages or logs
      render: bash

  - type: textarea
    attributes:
      label: Additional Context
      description: Any other context about the problem? Screenshots? Links?
