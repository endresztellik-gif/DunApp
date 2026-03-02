# Skill: DunApp CSP Header Updates

Use this skill when adding new external domains to the Content Security Policy in netlify.toml.

## CSP Header Location

File: `/Volumes/Endre_Samsung1T/codeing/dunapp-pwa/netlify.toml`

The CSP is defined under:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      ...
    """
```

## Current CSP Directives (as of 2026-03-02)

```
default-src 'self';
script-src 'self' https://unpkg.com;
style-src 'self' https://unpkg.com https://fonts.googleapis.com 'unsafe-inline';
style-src-elem 'self' https://unpkg.com https://fonts.googleapis.com 'unsafe-inline';
img-src 'self' data: https: blob: https://www.met.hu https://odp.met.hu;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self'
  https://*.supabase.co
  https://api.openweathermap.org
  https://api.met.no
  https://api.rainviewer.com
  https://tilecache.rainviewer.com
  https://odp.met.hu
  https://archive-api.open-meteo.com
  https://map.hugeo.hu
  https://ovfgis2.vizugy.hu
  https://*.tile.openstreetmap.org
  wss://*.supabase.co;
frame-src 'self';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

## Which Directive to Update for Different Resource Types

| Resource Type | Directive to Update | Example |
|--------------|---------------------|---------|
| API calls / fetch requests | `connect-src` | New REST API endpoint |
| Map tile images | `img-src` AND `connect-src` | New tile provider |
| External JavaScript | `script-src` | CDN-hosted library |
| External CSS / fonts | `style-src`, `style-src-elem`, `font-src` | Google Fonts |
| Embedded iframes | `frame-src` | Embedded map/chart service |
| WebSocket connections | `connect-src` | New websocket endpoint (use wss://) |
| Data URIs (inline images) | `img-src` | Already includes `data:` |

## Pattern for Adding a New Domain

Example: Adding a new weather API at `api.newweather.com`

1. Identify the resource type (API call -> `connect-src`)
2. Edit netlify.toml, find the `connect-src` line
3. Append the new domain before the semicolon:

```toml
# Before:
connect-src 'self' https://*.supabase.co ... https://*.tile.openstreetmap.org wss://*.supabase.co;

# After:
connect-src 'self' https://*.supabase.co ... https://*.tile.openstreetmap.org wss://*.supabase.co https://api.newweather.com;
```

Example: Adding a new map tile provider at `tiles.newprovider.com`

Needs both `img-src` (tile images) and `connect-src` (fetch requests):

```toml
# img-src: add the domain
img-src 'self' data: https: blob: https://www.met.hu https://odp.met.hu https://tiles.newprovider.com;

# connect-src: add the domain
connect-src 'self' ... https://*.tile.openstreetmap.org https://tiles.newprovider.com wss://*.supabase.co;
```

## Wildcard Patterns

Use wildcards for subdomains when the service uses multiple subdomains:
- `https://*.supabase.co` - matches any Supabase subdomain
- `https://*.tile.openstreetmap.org` - matches a, b, c tile subdomains
- `wss://*.supabase.co` - WebSocket wildcard

Only use wildcards when needed. Prefer specific domains for security.

## Testing CSP Changes

After updating netlify.toml and deploying:
1. Open Chrome DevTools > Console
2. Look for CSP violation errors (red errors starting with "Refused to...")
3. The error message tells you exactly which directive is missing and which domain needs adding
4. Fix by adding the domain to the appropriate directive

## Important Notes

- The `'unsafe-inline'` in `style-src` is required for Tailwind CSS inline styles
- The `https:` wildcard in `img-src` allows any HTTPS image (needed for weather icons etc.)
- The `blob:` in `img-src` is needed for dynamically generated map tiles
- Do NOT add `'unsafe-eval'` to `script-src` - not needed and violates OWASP
- After any CSP change, rebuild and deploy to see effect (CSP is a header, not cached at code level)
