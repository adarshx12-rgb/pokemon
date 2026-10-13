import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#050507', color: '#ede6d6', padding: '62px 72px', fontFamily: 'sans-serif', borderTop: '12px solid #ff2b2b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: '#b1afff' }}>
        <span>The collector’s index</span><span>pokefame.com</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: '-6px', color: '#ff2b2b' }}>POKEFAME</div>
        <div style={{ fontSize: 44, marginTop: 24 }}>Pokémon cards. Rare finds. Better battles.</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid #514d65', fontSize: 23 }}>
        <span>Explore the card vault</span><span>Build your Pokémon showdown</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
