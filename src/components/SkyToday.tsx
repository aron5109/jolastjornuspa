import { formatDateIs } from '../utils/dates';
import { formatAge, formatDistance, formatIllumination, getMoonDay, MOON_DATA, PHASE_LABELS } from '../utils/moon';
import { MoonPhase } from './MoonPhase';

type Props = {
  date: string;
};

/**
 * Real astronomy, kept apart from the horoscope in both layout and wording. Values come only
 * from the committed NASA extract; when it is missing the panel says so and shows no numbers.
 */
export function SkyToday({ date }: Props) {
  const moon = getMoonDay(date);
  const phaseLabel = moon ? PHASE_LABELS[moon.phase] : null;

  return (
    <section className="sky-today" aria-labelledby="sky-title">
      <div className="sky-heading">
        <h2 id="sky-title">Himininn í dag</h2>
        <p className="sky-kicker">Raunveruleg stjörnufræði, óháð stjörnuspánni</p>
      </div>

      <div className="sky-body">
        <MoonPhase
          illumination={moon?.illumination ?? null}
          waxing={moon?.waxing ?? true}
          label={
            moon ? `Tunglið ${formatDateIs(date)}: ${phaseLabel}, ${formatIllumination(moon.illumination)}` : undefined
          }
        />
        <div className="sky-facts">
          <h3 className="sky-facts-title">Tunglið</h3>
          {moon ? (
            <dl className="sky-list">
              <div>
                <dt>Tunglstaða</dt>
                <dd>{phaseLabel}</dd>
              </div>
              <div>
                <dt>Upplýst</dt>
                <dd>{formatIllumination(moon.illumination)}</dd>
              </div>
              <div>
                <dt>Aldur</dt>
                <dd>{formatAge(moon.ageDays)} frá nýju tungli</dd>
              </div>
              <div>
                <dt>Fjarlægð frá jörðu</dt>
                <dd>{formatDistance(moon.distanceKm)}</dd>
              </div>
            </dl>
          ) : (
            <p className="sky-missing">
              Tunglgögn frá NASA hafa ekki enn verið sótt fyrir {formatDateIs(date)}. Hér birtast engar tölur fyrr en
              raunveruleg gögn eru komin inn.
            </p>
          )}
          <p className="sky-time">{moon ? `Staða kl. 12:00 að íslenskum tíma, ${formatDateIs(date)}.` : null}</p>
        </div>
      </div>

      <p className="sky-source">
        Stjörnufræðileg gögn frá NASA:{' '}
        <a href={MOON_DATA.source.landingPage} target="_blank" rel="noopener noreferrer">
          Scientific Visualization Studio, Moon Phase and Libration 2026
          <span className="visually-hidden"> (opnast í nýjum flipa)</span>
        </a>
        . Gögn: NASA.
      </p>
    </section>
  );
}
