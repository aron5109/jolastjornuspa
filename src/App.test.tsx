import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { getHoroscope } from './utils/horoscope';

function visit(search: string) {
  window.history.replaceState(null, '', `/jolastjornuspa/${search}`);
  window.sessionStorage.setItem('jolastjornuspa:intro-seen', '1');
  return render(<App />);
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the teaser and no forecasts before December', () => {
    visit('?previewDate=2026-11-20&sign=steingeit');
    expect(screen.getByRole('heading', { name: 'Stjörnurnar eru að stilla sig af…' })).toBeInTheDocument();
    expect(screen.getByText('Jólastjörnuspáin opnar 1. desember.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Vinnan' })).not.toBeInTheDocument();
  });

  it('plays the intro once per session and can be skipped', async () => {
    window.history.replaceState(null, '', '/jolastjornuspa/?previewDate=2026-12-05');
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Sleppa inngangi' }));
    expect(screen.queryByRole('button', { name: 'Sleppa inngangi' })).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem('jolastjornuspa:intro-seen')).toBe('1');
  });

  it('selects a sign and shows the three sections for today', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    visit('?previewDate=2026-12-12');
    await user.click(screen.getByRole('button', { name: /Steingeitin/ }));
    await vi.advanceTimersByTimeAsync(800);

    const expected = getHoroscope('2026-12-12', 'steingeit')!;
    expect(await screen.findByRole('heading', { level: 2, name: 'Steingeitin' })).toBeInTheDocument();
    expect(screen.getByText(expected.work)).toBeInTheDocument();
    expect(screen.getByText(expected.christmas)).toBeInTheDocument();
    expect(screen.getByText(expected.luck)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Meira um Steingeitina' }));
    expect(screen.getByRole('heading', { name: 'Um Steingeitina' })).toBeInTheDocument();
    expect(screen.getByText('Hefðbundnar tengingar í stjörnuspeki')).toBeInTheDocument();
    expect(window.location.search).toContain('sign=steingeit');
    expect(window.location.search).toContain('previewDate=2026-12-12');
  });

  it('locks future dates and lets visitors browse earlier ones', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    visit('?previewDate=2026-12-12&sign=ljon');
    const nav = screen.getByRole('navigation', { name: 'Velja dag í desember' });
    expect(within(nav).getByRole('button', { name: /Næsti dagur, 13. desember, er læstur/ })).toBeDisabled();

    await user.click(within(nav).getByRole('button', { name: 'Fyrri dagur: 11. desember' }));
    expect(screen.getByText(getHoroscope('2026-12-11', 'ljon')!.work)).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: 'Skoða desember' }));
    expect(within(nav).getByRole('button', { name: /^24. desember.*læstur/ })).toBeDisabled();
  });

  it('ignores a direct link to a locked future date', () => {
    visit('?previewDate=2026-12-12&sign=vog&date=2026-12-20');
    expect(screen.getByText(getHoroscope('2026-12-12', 'vog')!.work)).toBeInTheDocument();
  });

  it('keeps December open as an archive after New Year', () => {
    visit('?previewDate=2027-01-10&sign=fiskar');
    expect(screen.getByRole('heading', { level: 1, name: 'Jólastjörnuspá 2026' })).toBeInTheDocument();
    expect(screen.getByText(getHoroscope('2026-12-31', 'fiskar')!.work)).toBeInTheDocument();
  });

  it('copies a clean plain-text forecast', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    visit('?previewDate=2026-12-24&sign=steingeit');
    await user.click(screen.getByRole('button', { name: 'Afrita spána' }));

    const text = writeText.mock.calls[0][0] as string;
    expect(text.startsWith('Jólastjörnuspá — Steingeitin\n24. desember 2026\n\nVinnan:\n')).toBe(true);
    expect(text.trim().endsWith('Til gamans gert.')).toBe(true);
    expect(await screen.findByText('Spáin var afrituð')).toBeInTheDocument();
  });

  it('shows the astronomy panel separately and never invents Moon numbers', () => {
    visit('?previewDate=2026-12-12&sign=naut');
    const sky = screen.getByRole('region', { name: 'Himininn í dag' });
    expect(within(sky).getByText(/NASA/, { selector: '.sky-source' })).toBeInTheDocument();
  });
});
