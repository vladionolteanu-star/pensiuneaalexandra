import os
import glob
import re

root_dir = r"c:\Users\volteanu\Downloads\Pensiunea Alexandra"

def modify_file(filepath, is_en):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add Navigation Link (Oferte)
    if not is_en:
        if 'href="oferte.html"' not in content:
            content = re.sub(
                r'(<a href="galerie\.html"[^>]*>Galerie</a>)',
                r'\1\n                <a href="oferte.html" class="header__link">Oferte</a>',
                content
            )
    else:
        if 'href="offers.html"' not in content:
            content = re.sub(
                r'(<a href="gallery\.html"[^>]*>Gallery</a>)',
                r'\1\n                <a href="offers.html" class="header__link">Offers</a>',
                content
            )

    # 2. Dynamic price spans for CTAs
    content = content.replace('de la 230 RON', 'de la <span class="dynamic-min-price">230</span> RON')
    content = content.replace('from 230 RON', 'from <span class="dynamic-min-price">230</span> RON')

    # Also wrap the specific CTA titles and subtitles to handle dynamic content overriding
    if not is_en:
        content = content.replace('<h2>Rezervă-ți vacanța la munte</h2>', '<h2 data-site-content="cta_title_ro">Rezervă-ți vacanța la munte</h2>')
        content = re.sub(r'(<h2[^>]*color: var\(--snow\)[^>]*>)Rezervă-ți vacanța la munte</h2>', r'\1<span data-site-content="cta_title_ro">Rezervă-ți vacanța la munte</span></h2>', content)
        
        # for subtitles:
        content = re.sub(r'Prețuri de la <span class="dynamic-min-price">230</span> RON / noapte\. Check-in de la ora 14:00\. Confirm(?:are|ări) rapid[aăe] pe WhatsApp\.',
                         r'<span data-site-content="cta_subtitle_ro">Prețuri de la <span class="dynamic-min-price">230</span> RON / noapte. Check-in de la ora 14:00. Confirmare rapidă pe WhatsApp.</span>', content)
    else:
        content = content.replace('<h2>Book your mountain getaway</h2>', '<h2 data-site-content="cta_title_en">Book your mountain getaway</h2>')
        content = re.sub(r'(<h2[^>]*color: var\(--snow\)[^>]*>)Book your mountain getaway</h2>', r'\1<span data-site-content="cta_title_en">Book your mountain getaway</span></h2>', content)
        
        content = re.sub(r'Starting from <span class="dynamic-min-price">230</span> RON / night\. Check-in from 14:00\. Quick confirmation via WhatsApp\.',
                         r'<span data-site-content="cta_subtitle_en">Starting from <span class="dynamic-min-price">230</span> RON / night. Check-in from 14:00. Quick confirmation via WhatsApp.</span>', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Root files
for filepath in glob.glob(os.path.join(root_dir, '*.html')):
    if 'admin' in filepath: continue
    modify_file(filepath, is_en=False)

# EN files
for filepath in glob.glob(os.path.join(root_dir, 'en', '*.html')):
    modify_file(filepath, is_en=True)
    
print("Updated HTML files!")
