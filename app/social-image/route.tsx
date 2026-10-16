import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

// PNG copies of the home page's grail faces, written by `npm run build:grail` (Satori cannot decode WebP).
const face = async (side: 'front' | 'back') =>
  `data:image/png;base64,${(await readFile(join(process.cwd(), 'app', 'social-image', `rayquaza-${side}-400.png`))).toString('base64')}`;

const CARD = { width: 330, height: 452 };

export async function GET() {
  const [front, back] = await Promise.all([face('front'), face('back')]);
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', background: '#050507', backgroundImage: 'radial-gradient(circle at 78% 50%, rgba(212,175,55,0.30) 0%, rgba(255,43,43,0.10) 32%, rgba(5,5,7,0) 62%)', color: '#ede6d6', fontFamily: 'sans-serif', borderTop: '12px solid #ff2b2b', padding: '0 0 0 72px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 620 }}>
        <div style={{ fontSize: 26, letterSpacing: '4px', color: '#d4af37' }}>THE COLLECTOR’S INDEX</div>
        <div style={{ fontSize: 124, fontWeight: 700, letterSpacing: '-6px', color: '#ff2b2b', marginTop: 12, lineHeight: 1 }}>POKÉFAME</div>
        <div style={{ fontSize: 46, lineHeight: 1.2, marginTop: 28 }}>Rare Pokémon cards.</div>
        <div style={{ fontSize: 46, lineHeight: 1.2 }}>Better battles.</div>
        <div style={{ fontSize: 26, color: '#b1afff', marginTop: 40 }}>pokefame.com</div>
      </div>
      <div style={{ display: 'flex', position: 'relative', width: 508, height: '100%' }}>
        {/* eslint-disable @next/next/no-img-element -- Satori renders plain <img>; next/image does not apply */}
        <img alt="" src={back} width={CARD.width} height={CARD.height} style={{ position: 'absolute', left: 150, top: 72, transform: 'rotate(12deg)', opacity: 0.85 }} />
        <img alt="" src={front} width={CARD.width} height={CARD.height} style={{ position: 'absolute', left: 40, top: 80, transform: 'rotate(-7deg)' }} />
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
