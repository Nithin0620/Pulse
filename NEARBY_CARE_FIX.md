# Nearby Care Map Fix - Overpass API CORS Issue

## Problem
The Nearby Care map was not showing hospitals, clinics, or pharmacies due to:
1. **CORS errors** - The primary Overpass API server blocks browser requests from localhost
2. **502 Bad Gateway** - The primary server (overpass-api.de) was down or overloaded
3. **No fallback** - No alternative servers or error recovery

## Root Cause
Browser CORS policy blocks requests from `http://localhost:5173` to external APIs that don't set proper CORS headers. The Overpass API doesn't always respond with `Access-Control-Allow-Origin: *`, especially when the server is under load.

## Solution

### 1. Added Multiple API Mirrors
Implemented fallback logic to try multiple Overpass API servers in sequence:
- `https://overpass.kumi.systems` (primary - most reliable)
- `https://overpass.openstreetmap.ru` (backup)
- `https://overpass-api.de` (backup)

### 2. Development Proxy (CORS Workaround)
Added a Vite proxy configuration to route Overpass API requests through the local dev server:
- **Development**: Requests go to `/api/overpass` → proxied to `overpass.kumi.systems`
- **Production**: Direct requests to public API servers

File: `vite.config.ts`
```typescript
server: {
  proxy: {
    '/api/overpass': {
      target: 'https://overpass.kumi.systems',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/overpass/, '/api/interpreter'),
      secure: true,
    }
  }
}
```

### 3. Environment Detection
The service automatically detects dev vs production:
- **DEV** (`import.meta.env.DEV`): Uses `/api/overpass` proxy
- **PROD**: Uses public API mirrors with fallback

### 4. Better Error Handling
- Logs which mirror is being tried
- Continues to next mirror on failure
- Only throws error after all mirrors fail
- Clear console messages for debugging

## Files Modified

### `src/services/overpassService.ts`
- Added multiple API mirror URLs
- Implemented fallback retry logic
- Added environment detection (dev vs prod)
- Enhanced logging for debugging
- Added explicit CORS mode in fetch

### `vite.config.ts`
- Added proxy configuration for development
- Routes `/api/overpass` to `overpass.kumi.systems`

## How to Apply the Fix

### Step 1: Restart the Dev Server
The Vite config changes require a server restart:

**Option A: Stop and restart manually**
```bash
# Press Ctrl+C in the terminal running `npm run dev`
# Then restart:
npm run dev
```

**Option B: Kill all node processes and restart (if needed)**
```powershell
# Windows PowerShell
Get-Process node | Stop-Process -Force
npm run dev
```

### Step 2: Clear Browser Cache
```
1. Open DevTools (F12)
2. Right-click the refresh button → "Empty Cache and Hard Reload"
   OR
   Hold Ctrl+Shift+R (Chrome/Edge) or Ctrl+F5 (Firefox)
```

### Step 3: Test the Feature
1. Navigate to the Nearby Care / Map page
2. Allow location permissions when prompted
3. Wait 5-10 seconds for the query to complete
4. **Expected**: Map shows markers for hospitals, clinics, pharmacies
5. **Console**: Should show logs like:
   ```
   [NearbyCare] Trying Overpass mirror 1/1: /api/overpass
   [NearbyCare] Success with mirror 1, found X places
   ```

## Troubleshooting

### If Still Seeing CORS Errors
1. **Verify the dev server restarted**: Check the terminal shows the new Vite config
2. **Check the URL**: Console should show requests to `/api/overpass`, not `https://overpass-api.de`
3. **Hard refresh**: Ctrl+Shift+R to clear service worker cache

### If No Results Appear
1. **Check console logs**: Look for `[NearbyCare]` messages
2. **Verify location**: Make sure browser granted location permission
3. **Try different location**: Some areas might have sparse OSM data
4. **Check timeout**: Wait at least 20 seconds (queries can be slow)

### If All Mirrors Fail
This means:
- All Overpass API servers are down (rare but possible)
- Network connectivity issue
- Firewall blocking requests

**Workaround**: Consider implementing a backup using Google Places API (requires API key but more reliable)

## Production Deployment

When deploying to production (Firebase Hosting, Vercel, etc.):
- The proxy is **only active in development**
- Production builds will use the public API mirrors directly
- CORS shouldn't be an issue on production domains (unlike localhost)
- If CORS issues persist in production, consider:
  1. Using a backend API proxy
  2. Implementing Google Places API as alternative
  3. Using Nominatim API (OpenStreetMap's geocoding service)

## Alternative Solutions (Future Enhancement)

### Option 1: Google Places API
- More reliable and faster
- Better data quality
- Requires API key (free tier: 100k requests/month)
- Better CORS support

### Option 2: Backend Proxy
- Create a Firebase Cloud Function or serverless function
- Proxy requests server-side (no CORS issues)
- Add caching layer
- More control over rate limiting

### Option 3: Static Data
- Pre-populate common cities with healthcare facilities
- Store in Firestore or Firebase Storage
- No real-time queries needed
- Works offline

## Testing Checklist

- [ ] Dev server restarted successfully
- [ ] Browser cache cleared (hard refresh)
- [ ] Location permission granted
- [ ] Console shows `/api/overpass` requests (not external URLs)
- [ ] No CORS errors in console
- [ ] Map renders with user location marker
- [ ] Hospital/clinic/pharmacy markers appear within 5km
- [ ] Clicking markers shows name, distance, and "Directions" button
- [ ] Filter chips work (Hospital, Clinic, Pharmacy)
- [ ] Distance shown in meters (<1km) or kilometers (>1km)

## Success Criteria
✅ No CORS errors in console  
✅ Overpass API requests succeed  
✅ Map shows markers for nearby places  
✅ Clicking "Directions" opens Google Maps  
✅ Phone numbers displayed (if available in OSM data)  

---

**Note**: The Overpass API is a free, community-run service and can be slow or down occasionally. If reliability is critical, consider implementing Google Places API as a fallback or primary option.
