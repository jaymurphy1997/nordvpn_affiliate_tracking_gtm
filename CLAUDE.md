# VPN.com GTM Affiliate Link Decoration Script

## Project Overview

This is a Google Tag Manager (GTM) Custom HTML tag script that decorates NordVPN affiliate links (`go.nordvpn.net`) with tracking parameters. It runs client-side in the browser and appends query parameters to affiliate URLs for attribution, analytics, and A/B test tracking.

The script is deployed via GTM and executes on every page of the VPN.com website.

## Critical Environment Constraints

### GTM Custom HTML Tags
- All code must be wrapped in `<script>` tags
- **No ES6+ syntax**: No `let`, `const`, arrow functions, template literals, `Promise`, `async/await`, destructuring, or spread operators. Use `var`, `function(){}`, and string concatenation only.
- GTM variables are referenced with double curly braces: `{{Variable Name}}`. These are NOT JavaScript — they are resolved by GTM at runtime. Do not attempt to refactor, rename, or treat them as strings. They must appear exactly as named in GTM.
- The script runs as an IIFE inside a Custom HTML tag

### GTM Variables Used in This Script
These are the GTM variable references. Do not modify the variable names — they must match the GTM container configuration exactly:

| GTM Variable | Type | Returns |
|---|---|---|
| `{{Analytics data}}` | Custom JavaScript | Object with `client_id`, `session_id`, `user_id` |
| `{{URL - pub_id}}` | URL Variable | `pub_id` query parameter value |
| `{{URL - s2}}` | URL Variable | `s2` query parameter value |
| `{{URL - sub_id}}` | URL Variable | `sub_id` query parameter value |
| `{{Cookie - Yep pub_id}}` | 1st Party Cookie | `yep_pub_id` cookie value |
| `{{Cookie - Yep s2}}` | 1st Party Cookie | `yep_s2` cookie value |
| `{{Cookie - Yep sub_id}}` | 1st Party Cookie | `yep_sub_id` cookie value |
| `{{dlv_abVariant}}` | Data Layer Variable | A/B test variant (e.g., "a", "b") |
| `{{dlv_abTestName}}` | Data Layer Variable | A/B test name (e.g., "hero") |
| `{{Cookie - AB Test sub_id3}}` | 1st Party Cookie | `ab_test_sub_id3` cookie value |
| `{{dlv_track_label}}` | Data Layer Variable | Track label for aff_sub (e.g., "y1", "email", "social") |
| `{{Cookie - Track Label}}` | 1st Party Cookie | `track_label` cookie value |

## URL Parameter Mapping

The script appends the following parameters to `go.nordvpn.net` URLs:

| URL Parameter | Source | Purpose | Required |
|---|---|---|---|
| `aff_sub` | Track Label (`dlv_track_label`) | Traffic source identification (e.g., "y1", "email", "social") | No |
| `aff_unique1` | GA4 Client ID | Cross-session user identification | Yes |
| `aff_unique2` | GA4 Session ID | Session attribution | Yes |
| `aff_unique3` | GA4 User ID | Logged-in user tracking | No |
| `aff_unique4` | `Date.now()` timestamp | Click-level deduplication | Yes |
| `aff_click_id` | Yep S2 value | Yep network click attribution | No |
| `aff_sub2` | Page path (e.g., "homepage", "_vpn_nordvpn_") | Conversion page identification | Yes |
| `aff_sub3` | A/B test name + variant (e.g., "hero_a") | Test exposure tracking | No |
| `aff_sub4` | Yep Publisher ID | Yep publisher attribution | No |
| `aff_sub5` | Yep Sub ID | Yep sub-channel attribution | No |

### `aff_sub` from Data Layer
The `aff_sub` parameter is populated from the `dlv_track_label` Data Layer Variable. This value persists across pages via cookie storage (30 days). It appears as "Sub ID 1" in NordVPN reporting and is used to identify traffic sources.

## Script Architecture

The script has three decoration mechanisms that work together:

1. **Initial page load decoration** — Runs on DOM ready, decorates all existing `a[href*="go.nordvpn.net"]` links with available data
2. **MutationObserver** — Watches for dynamically added links (lazy-loaded content, modals, AJAX) and decorates them
3. **Click handler (capture phase)** — Last line of defense. On click, retrieves fresh GA4 data from cookies and fills in any missing parameters before navigation

### Key Design Decisions
- The script must NOT hard-exit when GA4 data is unavailable. It decorates with whatever data exists (page path, A/B test, Yep params) and relies on the click handler to fill in GA4 values later.
- `hasParam()` checks prevent duplicate parameters — this makes it safe for the click handler to re-process already-decorated links.
- The `data-gtm-decorated` attribute prevents re-processing during initial load and MutationObserver, but the click handler intentionally bypasses this flag.
- Cookie values (Yep params, A/B test) persist across pages so conversions on non-landing pages still carry attribution data.

## Page Path Handling

- `/` or blank path → `"homepage"`
- All other paths: slashes replaced with underscores (e.g., `/vpn/nordvpn/` → `_vpn_nordvpn_`)
- The new website (launched late 2025) changed homepage path from `"/"` to blank — the script must handle both

## GA4 Cookie Fallback

When the `{{Analytics data}}` GTM variable is not ready, the click handler reads GA4 data directly from cookies:

- **Client ID**: From `_ga` cookie, format `GA1.1.XXXXXXXXXX.XXXXXXXXXX` → extract last two segments joined by `.`
- **Session ID**: From `_ga_XXXXXX` cookie (measurement ID suffix), format `GS2.1.SESSION_ID.TIMESTAMP...` → extract third segment

Verify the exact cookie format in browser dev tools if GA4 configuration changes.

## Testing

### Manual Testing
1. Open browser dev tools → Console
2. All script activity is logged with `GTM:` prefix
3. Verify decoration summary shows expected values
4. Click a NordVPN link and check the console for click handler output
5. Test with GA4 blocked (e.g., ad blocker) to verify partial decoration still occurs

### Key Test Cases
- Page load with GA4 ready → all parameters decorated
- Page load with GA4 blocked → page path, A/B, Yep params decorated; GA4 fields missing
- Click after GA4 initializes late → click handler fills in GA4 fields from cookies
- Homepage with blank path → `aff_sub2=homepage`
- Page with A/B test → `aff_sub3` populated from data layer or cookie
- Non-test page after visiting test page → `aff_sub3` populated from cookie
- Dynamically loaded link (e.g., modal) → MutationObserver decorates it

## Code Style
- All `console.log` messages prefixed with `GTM:`
- Comments use `// ===== SECTION NAME =====` for major sections
- JHM update comments include date: `// JHM update MM/DD/YY - description`
- Use `var` throughout, no ES6+
- Semicolons required
- Encode all parameter values with `encodeURIComponent()`

## Reporting Context

In NordVPN affiliate reporting, the parameters map to these column names:

| URL Parameter | Report Column |
|---|---|
| `aff_sub` | Sub ID 1 |
| `aff_sub2` | Sub ID 2 |
| `aff_sub3` | Sub ID 3 |
| `aff_sub4` | Sub ID 4 |
| `aff_sub5` | Sub ID 5 |
| `aff_unique1` | Unique ID 1 |
| `aff_unique2` | Unique ID 2 |
| `aff_unique3` | Unique ID 3 |
| `aff_unique4` | Unique ID 4 |
| `aff_click_id` | Click ID |
