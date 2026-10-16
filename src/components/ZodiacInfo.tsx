import { useId, useState } from 'react';
import type { ZodiacSign } from '../types';
import { ZodiacConstellation } from './ZodiacConstellation';
import { ZodiacGlyph } from './ZodiacGlyph';

type Props = {
  sign: ZodiacSign;
  /** Desktop shows the full panel; phones show a summary that expands. */
  collapsible: boolean;
};

export function ZodiacInfo({ sign, collapsible }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const expanded = !collapsible || open;

  const rows: [string, string][] = [
    ['Lykilorð', sign.keyword],
    ['Pláneta', sign.planet],
    ['Höfuðskepna', sign.element],
    ['Litir', sign.colors.join(', ')],
    ['Málmur', sign.metal],
    ['Steinar', sign.stones.join(', ')],
    ['Hefðbundnar líkamstengingar', sign.bodyAssociations.join(', ')],
  ];

  return (
    <aside className={`zodiac-info${collapsible ? ' is-collapsible' : ''}`} aria-labelledby={`${panelId}-title`}>
      {collapsible ? (
        <div className="zodiac-info-summary">
          <p className="zodiac-info-line">
            <ZodiacGlyph sign={sign.id} className="zodiac-info-line-glyph" />
            {sign.element} · {sign.planet} · {sign.keyword}
          </p>
          <button
            type="button"
            className="disclosure-button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? `Fela upplýsingar um ${sign.nameAccusative}` : `Meira um ${sign.nameAccusative}`}
          </button>
        </div>
      ) : null}

      <div id={panelId} className="zodiac-info-panel" hidden={!expanded}>
        <h2 id={`${panelId}-title`} className="zodiac-info-title">
          Um {sign.nameAccusative}
        </h2>
        <div className="zodiac-info-art">
          <ZodiacGlyph sign={sign.id} className="zodiac-info-glyph" />
          <ZodiacConstellation
            sign={sign}
            active
            className="zodiac-info-constellation"
            label={`Stílfærð teikning af stjörnumerkinu ${sign.name}`}
          />
        </div>
        <h3 className="zodiac-info-subtitle">Hefðbundnar tengingar í stjörnuspeki</h3>
        <dl className="zodiac-info-list">
          {rows.map(([term, value]) => (
            <div key={term} className="zodiac-info-row">
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="zodiac-info-note">
          Hefðbundnar tengingar úr vestrænni stjörnuspeki, ekki vísindalegar staðreyndir. Líkamstengingarnar eru gömul
          táknfræði og fela ekki í sér neinar heilsufarsupplýsingar.
        </p>
      </div>
    </aside>
  );
}
