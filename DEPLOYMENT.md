# Deployment Guide

This repository is configured with automated CI/CD workflows for building, testing, and deploying the application.

## Available Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Trigger:** Runs on every push to `main` branch and on all pull requests

**Purpose:** Ensures code quality and builds successfully

**Steps:**
- Checkout code
- Install dependencies
- Run linter
- Build application
- Upload build artifacts

### 2. GitHub Pages Deployment (`.github/workflows/deploy.yml`)

**Trigger:** 
- Automatically on push to `main` branch
- Manually via GitHub Actions UI (workflow_dispatch)

**Purpose:** Deploy the application to GitHub Pages

**Setup Required:**
1. Go to repository Settings → Pages
2. Under "Build and deployment", select "GitHub Actions" as the source
3. The site will be available at: `https://raphaelthineyue.github.io/radiology-insight/`

**Steps:**
- Build the application with production settings
- Configure GitHub Pages
- Upload and deploy to GitHub Pages

### 3. Release Workflow (`.github/workflows/release.yml`)

**Trigger:** When a version tag is pushed (e.g., `v1.0.0`, `v1.2.3`)

**Purpose:** Create a GitHub release with downloadable assets

**How to Create a Release:**

```bash
# 1. Update version in package.json
npm version patch  # or minor, or major

# 2. Create and push the tag
git tag v1.0.0
git push origin v1.0.0

# Or use npm version which creates the tag automatically:
npm version patch
git push --follow-tags
```

**What Gets Created:**
- GitHub Release page with changelog
- Downloadable ZIP archive of built application
- Downloadable TAR.GZ archive of built application

## Configuration Details

### Vite Configuration

The project is configured with:
- **Base path:** `/radiology-insight/` for GitHub Pages deployment (can be overridden with `BASE_PATH` environment variable)
- **Build target:** `esnext` to support modern JavaScript features (required for pdfjs-dist)
- **Mode-aware base path:** Development mode uses `/`, production uses the repository path

**Customizing the base path:**
```bash
# For a different repository name or custom domain
BASE_PATH=/my-custom-path/ npm run build

# For deployment to root domain
BASE_PATH=/ npm run build
```

### Version Management

The project uses semantic versioning (SemVer):
- Current version: `1.0.0`
- Update using `npm version [patch|minor|major]`
- Follow SemVer guidelines:
  - **PATCH** (1.0.x): Bug fixes
  - **MINOR** (1.x.0): New features (backward compatible)
  - **MAJOR** (x.0.0): Breaking changes

## Manual Deployment

If you need to deploy manually:

```bash
# Build the application
npm run build

# The built files will be in the dist/ directory
# Deploy these files to any static hosting service
```

## Troubleshooting

### GitHub Pages not working
- Verify GitHub Pages is enabled in repository settings
- Check that "GitHub Actions" is selected as the deployment source
- Review workflow run logs in the Actions tab

### Build failures
- Check workflow logs in the Actions tab
- Ensure all dependencies are properly listed in package.json
- Test the build locally with `npm run build`

### Release not created
- Verify the tag follows the `v*.*.*` format (e.g., `v1.0.0`)
- Check that you have write permissions to the repository
- Review workflow logs in the Actions tab

## Best Practices

1. **Before merging to main:** Ensure all CI checks pass
2. **Creating releases:** Update version in package.json before tagging
3. **Testing deployments:** Use the workflow_dispatch trigger to manually test deployments
4. **Monitoring:** Check the Actions tab regularly for workflow status
