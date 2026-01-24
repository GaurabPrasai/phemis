# Git LFS Troubleshooting Guide

## Problem: Git LFS Pull Not Working

When `git lfs pull` completes without errors but your LFS-tracked files remain as small pointer files instead of actual content.

## Symptoms

- `git lfs fetch` shows objects are downloaded (e.g., "3 objects found, done")
- `git lfs pull` runs without errors but doesn't output anything
- LFS-tracked files are ~130 bytes and contain pointer metadata like:
  ```
  version https://git-lfs.github.com/spec/v1
  oid sha256:...
  size ...
  ```
- Actual LFS objects exist in `.git/lfs/objects/` directory

## Diagnosis Steps

### 1. Check which files are tracked by LFS

```bash
git lfs ls-files
```

### 2. Verify files are pointers (not actual content)

```bash
# Check file size (pointers are ~100-200 bytes)
ls -lh path/to/your/file.pkl

# Check file content
head -5 path/to/your/file.pkl
```

### 3. Confirm LFS objects are in cache

```bash
find .git/lfs/objects -type f
```

If objects are present in cache but files are still pointers, the smudge filter isn't working.

## Solution: Manual Smudge

When automatic checkout fails, manually convert pointer files to actual content:

```bash
# Find the OID of your LFS file
git lfs ls-files
# Output example: 9f735d28dc - backend/recommender_api/movies.pkl

# Manually smudge from cache to working directory
git lfs smudge < .git/lfs/objects/9f/73/9f735d28dcfb3945d9b032f24d36ce2782d1475314273557dd05d7062dffae82 > backend/recommender_api/movies.pkl
```

### Finding the Cache Path

The cache path follows this pattern:

```
.git/lfs/objects/[first 2 chars]/[next 2 chars]/[full OID]
```

For OID `9f735d28dc...`:

```
.git/lfs/objects/9f/73/9f735d28dc...
```

### Alternative: Direct Copy

If smudge fails, copy directly from cache:

```bash
cp .git/lfs/objects/9f/73/9f735d28dc... path/to/your/file.pkl
```

## Prevention & Maintenance

### Verify LFS installation

```bash
# Check LFS is installed
git lfs version

# Reinstall LFS filters if needed
git lfs install --force
```

### Standard workflow that should work

```bash
# Fetch all LFS objects
git lfs fetch --all

# Checkout LFS files (replaces pointers with actual content)
git lfs checkout
```

### Check LFS filter configuration

```bash
git config --get filter.lfs.smudge
git config --get filter.lfs.clean
```

Should output:

```
git-lfs smudge -- %f
git-lfs clean -- %f
```

## Common Issues

**Issue**: `git lfs pull` does nothing

- **Cause**: Objects already fetched but not checked out
- **Fix**: Run `git lfs checkout` or manual smudge

**Issue**: Files remain as pointers after checkout

- **Cause**: Smudge filter not running properly
- **Fix**: Manual smudge or reinstall LFS filters

**Issue**: "No logs to show" from `git lfs logs last`

- **Meaning**: LFS commands ran without errors (may still need manual intervention)

## Verification

After applying the fix:

```bash
# Files should now be much larger
ls -lh path/to/your/files

# Content should be binary data, not pointer text
file path/to/your/file.pkl
```

Expected output: `path/to/your/file.pkl: data` (not ASCII text)

## Quick Reference

```bash
# Diagnose
git lfs ls-files                    # List LFS-tracked files
git lfs status                      # Check LFS status
find .git/lfs/objects -type f       # List cached objects

# Standard fix attempts
git lfs fetch --all                 # Fetch all LFS objects
git lfs checkout                    # Checkout LFS files
git lfs install --force             # Reinstall filters

# Manual fix (when automatic methods fail)
git lfs smudge < .git/lfs/objects/XX/XX/[full-oid] > path/to/file
```
