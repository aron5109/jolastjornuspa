type Props = {
  title: string;
  tone: 'work' | 'christmas' | 'luck';
  children: string;
};

export function HoroscopeSection({ title, tone, children }: Props) {
  return (
    <section className={`forecast-section tone-${tone}`}>
      <h3 className="forecast-section-title">{title}</h3>
      <p className="forecast-section-text">{children}</p>
    </section>
  );
}
