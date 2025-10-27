---
name: ✨ Feature Request
description: Suggest an idea for this project
labels: ["enhancement"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thank you for suggesting an improvement!
        
        Please provide as much detail as possible.

  - type: checkboxes
    attributes:
      label: Is your feature request related to a problem?
      description: Check if there's already a similar request
      options:
        - label: I have searched for similar feature requests

  - type: textarea
    attributes:
      label: Description
      description: Describe the feature you'd like
      placeholder: "I wish deeper_research_synthetic would..."
    validations:
      required: true

  - type: textarea
    attributes:
      label: Use Case
      description: Explain why you need this feature. What problem does it solve?
      placeholder: "Currently, I have to manually X because..."
    validations:
      required: true

  - type: textarea
    attributes:
      label: Proposed Solution
      description: Describe how you'd like this feature to work
      placeholder: "The feature should work like this..."

  - type: textarea
    attributes:
      label: Alternative Solutions
      description: Describe alternative approaches you've considered
      placeholder: "I could also do X instead, but..."

  - type: textarea
    attributes:
      label: Additional Context
      description: Any other information? Screenshots? Links? Examples?
