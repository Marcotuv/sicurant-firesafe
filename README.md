<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1HWSXHlMnOuw2m5iNn88KknRvwnH49avM

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Release Workflow

To deploy a new version (update version, build, commit, and push):

1. **Patch Release** (v1.0.0 -> v1.0.1):
   ```bash
   npm run release
   ```

2. **Minor Release** (v1.0.0 -> v1.1.0):
   ```bash
   npm run release minor
   ```

3. **Major Release** (v1.0.0 -> v2.0.0):
   ```bash
   npm run release major
   ```

> **Note**: This command automatically:
> - Updates `package.json` version
> - Updates the version displayed in the Sidebar
> - Runs `npm run build` to verify
> - Commits changes with a standard message
> - Pushes to the remote repository (triggering Vercel deployment if connected)

