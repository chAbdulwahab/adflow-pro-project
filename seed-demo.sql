-- ============================================================
-- ADFLOW PRO — 28 DEMO ADS SEED
-- Run this in Supabase SQL Editor after schema + users are set up.
-- Uses subqueries so no hardcoded UUIDs are needed.
-- ============================================================

-- Helper: get a test client user ID (register one first if needed)
-- This seed assumes 'abdul@test.com' exists as a client.
-- Replace the email below if your test client has a different email.

DO $$
DECLARE
  client_id    UUID;
  cat_re       UUID;  -- Real Estate
  cat_veh      UUID;  -- Vehicles
  cat_elec     UUID;  -- Electronics
  cat_jobs     UUID;  -- Jobs
  cat_svc      UUID;  -- Services
  city_khi     UUID;  -- Karachi
  city_lhr     UUID;  -- Lahore
  city_isb     UUID;  -- Islamabad
  city_rwp     UUID;  -- Rawalpindi
  city_fsd     UUID;  -- Faisalabad
  pkg_basic    UUID;
  pkg_standard UUID;
  pkg_premium  UUID;

BEGIN
  -- Look up IDs by name
  SELECT id INTO client_id   FROM users       WHERE email = 'abdul@test.com'    LIMIT 1;
  SELECT id INTO cat_re      FROM categories  WHERE slug  = 'real-estate'       LIMIT 1;
  SELECT id INTO cat_veh     FROM categories  WHERE slug  = 'vehicles'           LIMIT 1;
  SELECT id INTO cat_elec    FROM categories  WHERE slug  = 'electronics'        LIMIT 1;
  SELECT id INTO cat_jobs    FROM categories  WHERE slug  = 'jobs'               LIMIT 1;
  SELECT id INTO cat_svc     FROM categories  WHERE slug  = 'services'           LIMIT 1;
  SELECT id INTO city_khi    FROM cities      WHERE slug  = 'karachi'            LIMIT 1;
  SELECT id INTO city_lhr    FROM cities      WHERE slug  = 'lahore'             LIMIT 1;
  SELECT id INTO city_isb    FROM cities      WHERE slug  = 'islamabad'          LIMIT 1;
  SELECT id INTO city_rwp    FROM cities      WHERE slug  = 'rawalpindi'         LIMIT 1;
  SELECT id INTO city_fsd    FROM cities      WHERE slug  = 'faisalabad'         LIMIT 1;
  SELECT id INTO pkg_basic    FROM packages   WHERE name  = 'Basic'              LIMIT 1;
  SELECT id INTO pkg_standard FROM packages   WHERE name  = 'Standard'           LIMIT 1;
  SELECT id INTO pkg_premium  FROM packages   WHERE name  = 'Premium'            LIMIT 1;

  IF client_id IS NULL THEN
    RAISE EXCEPTION 'Client user not found. Register a user with email abdul@test.com first.';
  END IF;

  -- ── REAL ESTATE (6 ads) ────────────────────────────────────
  INSERT INTO ads (user_id, package_id, category_id, city_id, title, slug, description, price, status, is_featured, publish_at, expire_at, rank_score)
  VALUES
    (client_id, pkg_premium, cat_re, city_khi,
     '5 Marla House for Sale — DHA Phase 6 Karachi',
     'house-sale-dha-phase-6-karachi-a1b2c3',
     'Stunning 5 marla house in DHA Phase 6 Karachi. Double storey, 4 bedrooms, 3 bathrooms, modern kitchen. Close to main boulevard. Registry done. Ready for possession. Price slightly negotiable for serious buyers.',
     18500000, 'published', TRUE, NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 95),

    (client_id, pkg_standard, cat_re, city_lhr,
     '2BR Apartment DHA Lahore — Fully Furnished',
     'apartment-dha-lahore-furnished-d4e5f6',
     '2 bedroom fully furnished apartment in DHA Phase 5 Lahore. American kitchen, backup generator, security 24/7. Ideal for young professionals or couple. Monthly rent PKR 75,000. Available immediately.',
     75000, 'published', FALSE, NOW() - INTERVAL '3 days', NOW() + INTERVAL '12 days', 62),

    (client_id, pkg_premium, cat_re, city_isb,
     'Commercial Plot F-11 Islamabad — Prime Location',
     'commercial-plot-f11-islamabad-g7h8i9',
     '8 Marla commercial plot in F-11 Markaz Islamabad. Possession available. Corner plot. Ideal for office building, bank, or restaurant. All utilities available. Plot number confirmed. Price is final.',
     38000000, 'published', TRUE, NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 90),

    (client_id, pkg_basic, cat_re, city_rwp,
     'Studio Apartment Bahria Town Rawalpindi',
     'studio-apartment-bahria-rwp-j1k2l3',
     'Cozy studio apartment in Bahria Town Phase 8 Rawalpindi. 450 sqft, attached bath, kitchenette. Building has lift and security. Suitable for bachelors or working women. Utilities on actual.',
     22000, 'published', FALSE, NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', 30),

    (client_id, pkg_standard, cat_re, city_fsd,
     '10 Marla House Madina Town Faisalabad',
     'house-madina-town-faisalabad-m4n5o6',
     'Well maintained 10 marla house in Madina Town Faisalabad. Ground + 1 storey. 5 bedrooms, drawing room, car porch. Gas, electricity, water all connected. Schools and markets nearby. Serious buyers contact.',
     22500000, 'published', FALSE, NOW() - INTERVAL '4 days', NOW() + INTERVAL '11 days', 55),

    (client_id, pkg_premium, cat_re, city_khi,
     'Luxury Penthouse Sea View Clifton Karachi',
     'penthouse-sea-view-clifton-karachi-p7q8r9',
     'Breathtaking sea-view penthouse on 30th floor in Clifton Karachi. 4500 sqft, 5 bedrooms, 5 baths, rooftop terrace, private elevator. Fully smart home. Building amenities: gym, pool, concierge. First owner.',
     95000000, 'published', TRUE, NOW(), NOW() + INTERVAL '30 days', 98),

  -- ── VEHICLES (7 ads) ───────────────────────────────────────
    (client_id, pkg_premium, cat_veh, city_lhr,
     'Honda Civic 2022 Oriel — Immaculate Condition',
     'honda-civic-2022-oriel-lahore-s1t2u3',
     'Honda Civic 2022 Oriel 1.8 i-VTEC. Original factory condition, not a single scratch. 28,000 KM only. Full service history from authorized dealer. Features: sunroof, reverse camera, push start, paddle shifters. No flood/accident. Genuine reason for sale.',
     6250000, 'published', TRUE, NOW() - INTERVAL '6 hours', NOW() + INTERVAL '30 days', 92),

    (client_id, pkg_standard, cat_veh, city_khi,
     'Toyota Corolla Altis 2020 — 1st Owner Karachi',
     'toyota-corolla-altis-2020-karachi-v4w5x6',
     'Toyota Corolla Altis Grande X CVT-i 2020. Original condition, 45,000 KM. Cruise control, automatic, leather seats. Full genuine car, no repaint. Inspection welcome from any workshop.',
     4800000, 'published', FALSE, NOW() - INTERVAL '2 days', NOW() + INTERVAL '13 days', 65),

    (client_id, pkg_basic, cat_veh, city_isb,
     'Suzuki Alto VXR 2023 — Like New',
     'suzuki-alto-vxr-2023-islamabad-y7z8a9',
     'Suzuki Alto VXR 2023 model, 8000 KM only. Company maintained. AC, power windows, central locking. Mileage 22 km/l. Perfect for city use. Available in Islamabad only. No serious defects.',
     2350000, 'published', FALSE, NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 35),

    (client_id, pkg_standard, cat_veh, city_fsd,
     'Honda CD 125 2022 Faisalabad — Daily Runner',
     'honda-cd-125-2022-faisalabad-b1c2d3',
     'Honda CD 125 2022 in excellent condition. 18,000 KM driven. All original parts, no repaint. Engine runs perfectly, fuel average 60 km/l. Registration done Faisalabad. Ideal for daily commute.',
     185000, 'published', FALSE, NOW() - INTERVAL '3 days', NOW() + INTERVAL '12 days', 50),

    (client_id, pkg_premium, cat_veh, city_lhr,
     'BMW 3 Series 2021 Import — Full Options',
     'bmw-3-series-2021-import-lahore-e4f5g6',
     'BMW 318i 2021 imported. Full options including panoramic sunroof, Harman Kardon sound, live cockpit, heated seats. 35,000 KM. First owner. All duties paid. Brand new Bridgestone tyres. Inspection from any authorized place.',
     12500000, 'published', TRUE, NOW() - INTERVAL '12 hours', NOW() + INTERVAL '30 days', 88),

    (client_id, pkg_standard, cat_veh, city_khi,
     'Yamaha YBR 125G 2021 — Off Road Ready',
     'yamaha-ybr-125g-2021-karachi-h7i8j9',
     'Yamaha YBR 125G dual sport 2021. Engine in top condition, knobby tyres. Great for off road and touring. Minor scratches on crash guard but mechanically perfect. Fuel average 45 km/l.',
     260000, 'published', FALSE, NOW() - INTERVAL '4 days', NOW() + INTERVAL '11 days', 48),

    (client_id, pkg_basic, cat_veh, city_rwp,
     'Changan Alsvin 2022 Comfort — Family Car',
     'changan-alsvin-2022-rwp-k1l2m3',
     'Changan Alsvin 2022 Comfort variant. 32,000 KM. 5 year warranty still valid. Automatic, AC cold, all original. 7 airbags, ABS, traction control. Good fuel economy. Rawalpindi registration.',
     3100000, 'published', FALSE, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 28),

  -- ── ELECTRONICS (6 ads) ────────────────────────────────────
    (client_id, pkg_premium, cat_elec, city_khi,
     'iPhone 15 Pro Max 256GB Natural Titanium — Sealed',
     'iphone-15-pro-max-256gb-sealed-karachi-n4o5p6',
     'Brand new sealed iPhone 15 Pro Max 256GB Natural Titanium. PTA approved, with original box and all accessories. 1 year Apple warranty. Genuine reason for sale: gifted by relative but already have one.',
     580000, 'published', TRUE, NOW() - INTERVAL '18 hours', NOW() + INTERVAL '30 days', 94),

    (client_id, pkg_standard, cat_elec, city_lhr,
     'Samsung Galaxy S24 Ultra 512GB — 10/10 Condition',
     'samsung-s24-ultra-512gb-lahore-q7r8s9',
     'Samsung Galaxy S24 Ultra 512GB Titanium Black. 3 months old, always in case and tempered glass. No scratches. All accessories, original box. S Pen included. Snapdragon 8 Gen 3, 12GB RAM.',
     420000, 'published', FALSE, NOW() - INTERVAL '2 days', NOW() + INTERVAL '13 days', 60),

    (client_id, pkg_premium, cat_elec, city_isb,
     'MacBook Pro M3 Pro 16" — Professional Grade',
     'macbook-pro-m3-pro-16-islamabad-t1u2v3',
     'Apple MacBook Pro 16-inch M3 Pro chip, 36GB unified memory, 512GB SSD. Space Black color. 2 months old, perfect condition. Used for video editing. Comes with original charger and box. Magsafe, 3x Thunderbolt 4.',
     720000, 'published', TRUE, NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 87),

    (client_id, pkg_basic, cat_elec, city_khi,
     'Dell Latitude 5540 i7 13th Gen — Office Laptop',
     'dell-latitude-5540-i7-karachi-w4x5y6',
     'Dell Latitude 5540 business laptop. Intel Core i7-1365U, 16GB RAM, 512GB NVMe SSD, 15.6" FHD IPS display. Under Dell warranty till Dec 2025. No dead pixels. Battery health 91%.',
     185000, 'published', FALSE, NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 32),

    (client_id, pkg_standard, cat_elec, city_lhr,
     'PlayStation 5 Disc Edition — With 3 Games',
     'ps5-disc-edition-3-games-lahore-z7a8b9',
     'PlayStation 5 disc edition in original box. Includes DualSense controller, FIFA 24, Spider-Man 2, God of War Ragnarok. 10 months old, works perfectly. All original accessories. Selling due to no time.',
     185000, 'published', FALSE, NOW() - INTERVAL '5 days', NOW() + INTERVAL '10 days', 52),

    (client_id, pkg_standard, cat_elec, city_fsd,
     'Hisense 55" 4K QLED Smart TV — As New',
     'hisense-55-4k-qled-faisalabad-c1d2e3',
     'Hisense 55U6K QLED 4K UHD Smart TV. 4 months old, no scratches on screen. VIDAA OS with Netflix, YouTube, Amazon Prime built-in. Dolby Vision + Atmos, 120Hz. Complete box and remote.',
     120000, 'published', FALSE, NOW() - INTERVAL '2 days', NOW() + INTERVAL '13 days', 44),

  -- ── JOBS (4 ads) ───────────────────────────────────────────
    (client_id, pkg_basic, cat_jobs, city_khi,
     'Senior React Developer Required — Remote/Karachi',
     'senior-react-developer-karachi-f4g5h6',
     'Established software house in Karachi hiring Senior React Developer. 3+ years experience required. Tech stack: React, TypeScript, Next.js, Node.js, PostgreSQL. Salary: PKR 150,000–250,000. Work from home available.',
     250000, 'published', FALSE, NOW() - INTERVAL '4 days', NOW() + INTERVAL '3 days', 20),

    (client_id, pkg_standard, cat_jobs, city_lhr,
     'Digital Marketing Manager — E-Commerce Brand',
     'digital-marketing-manager-lahore-i7j8k9',
     'Fast growing e-commerce brand in Lahore looking for Digital Marketing Manager. 2+ years experience in Meta Ads, Google Ads, SEO. Manage campaigns for our clothing & beauty brand. Salary: PKR 80,000–120,000 + bonuses.',
     120000, 'published', FALSE, NOW() - INTERVAL '3 days', NOW() + INTERVAL '12 days', 40),

    (client_id, pkg_basic, cat_jobs, city_isb,
     'Accountant (ACCA/CA Finalist) — Islamabad Firm',
     'accountant-acca-islamabad-l1m2n3',
     'Reputable audit firm in Islamabad seeking ACCA Finalist or CA finalist for accounts and audit work. QuickBooks and ERP experience preferred. Fresher to 2 years experience. Salary: PKR 60,000–90,000.',
     90000, 'published', FALSE, NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days', 18),

    (client_id, pkg_standard, cat_jobs, city_khi,
     'Sales Executive — FMCG Company Karachi',
     'sales-executive-fmcg-karachi-o4p5q6',
     'Leading FMCG company hiring Sales Executives in Karachi. Must have motorcycle and 1 year field sales experience. Attractive salary PKR 45,000 + fuel + commission. Weekly and monthly incentives. Immediate joining.',
     45000, 'published', FALSE, NOW() - INTERVAL '2 days', NOW() + INTERVAL '13 days', 38),

  -- ── SERVICES (5 ads) ───────────────────────────────────────
    (client_id, pkg_premium, cat_svc, city_khi,
     'AC Repair & Gas Filling — Home Service Karachi',
     'ac-repair-gas-filling-karachi-r7s8t9',
     'Professional AC service with 5+ years experience. Services: gas charging (R410/R22), cleaning, thermostat repair, compressor overhaul. Inverter AC specialists. Same day service. Parts at market rate. Call for free inspection. All brands.',
     3500, 'published', TRUE, NOW() - INTERVAL '12 hours', NOW() + INTERVAL '30 days', 80),

    (client_id, pkg_standard, cat_svc, city_lhr,
     'Professional Home Cleaning Service Lahore',
     'home-cleaning-service-lahore-u1v2w3',
     'Deep cleaning service for homes, apartments and offices in Lahore. Eco-friendly products. Fully trained staff, background verified. Services: kitchen degreasing, bathroom sanitization, sofa/carpet cleaning. Packages starting PKR 5,000.',
     5000, 'published', FALSE, NOW() - INTERVAL '3 days', NOW() + INTERVAL '12 days', 55),

    (client_id, pkg_premium, cat_svc, city_isb,
     'Website & Mobile App Development — Islamabad',
     'web-mobile-development-islamabad-x4y5z6',
     'Full-stack development studio offering websites, e-commerce stores, mobile apps (Android+iOS). Technologies: React, Next.js, Flutter, Node.js. Portfolio of 50+ projects. Fixed price contracts. Free consultation. Starting from PKR 50,000.',
     50000, 'published', TRUE, NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 85),

    (client_id, pkg_basic, cat_svc, city_fsd,
     'Plumbing & Electrician Services Faisalabad',
     'plumbing-electrical-faisalabad-a7b8c9',
     'Experienced plumber and electrician offering home maintenance services in Faisalabad. Leakage repair, pipe fitting, geyser installation, fan/AC wiring, DB boards. Available 7 days a week including Sundays. Reasonable charges.',
     2000, 'published', FALSE, NOW() - INTERVAL '6 days', NOW() + INTERVAL '1 day', 22),

    (client_id, pkg_standard, cat_svc, city_khi,
     'Wedding Photography & Videography Karachi',
     'wedding-photography-karachi-d1e2f3',
     'Professional wedding photography and cinematography studio in Karachi. We cover Nikkah, Barat, Valima. Packages include drone shots, same-day edit reel, photobook. Experienced team of 4. Book 3 months in advance. Portfolio available.',
     150000, 'published', FALSE, NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days', 60);

  RAISE NOTICE 'Successfully inserted % demo ads!', 28;
END $$;

-- Add thumbnail media for all demo ads
INSERT INTO ad_media (ad_id, source_type, original_url, normalized_thumbnail_url, validation_status, display_order)
SELECT
  a.id,
  'youtube',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  'valid',
  0
FROM ads a
WHERE a.status = 'published'
  AND NOT EXISTS (SELECT 1 FROM ad_media m WHERE m.ad_id = a.id);

-- Verify
SELECT status, COUNT(*) FROM ads GROUP BY status ORDER BY status;
SELECT 'Total published:', COUNT(*) FROM ads WHERE status = 'published' AND expire_at > NOW();
