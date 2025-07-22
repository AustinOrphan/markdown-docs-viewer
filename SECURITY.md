# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Markdown Docs Viewer seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: austin@austinorphan.com

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### What to Expect

When you report a vulnerability, we will:

1. **Acknowledge** your email within 48 hours
2. **Investigate** the issue and determine its impact
3. **Work on a fix** and coordinate with you on the timeline
4. **Release a patch** as soon as possible
5. **Credit you** in the security advisory (unless you prefer to remain anonymous)

### Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and will be clearly marked in the release notes.

We recommend that all users subscribe to our GitHub releases to be notified of security updates.

## Security Best Practices

When using Markdown Docs Viewer, we recommend:

1. **Always use the latest version** - We regularly update dependencies and fix vulnerabilities
2. **Sanitize user input** - If accepting markdown from users, always sanitize it before rendering
3. **Use Content Security Policy** - Implement CSP headers to prevent XSS attacks
4. **Restrict document sources** - Only load documents from trusted sources
5. **Monitor dependencies** - Use tools like `npm audit` to check for vulnerabilities

## Dependencies

This project relies on the following security-critical dependencies:

- **marked** - For markdown parsing (always uses latest security patches)
- **highlight.js** - For syntax highlighting (regularly updated)

We use Dependabot to keep these dependencies up to date and monitor for security vulnerabilities.

## Contact

For any security-related questions that don't involve reporting a vulnerability, please open a discussion on our GitHub repository.

Thank you for helping keep Markdown Docs Viewer and its users safe!
