# Code Review - Pensiunea Alexandra (JavaScript)

În urma analizei codului (`js/supabase.js`, `js/booking.js`, `js/main.js`), au fost identificate următoarele aspecte ce trebuie îmbunătățite pentru a spori securitatea, performanța și calitatea generală a experienței utilizatorilor.

## 🔴 BLOCKING (Probleme Critice / Deficiențe de Securitate)

### 1. Vulnerabilitate XSS (Cross-Site Scripting) 
**Locație:** `js/main.js` -> `initDynamicContent()`
**Problemă:** 
```javascript
el.innerHTML = siteContent[key];
```
Folosirea `innerHTML` direct cu date venite din baza de date prezintă un risc major de securitate (dacă un admin introduce - sau dacă contul unui admin este compromis - un script malițios, acesta va fi rulat de către browserele vizitatorilor).
**Soluție:** Folosește o funcție de sanitizare (ex: DOMPurify) atunci când introduci cod HTML, sau schimbă `innerHTML` în `textContent` dacă te aștepți strict la conținut text:
```javascript
el.textContent = siteContent[key];
```

## 🟡 SUGGESTIONS (Sfaturi Importante / Calitatea Codului)

### 2. Gestionarea erorilor și "Magic Numbers"
**Locație:** `js/booking.js` & `js/supabase.js`
**Problemă:** Ai definit prețuri de fallback scrise direct în codul sursă.
```javascript
let roomPrices = { 'dubla-clasic': 250, /* ... */ };
if (!rooms || rooms.length === 0) return 230;
```
**Soluție:** Mută toate aceste constante și prețuri de rezervă într-o constantă globală clar definită la începutul fișierului de configurare pentru a putea fi modificate dintr-un singur loc. Ex: `const FALLBACK_PRICES = { ... }`.

### 3. Corectarea Mesajelor către Utilizator (Typo-uri)
**Locație:** `js/booking.js`
**Problemă:** Ai erori gramaticale în textele care apar direct în browser pentru utilizatori și posibile greșeli in loguri (Netowrk vs Network).
```javascript
alert('Eroare la trimiterea emailului. Te rugăm să încerci pe WhatsApp s-au să ne suni direct.');
```
**Soluție:** Corectează „s-au” cu „sau”: `...pe WhatsApp sau să ne...`

### 4. Securitatea Cheilor Supabase (RLS)
**Locație:** `js/supabase.js`
**Problemă:** `SUPABASE_ANON_KEY` trăiește direct în fișierul JS.
**Soluție:** Cheia *Anon* are voie să fie publică atâta timp cât tabelele din baza de date au politici restrictive de RLS (Row Level Security). Dacă cineva îți copiază cheia din JS, să nu poată șterge sau altera baza de date, ci doar citi datele conform regulilor stabilite.

## 🟢 NITS (Mici îmbunătățiri și Optimizări)

### 5. Optimizare Cache (Număr de Interogări)
**Locație:** `js/supabase.js`
**Problemă:** Cache-ul `_roomsCache` salvează rețeaua când apelezi `getRooms()`, dar nu profită de acest cache atunci când apelezi `getRoomWithPhotos(roomId)`.
**Soluție:** Poți verifica dacă camera există deja în `_roomsCache` înainte să interoghezi baza de date:
```javascript
const room = _roomsCache ? _roomsCache.find(r => r.id === roomId) : null;
// Doar dacă !room, fa un request HTTP nou.
```

### 6. Preluarea Datelor de Contact în Cod (Email)
**Locație:** `js/booking.js`
**Problemă:** Adresa ta de Gmail asociată contului FormSubmit trăiește la vedere în codul JavaScript (`vladionolteanu@gmail.com`), ceea ce o poate expune la boți de spam.
**Soluție:** Ideal este ca formularul să acționeze printr-un intermediar, folosind eventual Supabase Edge Functions sau ascunzând adresa sub un token (dacă oferă FormSubmit o procedură de hash/alias).

---
## ❓ QUESTIONS (Aspecte de Testat)
- Ai verificat cum se comportă frontend-ul atunci când apelurile HTTP durează prea mult sau eșuează din cauza lipsei internetului? Ar trebui, în mod ideal, să previi eventuale "click-uri duble" pe butoanele de rezervare și să prezinți o formă de Loader.
