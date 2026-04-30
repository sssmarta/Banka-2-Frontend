import { useContext } from 'react';
import { ArbitroContext } from './ArbitroContext';

export function useArbitro() {
  const ctx = useContext(ArbitroContext);
  if (!ctx) throw new Error('useArbitro mora biti pozvan unutar ArbitroProvider-a');
  return ctx;
}
