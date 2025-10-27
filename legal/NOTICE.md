# Third-Party Notices

This document contains notices and attribution for all third-party software used in deeper_research_synthetic.

---

## Backend Dependencies

### Express.js
- **License:** MIT
- **Repository:** https://github.com/expressjs/express
- **Purpose:** Web application framework

### MongoDB / Mongoose
- **License:** MIT (mongoose), Server-Side Public License (MongoDB)
- **Repository:** https://github.com/mongodb/mongoose
- **Purpose:** NoSQL database and ODM

### Winston
- **License:** MIT
- **Repository:** https://github.com/winstonjs/winston
- **Purpose:** Logging library

### Jest
- **License:** MIT
- **Repository:** https://github.com/facebook/jest
- **Purpose:** Testing framework

### Dotenv
- **License:** BSD-2-Clause
- **Repository:** https://github.com/motdotla/dotenv
- **Purpose:** Environment variable management

### Node.js
- **License:** MIT
- **Repository:** https://github.com/nodejs/node
- **Purpose:** JavaScript runtime

---

## Frontend Dependencies

### React
- **License:** MIT
- **Repository:** https://github.com/facebook/react
- **Purpose:** UI library

### Vite
- **License:** MIT
- **Repository:** https://github.com/vitejs/vite
- **Purpose:** Build tool

### Vitest
- **License:** MIT
- **Repository:** https://github.com/vitest-dev/vitest
- **Purpose:** Test framework

---

## Infrastructure & DevOps

### Docker
- **License:** AGPL-3.0 (Community), Commercial
- **Repository:** https://github.com/moby/moby
- **Purpose:** Containerization

### Nginx
- **License:** BSD-2-Clause
- **Repository:** https://github.com/nginx/nginx
- **Purpose:** Reverse proxy and web server

### PM2
- **License:** AGPL-3.0 (Community), Commercial
- **Repository:** https://github.com/Unitech/pm2
- **Purpose:** Process manager

### GitHub Actions
- **License:** Proprietary
- **Repository:** https://github.com/features/actions
- **Purpose:** CI/CD automation

---

## Development Tools

### GitHub Copilot
- **License:** Proprietary
- **Purpose:** AI-assisted code generation
- **Usage:** Used for code analysis, documentation, and boilerplate generation
- **Policy:** See [AI_USAGE.md](../AI_USAGE.md)

### ESLint
- **License:** MIT
- **Repository:** https://github.com/eslint/eslint
- **Purpose:** Code linting

### Prettier
- **License:** MIT
- **Repository:** https://github.com/prettier/prettier
- **Purpose:** Code formatting

---

## Full License Information

### MIT License
The MIT License is a permissive license that allows commercial use, modification, distribution, and private use.

**Text:**
```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

### AGPL-3.0 License
The GNU Affero General Public License is a copyleft license requiring source code disclosure.

**Text:** See https://www.gnu.org/licenses/agpl-3.0.txt

### BSD-2-Clause License
A permissive license similar to MIT but with additional liability clause.

**Text:** See https://opensource.org/licenses/BSD-2-Clause

---

## Compliance

This project respects all third-party licenses:

- ✅ All dependencies are properly licensed
- ✅ License compliance verified
- ✅ Attribution provided for all major components
- ✅ No GPL code mixed with MIT code inappropriately
- ✅ Commercial dependencies properly identified

---

## Dependency Audit

### Security
- Regular dependency updates via [Dependabot](https://dependabot.com/)
- Security vulnerabilities addressed promptly
- See [SECURITY.md](../SECURITY.md) for security policies

### Outdated Packages
- Run `npm outdated` to check for outdated packages
- Regular update schedule maintained
- Breaking changes evaluated before updates

---

## Contributing & License

By contributing to this project, you agree that:
- Your contributions are licensed under the MIT License
- You have the right to contribute the code
- You are not violating any third-party licenses
- You understand the project license

See [CONTRIBUTING.md](../docs/CONTRIBUTING.md) for more details.

---

## License Questions?

If you have questions about third-party licenses:

1. Check package.json and package-lock.json
2. Run `npm license` to see all licenses
3. Review individual package repositories
4. Open an issue for clarification

---

## Attribution & Credits

Special thanks to:
- All open-source maintainers and contributors
- The Node.js community
- The React community
- The open-source ecosystem

---

**Last Updated:** 2025-10-27  
**Version:** 1.0  
**Compliance Status:** ✅ Current
