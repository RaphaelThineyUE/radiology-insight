# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### Option 1: Deploy via Lovable (Easiest)

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

### Option 2: Deploy to GitHub Pages (Automated)

This project is configured to automatically deploy to GitHub Pages when you push to the main branch.

1. Go to your repository settings on GitHub
2. Navigate to Pages section (Settings → Pages)
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Push to the main branch and the deployment will start automatically

The site will be available at: `https://raphaelthineyue.github.io/radiology-insight/`

### Option 3: Create a Release

To create a new release with packaged assets:

1. Update the version in `package.json`
2. Commit your changes
3. Create and push a git tag:
   ```sh
   git tag v1.0.0
   git push origin v1.0.0
   ```
4. The release workflow will automatically build and create a GitHub release with downloadable assets

### Manual Deployment

To build and deploy manually:

```sh
# Build the project
npm run build

# The built files will be in the dist/ directory
# You can deploy these files to any static hosting service
```

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
