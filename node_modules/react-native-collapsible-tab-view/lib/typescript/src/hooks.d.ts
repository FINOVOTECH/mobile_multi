import { MutableRefObject } from 'react';
import { LayoutChangeEvent, ViewProps } from 'react-native';
import { RefComponent } from 'react-native-collapsible-tab-view';
import { PagerViewOnPageScrollEvent } from 'react-native-pager-view';
import Animated, { AnimatedRef } from 'react-native-reanimated';
import { CollapsibleStyle, ContextType, TabName, TabReactElement, TabsWithProps } from './types';
export declare function useContainerRef(): AnimatedRef<import("react-native-pager-view").default>;
export declare function useAnimatedDynamicRefs(): [
    ContextType['refMap'],
    ContextType['setRef']
];
export declare function useTabProps<T extends TabName>(children: TabReactElement<T>[] | TabReactElement<T>, tabType: Function): [TabsWithProps<T>, T[]];
/**
 * Hook exposing some useful variables.
 *
 * ```tsx
 * const { focusedTab, ...rest } = useTabsContext()
 * ```
 */
export declare function useTabsContext(): ContextType<TabName>;
/**
 * Access the parent tab screen from any deep component.
 *
 * ```tsx
 * const tabName = useTabNameContext()
 * ```
 */
export declare function useTabNameContext(): TabName;
export declare function useLayoutHeight(initialHeight?: number): readonly [number, (event: LayoutChangeEvent) => void];
/**
 * Hook to access some key styles that make the whole thing work.
 *
 * You can use this to get the progessViewOffset and pass to the refresh control of scroll view.
 */
export declare function useCollapsibleStyle(): CollapsibleStyle;
export declare function useUpdateScrollViewContentSize({ name }: {
    name: TabName;
}): (_: number, h: number) => void;
/**
 * Allows specifying multiple functions to be called in a sequence with the same parameters
 * Useful because we handle some events and need to pass them forward so that the caller can handle them as well
 * @param fns array of functions to call
 * @returns a function that once called will call all passed functions
 */
export declare function useChainCallback(fns: (Function | undefined)[]): (...args: unknown[]) => void;
export declare function useScroller<T extends RefComponent>(): (ref: AnimatedRef<T> | undefined, x: number, y: number, animated: boolean, _debugKey: string) => void;
export declare const useScrollHandlerY: (name: TabName) => {
    scrollHandler: import("react-native-reanimated").ScrollHandlerProcessed<Record<string, unknown>>;
    enable: (toggle: boolean) => void;
};
type ForwardRefType<T> = ((instance: T | null) => void) | MutableRefObject<T | null> | null;
/**
 * Magic hook that creates a multicast ref. Useful so that we can both capture the ref, and forward it to callers.
 * Accepts a parameter for an outer ref that will also be updated to the same ref
 * @param outerRef the outer ref that needs to be updated
 * @returns an animated ref
 */
export declare function useSharedAnimatedRef<T extends RefComponent>(outerRef: ForwardRefType<T>): AnimatedRef<T>;
export declare function useAfterMountEffect(nextOnLayout: ViewProps['onLayout'], effect: React.EffectCallback): (event: LayoutChangeEvent) => void;
export declare function useConvertAnimatedToValue<T>(animatedValue: Animated.SharedValue<T>): 0 | NonNullable<T>;
export interface HeaderMeasurements {
    /**
     * Animated value that represents the current Y translation of the header
     */
    top: Animated.SharedValue<number>;
    /**
     * Animated value that represents the height of the header
     */
    height: number;
}
export declare function useHeaderMeasurements(): HeaderMeasurements;
/**
 * Returns the vertical scroll position of the current tab as an Animated SharedValue
 */
export declare function useCurrentTabScrollY(): Animated.SharedValue<number>;
/**
 * Returns the currently focused tab name
 */
export declare function useFocusedTab(): string | 0;
/**
 * Returns an animated value representing the current tab index, as a floating point number
 */
export declare function useAnimatedTabIndex(): import("react-native-reanimated").SharedValue<number>;
export declare const usePageScrollHandler: (handlers: {
    onPageScroll: (event: PagerViewOnPageScrollEvent["nativeEvent"], context: unknown) => unknown;
}, dependencies?: unknown[]) => import("react-native-reanimated").EventHandlerProcessed<any, never>;
export {};
//# sourceMappingURL=hooks.d.ts.map