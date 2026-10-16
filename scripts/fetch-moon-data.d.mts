import type { MoonDay, MoonPhaseKey } from '../src/types';

export function parseNasaTime(value: unknown): Date | null;
export function phaseKey(illumination: number, waxing: boolean): MoonPhaseKey;
export function extractDecember(records: unknown): MoonDay[];
