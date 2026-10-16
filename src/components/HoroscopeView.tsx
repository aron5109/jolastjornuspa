import { useState } from 'react';
import type { DailyHoroscope, ZodiacSign } from '../types';
import { formatDateIs } from '../utils/dates';
import { downloadBlob, renderForecastCard } from '../utils/forecastCard';
import { formatForecastForCopy } from '../utils/horoscope';
import { CopyForecastButton } from './CopyForecastButton';
import { HoroscopeSection } from './HoroscopeSection';
import { BackIcon, ChristmasIcon, ImageIcon, LuckIcon, StarMark, WorkIcon } from './icons';
import { ZodiacGlyph } from './ZodiacGlyph';

type Props = {
  sign: ZodiacSign;
  horoscope: DailyHoroscope;
  reducedMotion: boolean;
  onChooseAnother: () => void;
};

export function HoroscopeView({ sign, horoscope, reducedMotion, onChooseAnother }: Props) {
  const [saving, setSaving] = useState(false);
  const canExportImage = typeof HTMLCanvasElement !== 'undefined' && 'toBlob' in HTMLCanvasElement.prototype;

  const saveCard = async () => {
    setSaving(true);
    try {
      const blob = await renderForecastCard(sign, horoscope);
      if (blob) downloadBlob(blob, `jolastjornuspa-${sign.id}-${horoscope.date}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article
      key={`${horoscope.date}-${sign.id}`}
      className={`forecast${reducedMotion ? '' : ' is-animated'}`}
      aria-labelledby="forecast-title"
    >
      <header className="forecast-header">
        <p className="eyebrow">
          <span>Jólastjörnuspá</span>
          <span aria-hidden="true"> · </span>
          <span>{formatDateIs(horoscope.date)}</span>
        </p>
        <div className="forecast-title-row">
          <ZodiacGlyph sign={sign.id} className="forecast-glyph" />
          <div>
            <h2 id="forecast-title" className="forecast-title" tabIndex={-1}>
              {sign.name}
            </h2>
            <p className="forecast-range">{sign.dateRange}</p>
          </div>
        </div>
        <p className="forecast-headline">„{horoscope.headline}“</p>
      </header>

      <div className="forecast-sections">
        <HoroscopeSection title="Vinnan" tone="work" icon={<WorkIcon />}>
          {horoscope.work}
        </HoroscopeSection>
        <HoroscopeSection title="Jólin" tone="christmas" icon={<ChristmasIcon />}>
          {horoscope.christmas}
        </HoroscopeSection>
        <HoroscopeSection title="Heppnin" tone="luck" icon={<LuckIcon />}>
          {horoscope.luck}
        </HoroscopeSection>
      </div>

      <aside className="star-message" aria-labelledby="star-message-title">
        <StarMark className="star-message-icon" />
        <div>
          <h3 id="star-message-title" className="star-message-title">
            Stjörnuboð dagsins
          </h3>
          <p className="star-message-text">{horoscope.message}</p>
        </div>
      </aside>

      <div className="forecast-actions">
        <CopyForecastButton getText={() => formatForecastForCopy(sign, horoscope)} />
        {canExportImage ? (
          <button type="button" className="action-button" onClick={saveCard} disabled={saving} aria-busy={saving}>
            <ImageIcon className="action-icon" />
            {saving ? 'Bý til spáspjald…' : 'Vista spáspjald'}
          </button>
        ) : null}
        <button type="button" className="action-button is-quiet" onClick={onChooseAnother}>
          <BackIcon className="action-icon" />
          Velja annað merki
        </button>
      </div>

      <p className="forecast-disclaimer">
        <strong>Til gamans gert.</strong> Jólastjörnuspáin er skáldskapur og afþreying, ekki ráðgjöf.
      </p>
    </article>
  );
}
