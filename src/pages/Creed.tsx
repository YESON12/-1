import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CREEDS } from '../data/creeds';
import { useSettings } from '../settings';
import { Tabs, TopBar } from '../components/ui';

export default function Creed() {
  const { kind } = useParams();
  const creed = CREEDS[kind === 'apostles' ? 'apostles' : 'lord'];
  const { settings } = useSettings();
  const [idx, setIdx] = useState('0');
  const text = creed.texts[Number(idx)];

  return (
    <>
      <TopBar title={creed.name} />
      <div className="page">
        <Tabs value={idx} onChange={setIdx} items={creed.texts.map((t, i) => [String(i), t.label])} />
        <article className={`creed font-${settings.fontFamily}`} style={{ fontSize: settings.fontSize }}>
          <h2>{text.title}</h2>
          {text.body.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </article>
      </div>
    </>
  );
}
