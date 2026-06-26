import { coralIdentityGradient } from '@/theme/theme';

interface CoralThumbProps {
  rfCode: string;
  size?: number;
  radius?: number;
  style?: React.CSSProperties;
}

export function CoralThumb({ rfCode, size = 36, radius = 6, style }: CoralThumbProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: coralIdentityGradient(rfCode),
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
