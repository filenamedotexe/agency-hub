# Git Workflow

## Branch Strategy

### Main Branch

- **main**: Production-ready code
- Protected branch with required reviews
- Deployments triggered automatically

### Development Branches

- **editing-branch**: Primary development branch
- All feature development happens here
- Merge to main only for releases

### Feature Branches

- Create from editing-branch for large features
- Name format: `feature/feature-name`
- Example: `feature/stripe-checkout`

## Development Process

### 1. Start Development

```bash
git checkout editing-branch
git pull origin editing-branch
```

### 2. Make Changes

```bash
# Make your code changes
git add .
git commit -m "feat: add shopping cart functionality"
```

### 3. Push Changes

```bash
git push origin editing-branch
```

### 4. Release to Production

```bash
# When ready for production
git checkout main
git merge editing-branch
git push origin main
```

## Commit Message Convention

Follow conventional commits format:

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc)
- **refactor**: Code refactoring
- **test**: Test additions or modifications
- **chore**: Maintenance tasks

Examples:

```bash
git commit -m "feat: add stripe payment integration"
git commit -m "fix: resolve cart synchronization issue"
git commit -m "docs: update API documentation"
```

## Important Guidelines

### � Critical Rules

1. **NEVER commit directly to main** - Always use editing-branch
2. **Test before merging** - Run `npm run test` before merging to main
3. **Keep commits focused** - One feature/fix per commit
4. **Write clear messages** - Future you will thank you

### Pre-Merge Checklist

Before merging to main:

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Documentation updated if needed
- [ ] Environment variables documented
- [ ] Database migrations applied

### Handling Conflicts

```bash
# Update your branch with latest changes
git checkout editing-branch
git pull origin main
# Resolve any conflicts
git add .
git commit -m "chore: resolve merge conflicts"
```

## Production Deployment

### Automatic Deployment

- Pushing to main triggers Vercel deployment
- Monitor deployment at Vercel dashboard
- Check deployment logs for any issues

### Rollback Process

```bash
# If issues in production
git checkout main
git revert HEAD
git push origin main
```

## Best Practices

1. **Pull before push** - Always pull latest changes before pushing
2. **Small commits** - Make frequent, small commits
3. **Branch cleanup** - Delete merged feature branches
4. **Regular syncs** - Keep editing-branch in sync with main
5. **Document breaking changes** - Update README for major changes
