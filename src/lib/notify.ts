import { toast as baseToast } from 'react-toastify';

// Guard toast calls so notification failures never crash route rendering.
export const toast = new Proxy(baseToast as typeof baseToast, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value !== 'function') {
      return value;
    }

    return (...args: unknown[]) => {
      try {
        return (value as (...innerArgs: unknown[]) => unknown).apply(target, args);
      } catch (error) {
        console.error('Toast call failed', { prop: String(prop), error, args });
        return undefined;
      }
    };
  },
}) as typeof baseToast;
