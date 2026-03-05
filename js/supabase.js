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
        const { data: room, error: roomErr } = await supabaseClient
            .from('rooms')
            .select('*')
            .eq('id', roomId)
            .single();
        if (roomErr) { console.error('getRoomWithPhotos error:', roomErr); return null; }

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
    }
};

// Expose globally
window.db = db;
window.supabaseClient = supabaseClient;
