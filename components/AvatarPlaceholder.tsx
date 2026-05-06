import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size: number;
  style?: ViewStyle;
}

export default function AvatarPlaceholder({ size, style }: Props) {
  const iconSize = Math.round(size * 0.6);
  return (
    <View style={[{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#1a1a1a',
      justifyContent: 'center',
      alignItems: 'center',
    }, style]}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="3.5" stroke="#FF5B37" strokeWidth="1.5" />
        <Path
          d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"
          stroke="#FF5B37"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
