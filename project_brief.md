# Namma Kuppai — Master Project Brief
Last updated: April 19, 2026

LIVE URL: nammakuppai.in
GitHub: github.com/Chandrujp/nammakuppai
Tagline: For the Chennai we grew up loving.

## TECH STACK
React + Vite + Tailwind + Supabase + Leaflet + Vercel
GitHub: Chandrujp | Vercel: nammakuppai@gmail.com

## COMPLETED FEATURES

Infrastructure:
- Domain, Vercel, Supabase, GitHub all live
- vercel.json for routing
- Supabase: zone + verified_photo_url columns added
- Storage + RLS policies all open

Analytics and SEO - ALL DONE:
- GA4 Google Analytics in index.html
- Microsoft Clarity in index.html
- OG image public/og-image.png done
- sitemap.xml, robots.txt, manifest.json done
- Full meta and OG tags done

Map:
- CartoDB Positron light tiles
- fitBounds frames Chennai hides Bay of Bengal
- Clustering: orange under 10, red 10-50, maroon 50+
- Severity pins: orange=low, red=medium, maroon=high, dark=critical, green=resolved
- Map search via Nominatim

Ward Detection - HYBRID MODEL LOCKED:
- Layer 1: GeoJSON for GCC - exact ward+MLA+MP+Councillor
- Layer 2: Pincode fallback for non-GCC only
- Covers: Avadi, Tambaram, Poonamallee, Thiruverkadu, Kundrathur, Mangadu
- Layer 3: Outside Chennai = submission blocked
- WARNING: GCC pincodes must NOT be in pincode-data.json

Data - gcc-ward-data.json COMPLETE:
- 200 wards with names, numbers, zones
- 22 MLA names from 2021 election
- 5 MP names from 2024 election
- Chennai North MP = Dr. Kalanidhi Veeraswamy
- 200 councillor names from 2022 GCC elections
- 58 mapping errors fixed

Report Form:
- Photo upload with compression 1024px 70% JPEG
- Severity: Low Medium High Critical
- Waste type field, Impact Level label
- Boundary block if outside Chennai

Severity Colors backward compatible:
- Old: minor, moderate, severe, critical
- New: low, medium, high, critical

Filters:
- Severity: All Impact / Low / Medium / High / Critical
- Status: All Status / Pending / Resolved
- Tamil: allSeverity=அனைத்து தாக்கம் allStatus=அனைத்து நிலை

Report Detail Modal:
- Photo, severity, status, ward, days open
- Councillor + MLA + MP accountability
- WhatsApp share with Google Maps link and report URL
- Mark as Cleaned - photo - resolved + verified_photo_url
- GCC complaint link, Call 1913, WhatsApp GCC
- All reports are anonymous always in English

Shareable Report URL:
- Route /report/:id in App.jsx
- File src/pages/ReportPage.jsx

Welcome Onboarding 5 steps WORKING:
- Tap white sheet to advance slides
- Skip and Lets Get Started use stopPropagation
- Step 1: Singara Chennai
- Step 2: Tap the map
- Step 3: Names Councillor + MLA + MP
- Step 4: You report Chennai watches
- Step 5: Coming Soon + Lets Get Started button
- localStorage key nk_welcome_seen
- English only

Header:
- Animated icon cycles Instagram X LinkedIn Telegram every 2.5s
- Lang pill Tamil EN toggle
- Responsibility Board button

Other:
- Responsibility Board at /board
- Stats card: green dot + active + total reports
- Footer: 4 social icons + copyright

Bugs Fixed:
- timeAgo UTC fix
- Pincode 600062 corrected to Avadi
- ReportForm restored after overwrite
- Supabase storage SELECT policy added
- zone column added to table
- isOutsideBoundary was hardcoded false - fixed

## STRATEGIC DECISIONS

TN Expansion - DEFERRED TO PHASE 2:
- Tried expanding to Coimbatore Madurai Trichy Salem Tirunelveli
- Too complex for launch, pincode mapping unreliable outside Chennai
- Chennai metro only for launch

## PENDING IN ORDER

Critical before launch:
1. Seed 30+ real reports - currently only 11-14
2. Validate pincode mappings - test Avadi Tambaram Poonamallee Thiruverkadu
3. Google Search Console verify nammakuppai.in

Launch week:
4. WhatsApp blast top 20 contacts + Chennai founders
5. LinkedIn launch post
6. X post tagging chennaicorporation

Phase 2 after launch:
7. Avadi Tambaram ward GeoJSON for exact detection
8. GPS auto detect location
9. Councillor names after April 23 elections
10. PWA Add to Home Screen
11. Potholes streetlights drains
12. TN full expansion all 234 constituencies

## FILES
src/pages/Home.jsx - map list modals welcome onboarding
src/pages/Board.jsx - Responsibility Board
src/pages/ReportPage.jsx - shareable report URL
src/components/Map.jsx - CartoDB clustering pins
src/components/ReportForm.jsx - form validation compression
src/lib/wardDetection.js - GeoJSON pincode boundary
src/data/gcc-ward-data.json - 200 wards complete
src/data/pincode-data.json - non-GCC metro only
src/App.jsx - router with /report/:id
src/App.css - all CSS
index.html - GA4 Clarity SEO OG done
public/gcc-wards.geojson - 200 ward polygons
public/og-image.png - done
vercel.json - routing fix

## SUPABASE SCHEMA
id, photo_url, latitude, longitude, ward_number, ward_name, zone,
councillor_name, mla_name, mla_constituency, mp_name, mp_constituency,
corporation, severity, status, verified_photo_url, created_at

## CLAUDE RULES FOR EVERY CHAT
1. NEVER use present_files for jsx files - causes blank panel
2. ALWAYS paste code as code blocks in chat
3. ALWAYS give complete file replacements not partial
4. Standard deploy: git add [file] && git commit -m "message" && git push
5. Test welcome in private incognito tab
6. code command not available - user opens VS Code manually

## HOW TO START NEW CHAT
Say: Resume Namma Kuppai build - project_brief.md below
Then paste this entire file
Then say what you want to build or fix
