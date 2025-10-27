# Privacy Policy

**Last Updated:** 2025-10-27  
**Version:** 1.0

---

## Overview

This document describes how deeper_research_synthetic handles data and privacy.

## Important Note

This is **free, open-source software**. Privacy practices depend on how and where you deploy it:

- **Self-hosted**: You control all data
- **Third-party hosting**: That provider's privacy policy applies
- **Development/Testing**: No data is collected by the project

---

## Data Handling in Self-Hosted Deployments

### What Data We Process

When you run deeper_research_synthetic:

1. **User Input Data**
   - Content you provide for generation
   - Project metadata (names, descriptions)
   - Framework selections

2. **Generated Content**
   - AI-generated outputs
   - Cached results
   - Processing history

3. **System Data**
   - Server logs
   - Performance metrics
   - Error reports

### Where Data Is Stored

- **MongoDB Database**: Your local MongoDB instance
- **File System**: Project files and generated content
- **Memory**: Temporary processing data (cleared on shutdown)

### Data You Control

**In self-hosted deployments, YOU control:**
- All data storage location
- Who has access
- Data retention policies
- Data deletion
- Backup and recovery

---

## Third-Party Services

### AI Providers

This application supports multiple AI providers:

#### Venice.ai
- **Policy**: Check https://venice.ai/privacy
- **Data**: Your inputs sent to Venice.ai servers for processing
- **BYOK**: You provide your own API key
- **Storage**: Venice.ai determines storage

#### Google Gemini
- **Policy**: Check https://policies.google.com/privacy
- **Data**: Your inputs sent to Google servers for processing
- **BYOK**: You provide your own API key
- **Storage**: Google determines storage

### Your Responsibility

When using AI providers:
- Review their privacy policies
- Understand data retention practices
- Know what they do with your data
- Comply with their terms of service
- Use BYOK (Bring Your Own Key) when available

---

## Developer/Contributor Privacy

### What We Collect

During development:
- Code commits (public on GitHub)
- Pull request discussions
- Issue reports
- GitHub profile information

### What We Don't Collect

- Personal data from users running the software
- Analytics or tracking
- Telemetry (unless you enable it)
- Browsing history

### Open Source Transparency

All project data is public:
- Code is open-source (MIT licensed)
- Discussions are visible
- Issues are public
- Contributions are attributed

---

## Docker Deployment Privacy

### Container Isolation

When running via Docker:
- Application runs in isolated container
- Data stays in mounted volumes
- Network access is configured
- Environment variables hold secrets (not logged)

### Important

- Docker daemon may log container operations
- Host system has access to all container data
- Network monitoring may occur at infrastructure level

---

## Security & Data Protection

### We Implement

- ✅ Non-root container users
- ✅ Environment-based secret management
- ✅ Input validation
- ✅ Database authentication
- ✅ CORS security headers
- ✅ HTTPS/TLS support (your responsibility in production)

### You Should Implement

- 🔒 Firewall rules (restrict access)
- 🔒 SSL/TLS certificates (encrypt in transit)
- 🔒 Database authentication (strong passwords)
- 🔒 Regular backups (data recovery)
- 🔒 Access controls (who can access)
- 🔒 Monitoring (detect issues)
- 🔒 Updates (security patches)

---

## Data Retention

### Automatic Cleanup

The application does not automatically delete data. You control:
- How long projects are kept
- When to delete generated content
- Database retention policies
- Log rotation

### Backup & Recovery

- You should maintain backups
- Backups are your responsibility
- Automated backups can be configured (see DEPLOYMENT.md)
- Test recovery procedures

---

## Logs & Monitoring

### What We Log

The application logs:
- Application errors
- API requests (basic info)
- Database operations
- Performance metrics

### What You Should Log

For production deployment:
- Access logs (who accessed what)
- Error logs (troubleshooting)
- Audit logs (compliance)
- Performance metrics (optimization)

### Log Storage

- Logs are stored on your server
- You control log retention
- You're responsible for log security
- Consider log aggregation for production

---

## GDPR Compliance (If Applicable)

If you store personal data of EU residents:

### Your Obligations

- Obtain proper consent
- Provide privacy notices
- Implement data subject rights
- Report data breaches
- Conduct impact assessments

### This Project Helps By

- Providing audit logging capabilities
- Supporting data deletion
- Enabling encrypted storage
- Documenting data flows

### Your Responsibility

The project is a tool. **You** are responsible for GDPR compliance if applicable.

---

## Data Subject Rights

If your application handles personal data:

### Users Have Right To:
- Access their data
- Correct inaccurate data
- Delete their data
- Data portability
- Restrict processing
- Object to processing

### Implement Via

- Admin panel features
- API endpoints for data access
- Deletion workflows
- Export functionality
- Access logging

---

## Changes to This Policy

### How We Communicate Changes

- Updates posted to this file
- Version number incremented
- Last updated date changed
- Git history shows changes

### Your Responsibility

- Review this policy
- Update deployments
- Communicate changes to users (if applicable)
- Adjust policies for your use case

---

## Contact & Questions

### Security Issues

**Do not** file public issues for security concerns.

See [SECURITY.md](../SECURITY.md) for reporting process.

### Privacy Questions

File an issue: [GitHub Issues](https://github.com/Fayeblade1488/deeper_research_synthetic/issues)

Include:
- Specific privacy concern
- Your use case
- What information you need

---

## Deployment-Specific Considerations

### Self-Hosted

Your organization owns all privacy obligations. Implement:
- Data encryption
- Access controls
- Audit logging
- Compliance monitoring

### Cloud-Hosted

Combine this policy with your cloud provider's privacy policy:
- AWS: https://aws.amazon.com/privacy/
- Google Cloud: https://cloud.google.com/privacy
- Azure: https://azure.microsoft.com/en-us/exploration/security/privacy/
- DigitalOcean: https://www.digitalocean.com/legal/privacy-policy/

### Kubernetes

Container orchestration adds considerations:
- Pod isolation
- Persistent volume security
- Secret management
- Network policies

---

## AI-Assisted Development

### How AI Is Used

- Code generation and analysis
- Documentation creation
- Bug detection

### Your Privacy

- Code you see is your code
- AI doesn't store your data
- No external data sent during development
- See [AI_USAGE.md](../AI_USAGE.md)

---

## Summary

**Key Points:**
1. This is self-hosted software you control
2. Data privacy is your responsibility
3. AI providers have their own policies
4. Follow security best practices
5. Implement compliance if needed

---

## Related Documents

- [SECURITY.md](../SECURITY.md) - Security policies
- [AI_USAGE.md](../AI_USAGE.md) - AI tool usage
- [CODE_OF_CONDUCT.md](../docs/CODE_OF_CONDUCT.md) - Community standards

---

**Version:** 1.0  
**Status:** Current  
**Review Date:** 2025-10-27
