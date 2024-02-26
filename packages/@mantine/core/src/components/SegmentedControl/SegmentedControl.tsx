import React, { useEffect, useRef, useState } from 'react';
import {
  useId,
  useMergedRef,
  useResizeObserver,
  useTimeout,
  useUncontrolled,
} from '@mantine/hooks';
import {
  Box,
  BoxProps,
  createVarsResolver,
  ElementProps,
  Factory,
  factory,
  getContrastColor,
  getEnv,
  getFontSize,
  getRadius,
  getSize,
  getThemeColor,
  MantineColor,
  MantineRadius,
  MantineSize,
  StylesApiProps,
  useDirection,
  useMantineTheme,
  useProps,
  useStyles,
} from '../../core';
import { getRootPadding } from './get-root-padding';
import classes from './SegmentedControl.module.css';

const WRAPPER_PADDING = 4;

export type SegmentedControlStylesNames = 'root' | 'input' | 'label' | 'control' | 'indicator';
export type SegmentedControlCssVariables = {
  root:
    | '--sc-radius'
    | '--sc-color'
    | '--sc-font-size'
    | '--sc-padding'
    | '--sc-shadow'
    | '--sc-transition-duration'
    | '--sc-transition-timing-function';
};

export interface SegmentedControlItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps
  extends BoxProps,
    StylesApiProps<SegmentedControlFactory>,
    ElementProps<'div', 'onChange'> {
  /** Data based on which controls are rendered */
  data: (string | SegmentedControlItem)[];

  /** Controlled component value */
  value?: string;

  /** Uncontrolled component default value */
  defaultValue?: string;

  /** Called when value changes */
  onChange?: (value: string) => void;

  /** Determines whether the component is disabled */
  disabled?: boolean;

  /** Name of the radio group, by default random name is generated */
  name?: string;

  /** Determines whether the component should take 100% width of its parent, `false` by default */
  fullWidth?: boolean;

  /** Key of `theme.colors` or any valid CSS color, changes color of indicator, by default color is based on current color scheme */
  color?: MantineColor;

  /** Controls `font-size`, `padding` and `height` properties, `'sm'` by default */
  size?: MantineSize | (string & {});

  /** Key of `theme.radius` or any valid CSS value to set `border-radius`, numbers are converted to rem, `theme.defaultRadius` by default */
  radius?: MantineRadius;

  /** Indicator `transition-duration` in ms, set `0` to turn off transitions, `200` by default */
  transitionDuration?: number;

  /** Indicator `transition-timing-function` property, `ease` by default */
  transitionTimingFunction?: string;

  /** Determines in which orientation component id displayed, `'horizontal'` by default */
  orientation?: 'vertical' | 'horizontal';

  /** Determines whether the value can be changed */
  readOnly?: boolean;

  /** Determines whether text color should depend on `background-color` of the indicator. If luminosity of the `color` prop is less than `theme.luminosityThreshold`, then `theme.white` will be used for text color, otherwise `theme.black`. Overrides `theme.autoContrast`. */
  autoContrast?: boolean;

  /** Determines whether there should be borders between items, `true` by default */
  withItemsBorders?: boolean;
}

export type SegmentedControlFactory = Factory<{
  props: SegmentedControlProps;
  ref: HTMLDivElement;
  stylesNames: SegmentedControlStylesNames;
  vars: SegmentedControlCssVariables;
}>;

const defaultProps: Partial<SegmentedControlProps> = {
  withItemsBorders: true,
};

const varsResolver = createVarsResolver<SegmentedControlFactory>(
  (theme, { radius, color, transitionDuration, size, transitionTimingFunction }) => ({
    root: {
      '--sc-radius': radius === undefined ? undefined : getRadius(radius),
      '--sc-color': color ? getThemeColor(color, theme) : undefined,
      '--sc-shadow': color ? undefined : 'var(--mantine-shadow-xs)',
      '--sc-transition-duration':
        transitionDuration === undefined ? undefined : `${transitionDuration}ms`,
      '--sc-transition-timing-function': transitionTimingFunction,
      '--sc-padding': getSize(size, 'sc-padding'),
      '--sc-font-size': getFontSize(size),
    },
  })
);

export const SegmentedControl = factory<SegmentedControlFactory>((_props, ref) => {
  const props = useProps('SegmentedControl', defaultProps, _props);
  const {
    classNames,
    className,
    style,
    styles,
    unstyled,
    vars,
    data,
    value,
    defaultValue,
    onChange,
    size,
    name,
    disabled,
    readOnly,
    fullWidth,
    orientation,
    radius,
    color,
    transitionDuration,
    transitionTimingFunction,
    variant,
    autoContrast,
    withItemsBorders,
    mod,
    ...others
  } = props;

  const getStyles = useStyles<SegmentedControlFactory>({
    name: 'SegmentedControl',
    props,
    classes,
    className,
    style,
    classNames,
    styles,
    unstyled,
    vars,
    varsResolver,
  });

  const { dir } = useDirection();
  const theme = useMantineTheme();

  const _data = data.map((item) =>
    typeof item === 'string' ? { label: item, value: item } : item
  );

  const [_value, handleValueChange] = useUncontrolled({
    value,
    defaultValue,
    finalValue: Array.isArray(data)
      ? _data.find((item) => !item.disabled)?.value ?? (data[0] as any)?.value ?? null
      : null,
    onChange,
  });

  const [activePosition, setActivePosition] = useState({
    width: 0,
    height: 0,
    translate: [0, 0],
  });
  const uuid = useId(name);
  const refs = useRef<Record<string, HTMLLabelElement>>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [observerRef, containerRect] = useResizeObserver();

  useEffect(() => {
    if (_value in refs.current && observerRef.current) {
      const element = refs.current[_value];
      if (element) {
        const rootPadding = getRootPadding(rootRef.current!, WRAPPER_PADDING);
        const elementRect = element.getBoundingClientRect();
        const scaledValue = element.offsetWidth / elementRect.width;
        const width = element.clientWidth * scaledValue || 0;
        const height = element.clientHeight * scaledValue || 0;

        const offsetRight =
          containerRect.width -
          element.parentElement!.offsetLeft +
          (dir === 'rtl' ? rootPadding.left : rootPadding.right) -
          width;
        const offsetLeft =
          element.parentElement!.offsetLeft -
          (dir === 'rtl' ? rootPadding.right : rootPadding.left);

        setActivePosition({
          width,
          height,
          translate: [
            dir === 'rtl' ? offsetRight * -1 : offsetLeft,
            element.parentElement!.offsetTop - rootPadding.top,
          ],
        });
      } else {
        setActivePosition({ width: 0, height: 0, translate: [0, 0] });
      }
    }
  }, [_value, containerRect, dir]);

  useTimeout(
    () => {
      // Prevents warning about state update without act
      if (getEnv() !== 'test') {
        setInitialized(true);
      }
    },
    20,
    { autoInvoke: true }
  );

  const controls = _data.map((item) => (
    <Box
      {...getStyles('control')}
      mod={{ active: _value === item.value, orientation }}
      key={item.value}
    >
      <input
        {...getStyles('input')}
        disabled={disabled || item.disabled}
        type="radio"
        name={uuid}
        value={item.value}
        id={`${uuid}-${item.value}`}
        checked={_value === item.value}
        onChange={() => !readOnly && handleValueChange(item.value)}
        data-focus-ring={theme.focusRing}
      />

      <Box
        component="label"
        {...getStyles('label')}
        mod={{
          active: _value === item.value && !(disabled || item.disabled),
          disabled: disabled || item.disabled,
          'read-only': readOnly,
        }}
        htmlFor={`${uuid}-${item.value}`}
        ref={(node) => {
          refs.current[item.value] = node!;
        }}
        __vars={{
          '--sc-label-color':
            color !== undefined ? getContrastColor({ color, theme, autoContrast }) : undefined,
        }}
      >
        {item.label}
      </Box>
    </Box>
  ));

  const mergedRef = useMergedRef(observerRef, rootRef, ref);

  if (data.length === 0) {
    return null;
  }

  return (
    <Box
      {...getStyles('root')}
      variant={variant}
      size={size}
      ref={mergedRef}
      mod={[
        {
          'full-width': fullWidth,
          orientation,
          initialization: !initialized,
          'with-items-borders': withItemsBorders,
        },
        mod,
      ]}
      {...others}
      role="radiogroup"
    >
      {typeof _value === 'string' && (
        <Box
          component="span"
          {...getStyles('indicator')}
          __vars={{
            '--sc-indicator-width': `${activePosition.width}px`,
            '--sc-indicator-height': `${activePosition.height}px`,
            '--sc-indicator-transform': `translate(${activePosition.translate[0]}px, ${activePosition.translate[1]}px)`,
          }}
        />
      )}

      {controls}
    </Box>
  );
});

SegmentedControl.classes = classes;
SegmentedControl.displayName = '@mantine/core/SegmentedControl';
