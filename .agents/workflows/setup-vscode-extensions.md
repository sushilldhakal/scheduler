---
description: Detect project tech stack and create recommended VS Code extensions file
---

# Setup VS Code Recommended Extensions

This workflow detects the tech stack used in a project and creates/updates the `.vscode/extensions.json` file with recommended extensions tailored to the project.

## Steps

1. **Read the project's `package.json`** to determine the dependencies and frameworks in use (e.g., Next.js, React, TypeScript, Zod, MongoDB, Tailwind CSS, Prisma, GraphQL, etc.).

2. **Inspect the project structure** to confirm the tech stack (e.g., check for `tsconfig.json` for TypeScript, `tailwind.config.*` for Tailwind, `schema.prisma` for Prisma).

3. **Select recommended extensions** based on what is found:
   - **Always include** (general quality):
     - `dbaeumer.vscode-eslint` — ESLint integration
     - `esbenp.prettier-vscode` — Code formatter
   - **TypeScript** (`tsconfig.json` or `typescript` in deps):
     - `yoavbls.pretty-ts-errors` — Readable TypeScript errors (especially helpful with Zod)
   - **React / Next.js** (`next` or `react` in deps):
     - `dsznajder.es7-react-js-snippets` — React/Next.js code snippets
   - **Tailwind CSS** (`tailwindcss` in deps or `tailwind.config.*` present):
     - `bradlc.vscode-tailwindcss` — Tailwind IntelliSense
   - **MongoDB** (`mongodb` or `mongoose` in deps):
     - `mongodb.mongodb-vscode` — Official MongoDB extension
   - **Prisma** (`prisma` or `@prisma/client` in deps):
     - `Prisma.prisma` — Prisma schema formatting and IntelliSense
   - **GraphQL** (`graphql` in deps):
     - `GraphQL.vscode-graphql` — GraphQL syntax highlighting and IntelliSense
     - `GraphQL.vscode-graphql-syntax` — GraphQL syntax support
   - **Docker** (`Dockerfile` present):
     - `ms-azuretools.vscode-docker` — Docker support
   - **Git utilities** (always useful):
     - `eamodio.gitlens` — Enhanced Git integration

4. **Create or update `.vscode/extensions.json`** in the project root with the selected extensions in this format:
   ```json
   {
     "recommendations": [
       "extension.id-1",
       "extension.id-2"
     ]
   }
   ```

5. **Report back** with a summary of:
   - The tech stack detected
   - The list of extensions added and why each one was chosen
