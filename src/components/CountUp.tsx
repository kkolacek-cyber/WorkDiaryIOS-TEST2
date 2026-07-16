import React, { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

interface Props {
  value: number;
  format: (v: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

/**
 * Broj koji se "izbroji" do ciljne vrijednosti (ease-out).
 * Uz uključen iOS "Reduce Motion" preskače animaciju i odmah pokaže iznos.
 */
export function CountUp({ value, format, style, duration = 700 }: Props) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    if (from === value) return;
    const start = Date.now();

    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      fromRef.current = value;
    };
  }, [value, duration, reduced]);

  return <Text style={style}>{format(display)}</Text>;
}
