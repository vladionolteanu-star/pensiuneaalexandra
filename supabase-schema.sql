-- ============================================
-- PENSIUNEA ALEXANDRA — Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. TABLES
-- ============================================

CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  price INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE room_photos (
  id SERIAL PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  src TEXT NOT NULL,
  alt TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE gallery (
  id SERIAL PRIMARY KEY,
  src TEXT NOT NULL,
  alt TEXT,
  category TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE availability (
  id SERIAL PRIMARY KEY,
  room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'occupied',
  UNIQUE(room_id, date)
);

-- 2. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Public read for all tables
CREATE POLICY "Public read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Public read room_photos" ON room_photos FOR SELECT USING (true);
CREATE POLICY "Public read gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "Public read availability" ON availability FOR SELECT USING (true);

-- Authenticated write for all tables
CREATE POLICY "Auth write rooms" ON rooms FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth write room_photos" ON room_photos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth write gallery" ON gallery FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth write availability" ON availability FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 3. SEED DATA — Rooms
-- ============================================

INSERT INTO rooms (id, name, name_en, price, sort_order) VALUES
  ('dubla-clasic', 'Camera Dublă Clasic', 'Classic Double Room', 250, 1),
  ('twin', 'Camera Twin', 'Twin Room', 230, 2),
  ('familie', 'Camera Familie', 'Family Room', 350, 3),
  ('apt-predeal', 'Apartament Predeal', 'Predeal Apartment', 480, 4),
  ('apt-panoramic', 'Apartament Panoramic', 'Panoramic Apartment', 600, 5);

-- 4. SEED DATA — Room Photos
-- ============================================

INSERT INTO room_photos (room_id, src, alt, sort_order) VALUES
  -- Dubla Clasic
  ('dubla-clasic', '/images/rooms/room-100.jpg', 'Camera Dublă Clasic - vedere generală', 1),
  ('dubla-clasic', '/images/rooms/room-101.jpg', 'Camera Dublă Clasic - pat', 2),
  ('dubla-clasic', '/images/rooms/room-102.jpg', 'Camera Dublă Clasic - baie', 3),
  ('dubla-clasic', '/images/rooms/room-103.jpg', 'Camera Dublă Clasic - detaliu', 4),
  ('dubla-clasic', '/images/rooms/room-104.jpg', 'Camera Dublă Clasic - balcon', 5),
  ('dubla-clasic', '/images/rooms/room-105.jpg', 'Camera Dublă Clasic - facilități', 6),
  ('dubla-clasic', '/images/rooms/room-106.jpg', 'Camera Dublă Clasic - ambient', 7),
  -- Twin
  ('twin', '/images/rooms/room-110.jpg', 'Camera Twin - vedere generală', 1),
  ('twin', '/images/rooms/room-115.jpg', 'Camera Twin - detaliu', 2),
  ('twin', '/images/rooms/room-120.jpg', 'Camera Twin - facilități', 3),
  -- Familie
  ('familie', '/images/rooms/room-130.jpg', 'Camera Familie - vedere generală', 1),
  ('familie', '/images/rooms/room-135.jpg', 'Camera Familie - detaliu', 2),
  ('familie', '/images/rooms/room-140.jpg', 'Camera Familie - facilități', 3),
  ('familie', '/images/rooms/room-145.jpg', 'Camera Familie - ambient', 4),
  -- Apt Predeal
  ('apt-predeal', '/images/rooms/room-150.jpg', 'Apartament Predeal - living', 1),
  ('apt-predeal', '/images/rooms/room-155.jpg', 'Apartament Predeal - dormitor', 2),
  ('apt-predeal', '/images/rooms/room-125.jpg', 'Apartament Predeal - bucătărie', 3),
  -- Apt Panoramic
  ('apt-panoramic', '/images/rooms/room-160.jpg', 'Apartament Panoramic - terasă', 1),
  ('apt-panoramic', '/images/rooms/room-250.jpg', 'Apartament Panoramic - vedere panoramică', 2),
  ('apt-panoramic', '/images/rooms/room-251.jpg', 'Apartament Panoramic - jacuzzi', 3),
  ('apt-panoramic', '/images/rooms/room-252.jpg', 'Apartament Panoramic - interior', 4);

-- 5. SEED DATA — Gallery
-- ============================================

INSERT INTO gallery (src, alt, category, sort_order) VALUES
  ('/images/hero/hero-2.jpg', 'Exterior pensiune', 'exterior', 1),
  ('/images/gallery/gallery-10.jpg', 'Lobby', 'exterior', 2),
  ('/images/gallery/gallery-20.jpg', 'Holul pensiunii', 'exterior', 3),
  ('/images/gallery/gallery-30.jpg', 'Zona de lounge', 'facilitati', 4),
  ('/images/gallery/gallery-40.jpg', 'Sala de mese', 'facilitati', 5),
  ('/images/gallery/gallery-50.jpg', 'Detaliu interior', 'exterior', 6),
  ('/images/gallery/gallery-55.jpg', 'Scări interioare', 'exterior', 7),
  ('/images/gallery/gallery-60.jpg', 'Cameră dublă', 'camere', 8),
  ('/images/gallery/gallery-65.jpg', 'Baie', 'camere', 9),
  ('/images/gallery/gallery-70.jpg', 'Zona comună', 'facilitati', 10),
  ('/images/gallery/gallery-75.jpg', 'Balcon', 'camere', 11),
  ('/images/gallery/gallery-80.jpg', 'Vedere de la pensiune', 'imprejurimi', 12),
  ('/images/gallery/gallery-85.jpg', 'Grădina', 'imprejurimi', 13),
  ('/images/gallery/gallery-90.jpg', 'Zona grătar', 'facilitati', 14),
  ('/images/gallery/gallery-95.jpg', 'Peisaj montan', 'imprejurimi', 15),
  ('/images/gallery/gallery-170.jpg', 'Cameră apartament', 'camere', 16),
  ('/images/gallery/gallery-180.jpg', 'Living apartament', 'camere', 17),
  ('/images/gallery/gallery-190.jpg', 'Terasă', 'facilitati', 18),
  ('/images/gallery/gallery-200.jpg', 'Loc de joacă', 'facilitati', 19),
  ('/images/gallery/gallery-280.jpg', 'Terasă cu grătar', 'facilitati', 20),
  ('/images/gallery/gallery-285.jpg', 'Foișor', 'facilitati', 21),
  ('/images/gallery/gallery-290.jpg', 'Peisaj iarnă', 'imprejurimi', 22),
  ('/images/gallery/gallery-293.jpg', 'Vedere munte', 'imprejurimi', 23);
