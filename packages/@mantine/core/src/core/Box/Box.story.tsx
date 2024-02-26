import React from 'react';
import { DEFAULT_THEME, rgba } from '../MantineProvider';
import { Box } from './Box';

export default { title: 'Box' };

export function Usage() {
  return (
    <div style={{ padding: 40 }}>
      <Box bg="orange.4" ms="xl">
        Visible from sm
      </Box>
    </div>
  );
}

export function ColorMix() {
  return (
    <div style={{ padding: 40 }}>
      <Box bg={rgba(DEFAULT_THEME.colors.pink[5], 1)} h={200} w={200}>
        Pink.6
      </Box>
      <Box bg="color-mix(in srgb, var(--mantine-color-pink-5), white 20%)" h={200} w={200}>
        Pink.6 color-mix
      </Box>
      <Box bg="color-mix(in srgb, var(--mantine-color-pink-5), black 20%)" h={200} w={200}>
        Pink.6 color-mix
      </Box>
    </div>
  );
}
