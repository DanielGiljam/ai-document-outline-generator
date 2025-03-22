# AI document outline generator

AI-powered UI which generates document outline for user after asking user a series of increasingly specific questions about what they plan on writing a document about.

## Getting started

Pre-requisites: [Node.js](https://nodejs.org) and [PNPM](https://pnpm.io).

1. Clone repo

2. Copy `.env.example` as `.env` and replace `GOOGLE_GENERATIVE_AI_API_KEY` with [your actual API key](https://aistudio.google.com).

3. Install dependencies

   ```sh
   pnpm install
   ```

4. Run local dev server

   ```sh
   pnpm dev
   ```

5. Open up Payload admin UI in web browser ([http://localhost:3000/admin](http://localhost:3000/admin) by default)

6. Select "Documents" —> "Create new"

7. Try out the AI document outline generator
