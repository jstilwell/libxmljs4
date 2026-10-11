#!/usr/bin/env bash
set -euo pipefail

# Release script.
#
#   ./bin/deploy.sh <patch|minor|major>
#     Build and test, merge into main, bump the version, then push main and
#     the new tag. It does not publish to npm: the tag starts the builds
#     workflow, which builds prebuilds for every platform, attaches them to
#     the GitHub Release and, once npm trusted publishing is enabled,
#     publishes the package with provenance.
#
#   ./bin/deploy.sh publish
#     Manual fallback for when CI publishing is not enabled. Run it from a
#     clean checkout of the release tag after the workflow's deploy job has
#     finished. It downloads that tag's prebuilds from the GitHub Release
#     and publishes only if every platform plus the musl build is present.
#
# Publishing from prebuilds/ as built locally ships this machine's platform
# only; v1.0.0 and v1.2.0 went out darwin-arm64-only that way.

REPO="jstilwell/libxmljs4"
WORKFLOW_URL="https://github.com/$REPO/actions/workflows/builds.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  echo "Usage: ./bin/deploy.sh <patch|minor|major>"
  echo "       ./bin/deploy.sh publish"
  exit 1
}

require_clean_tree() {
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Error: working tree is not clean. Commit or stash changes first."
    exit 1
  fi
}

release() {
  local bump="$1"
  require_clean_tree

  local branch
  branch="$(git branch --show-current)"

  # Build and test on current branch before merging
  echo "Building native addon..."
  pnpm run build

  echo "Building TypeScript..."
  pnpm run build:ts

  echo "Running tests..."
  pnpm test

  # Merge into main if on a feature branch
  if [[ "$branch" != "main" ]]; then
    echo "Switching to main and merging '$branch'..."
    git checkout main
    git pull --ff-only origin main
    git merge --no-ff "$branch" -m "Merge branch '$branch'"
    git branch -d "$branch"
  else
    echo "Pulling latest from origin..."
    git pull --ff-only origin main
  fi

  # Bump version (updates package.json and creates git tag)
  echo "Bumping $bump version..."
  local new_version
  new_version="$(npm version "$bump" -m "v%s")"
  echo "New version: $new_version"

  # Push commit and tag
  echo "Pushing to origin..."
  git push origin main
  git push origin "$new_version"

  echo ""
  echo "Pushed main and tag $new_version. Nothing was published to npm from"
  echo "this machine."
  echo ""
  echo "The tag starts the builds workflow:"
  echo "  $WORKFLOW_URL"
  echo "Its deploy job attaches libxmljs4-prebuilds-$new_version.tar.gz to the"
  echo "GitHub Release. Its publish job then publishes $new_version to npm with"
  echo "provenance, if the NPM_TRUSTED_PUBLISHING repository variable is 'true'."
  echo ""
  echo "If trusted publishing is not enabled, wait for the deploy job to finish,"
  echo "then run:"
  echo "  git checkout $new_version && ./bin/deploy.sh publish"
}

publish_from_release() {
  require_clean_tree

  local version tag asset
  version="$(node -p "require('./package.json').version")"
  tag="v$version"
  asset="libxmljs4-prebuilds-$tag.tar.gz"

  echo "Prefer the tag-driven CI publish (the publish job in $WORKFLOW_URL)."
  echo "This publishes $tag from this machine instead."
  echo ""

  if ! git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
    echo "Error: tag $tag does not exist. Release with ./bin/deploy.sh <bump> first."
    exit 1
  fi
  if [[ "$(git rev-parse HEAD)" != "$(git rev-parse "$tag^{commit}")" ]]; then
    echo "Error: HEAD is not $tag. Run: git checkout $tag"
    exit 1
  fi

  if [[ -n "$(npm view "libxmljs4@$version" version 2>/dev/null)" ]]; then
    echo "libxmljs4@$version is already on npm (the CI publish job may have"
    echo "published it). Nothing to do."
    exit 0
  fi

  if ! command -v gh >/dev/null 2>&1; then
    echo "Error: the GitHub CLI (gh) is needed to download $asset."
    exit 1
  fi

  # Start from an empty prebuilds/ so nothing stale from an earlier build or
  # release ends up in the package, then fill it from this tag's release.
  # Global, not local: the EXIT trap runs after this function returns.
  DOWNLOAD_DIR="$(mktemp -d)"
  trap 'rm -rf "$DOWNLOAD_DIR"' EXIT
  echo "Downloading $asset from the $tag GitHub Release..."
  gh release download "$tag" --repo "$REPO" --pattern "$asset" --dir "$DOWNLOAD_DIR"
  rm -rf prebuilds
  mkdir prebuilds
  tar -xzf "$DOWNLOAD_DIR/$asset" -C prebuilds
  find prebuilds -type f

  if ! bash "$SCRIPT_DIR/check-prebuilds.sh" prebuilds; then
    echo "Error: prebuilds/ is missing a platform. Not publishing."
    exit 1
  fi

  echo "Building TypeScript..."
  pnpm run build:ts

  echo "Publishing $tag to npm..."
  npm publish --access public

  echo ""
  echo "Published libxmljs4@$version: https://www.npmjs.com/package/libxmljs4"
}

case "${1:-}" in
  patch | minor | major) release "$1" ;;
  publish) publish_from_release ;;
  *) usage ;;
esac
