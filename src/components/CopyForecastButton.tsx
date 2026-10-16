import { useEffect, useRef, useState } from 'react';
import { copyText } from '../utils/clipboard';
import { CopyIcon } from './icons';

type Props = {
  getText: () => string;
};

/** Copies the forecast as plain text and announces the result in a polite live region. */
export function CopyForecastButton({ getText }: Props) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async () => {
    const ok = await copyText(getText());
    setStatus(ok ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), 4000);
  };

  return (
    <>
      <button type="button" className="action-button is-primary" onClick={onClick}>
        <CopyIcon className="action-icon" />
        Afrita spána
      </button>
      <p className="action-status" role="status" aria-live="polite">
        {status === 'copied' ? 'Spáin var afrituð' : status === 'failed' ? 'Ekki tókst að afrita spána' : ''}
      </p>
    </>
  );
}
