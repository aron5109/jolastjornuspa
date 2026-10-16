import type { ReactNode } from 'react';

type Props = {
  title: string;
  icon: ReactNode;
  tone: 'work' | 'christmas' | 'luck';
  children: string;
};

export function HoroscopeSection({ title, icon, tone, children }: Props) {
  return (
    <section className={`forecast-section tone-${tone}`}>
      <h3 className="forecast-section-title">
        <span className="forecast-section-icon">{icon}</span>
        {title}
      </h3>
      <p className="forecast-section-text">{children}</p>
    </section>
  );
}
