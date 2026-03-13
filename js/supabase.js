/* ============================
   PENSIUNEA ALEXANDRA — Supabase Client
   Database connection + helper functions
   ============================ */

const SUPABASE_URL = 'https://bilwjsrddmlhmzjjghaw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbHdqc3JkZG1saG16ampnaGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTEwNjksImV4cCI6MjA4ODI4NzA2OX0.hh-VgBy6viIb86ZEB2kHg6Nl_ePureWjsqpTlZlQTJ4';

// Initialize client (requires supabase-js CDN loaded before this script)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cache for rooms data (avoid repeated fetches on same page)
let _roomsCache = null;
const FALLBACK_MIN_PRICE = 230;

const db = {

    // ====== ROOMS ======

    async getRooms() {
        if (_roomsCache) return _roomsCache;
        const { data, error } = await supabaseClient
            .from('rooms')
            .select('*')
            .order('sort_order');
        if (error) { console.error('getRooms error:', error); return []; }
        _roomsCache = data;
        return data;
    },

    async getRoomWithPhotos(roomId) {
        let room = _roomsCache ? _roomsCache.find(r => r.id === roomId) : null;
        if (!room) {
            const { data, error: roomErr } = await supabaseClient
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .single();
            if (roomErr) { console.error('getRoomWithPhotos error:', roomErr); return null; }
            room = data;
        }

        const { data: photos, error: photoErr } = await supabaseClient
            .from('room_photos')
            .select('*')
            .eq('room_id', roomId)
            .order('sort_order');
        if (photoErr) { console.error('getRoomPhotos error:', photoErr); return null; }

        return { ...room, photos: photos || [] };
    },

    // ====== GALLERY ======

    async getGallery(category) {
        let query = supabaseClient.from('gallery').select('*').order('sort_order');
        if (category && category !== 'all') query = query.eq('category', category);
        const { data, error } = await query;
        if (error) { console.error('getGallery error:', error); return []; }
        return data;
    },

    // ====== AVAILABILITY ======

    async getAvailability(roomId, year, month) {
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const endMonth = month + 2 > 12 ? 1 : month + 2;
        const endYear = month + 2 > 12 ? year + 1 : year;
        const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

        const { data, error } = await supabaseClient
            .from('availability')
            .select('date, status')
            .eq('room_id', roomId)
            .gte('date', startDate)
            .lt('date', endDate);

        if (error) { console.error('getAvailability error:', error); return {}; }

        const result = {};
        (data || []).forEach(row => { result[row.date] = row.status; });
        return result;
    },

    async toggleAvailability(roomId, dateStr) {
        // Check if exists
        const { data: existing } = await supabaseClient
            .from('availability')
            .select('id')
            .eq('room_id', roomId)
            .eq('date', dateStr)
            .maybeSingle();

        if (existing) {
            // Delete (mark as available)
            const { error } = await supabaseClient
                .from('availability')
                .delete()
                .eq('room_id', roomId)
                .eq('date', dateStr);
            if (error) console.error('toggleAvailability delete error:', error);
            return false; // now available
        } else {
            // Insert (mark as occupied)
            const { error } = await supabaseClient
                .from('availability')
                .insert({ room_id: roomId, date: dateStr, status: 'occupied' });
            if (error) console.error('toggleAvailability insert error:', error);
            return true; // now occupied
        }
    },

    // ====== AUTH ======

    async login(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return { user: data.user };
    },

    async logout() {
        await supabaseClient.auth.signOut();
    },

    async getSession() {
        const { data } = await supabaseClient.auth.getSession();
        return data?.session || null;
    },

    // ====== ADMIN: Room price update ======

    async updateRoomPrice(roomId, price) {
        const { error } = await supabaseClient
            .from('rooms')
            .update({ price })
            .eq('id', roomId);
        if (error) { console.error('updateRoomPrice error:', error); return false; }
        _roomsCache = null; // invalidate cache
        return true;
    },

    // ====== ADMIN: Storage & Photos ======

    async uploadImage(file, path) {
        const { data, error } = await supabaseClient.storage
            .from('images')
            .upload(path, file, { cacheControl: '3600', upsert: false });
        if (error) { console.error('uploadImage error:', error); return { error }; }

        const { data: publicData } = supabaseClient.storage
            .from('images')
            .getPublicUrl(path);

        console.log('Upload public URL:', publicData.publicUrl);
        return { url: publicData.publicUrl };
    },

    async deleteImage(path) {
        // extract path from url if full url is provided
        let storagePath = path;
        if (path.includes('/images/')) {
            storagePath = path.split('/images/')[1];
        }

        const { error } = await supabaseClient.storage
            .from('images')
            .remove([storagePath]);

        if (error) { console.error('deleteImage error:', error); return { error }; }
        return { success: true };
    },

    // Room Photos
    async addRoomPhoto(roomId, src, alt, sortOrder = 99) {
        const { data, error } = await supabaseClient
            .from('room_photos')
            .insert({ room_id: roomId, src, alt, sort_order: sortOrder })
            .select('*')
            .single();
        if (error) { console.error('addRoomPhoto error:', error); return { error }; }
        _roomsCache = null;
        return { data };
    },

    async deleteRoomPhoto(photoId, imageUrl) {
        // Delete from DB
        const { error: dbError } = await supabaseClient
            .from('room_photos')
            .delete()
            .eq('id', photoId);
        if (dbError) { console.error('deleteRoomPhoto DB error:', dbError); return { error: dbError }; }

        // Delete from storage if it's a Supabase storage image
        if (imageUrl && imageUrl.includes('supabase.co/storage')) {
            await this.deleteImage(imageUrl);
        }

        _roomsCache = null;
        return { success: true };
    },

    // Gallery Photos
    async addGalleryPhoto(src, category, alt = '', sortOrder = 99) {
        const { data, error } = await supabaseClient
            .from('gallery')
            .insert({ src, category, alt, sort_order: sortOrder })
            .select('*')
            .single();
        if (error) { console.error('addGalleryPhoto error:', error); return { error }; }
        return { data };
    },

    async deleteGalleryPhoto(photoId, imageUrl) {
        // Delete from DB
        const { error: dbError } = await supabaseClient
            .from('gallery')
            .delete()
            .eq('id', photoId);
        if (dbError) { console.error('deleteGalleryPhoto DB error:', dbError); return { error: dbError }; }

        // Delete from storage if it's a Supabase storage image
        if (imageUrl && imageUrl.includes('supabase.co/storage')) {
            await this.deleteImage(imageUrl);
        }

        return { success: true };
    },

    // ====== OFFERS ======

    async getOffers() {
        const { data, error } = await supabaseClient
            .from('offers')
            .select('*')
            .eq('active', true)
            .order('sort_order');
        if (error) { console.error('getOffers error:', error); return []; }
        return data;
    },

    async getAllOffers() {
        const { data, error } = await supabaseClient
            .from('offers')
            .select('*')
            .order('sort_order');
        if (error) { console.error('getAllOffers error:', error); return []; }
        return data;
    },

    async createOffer(offerData) {
        const { data, error } = await supabaseClient
            .from('offers')
            .insert(offerData)
            .select('*')
            .single();
        if (error) { console.error('createOffer error:', error); return { error }; }
        return { data };
    },

    async updateOffer(id, offerData) {
        const { data, error } = await supabaseClient
            .from('offers')
            .update(offerData)
            .eq('id', id)
            .select('*')
            .single();
        if (error) { console.error('updateOffer error:', error); return { error }; }
        return { data };
    },

    async deleteOffer(id) {
        const { error } = await supabaseClient
            .from('offers')
            .delete()
            .eq('id', id);
        if (error) { console.error('deleteOffer error:', error); return { error }; }
        return { success: true };
    },

    // ====== SITE CONTENT ======

    async getSiteContent() {
        const { data, error } = await supabaseClient
            .from('site_content')
            .select('*');
        if (error) { console.error('getSiteContent error:', error); return {}; }
        const result = {};
        (data || []).forEach(row => { result[row.id] = row.value; });
        return result;
    },

    async upsertSiteContent(id, value) {
        const { error } = await supabaseClient
            .from('site_content')
            .upsert({ id, value, updated_at: new Date().toISOString() });
        if (error) { console.error('upsertSiteContent error:', error); return false; }
        return true;
    },

    // ====== MIN PRICE ======

    async getMinPrice() {
        const rooms = await this.getRooms();
        if (!rooms || rooms.length === 0) return FALLBACK_MIN_PRICE;
        return Math.min(...rooms.map(r => r.price));
    }
};

// Expose globally
window.db = db;
window.supabaseClient = supabaseClient;
