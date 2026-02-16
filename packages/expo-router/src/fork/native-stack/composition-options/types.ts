import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * Registry mapping route keys to composition component options.
 *
 * Structure: Map<routeKey, Map<componentId, options>>
 *
 * Each composition component (Title, BackButton, Header, Toolbar) registers
 * its options under a unique componentId (from React's useId).
 * Map preserves insertion order, so later registrations override earlier ones.
 */
export type CompositionRegistry = Map<string, Map<string, Partial<NativeStackNavigationOptions>>>;

export interface CompositionContextValue {
  /**
   * Register or update options for a composition component.
   *
   * @param routeKey - The navigation route key (from useRoute().key)
   * @param componentId - Unique component ID (from useId())
   * @param options - Partial navigation options to merge
   */
  setOptionsFor(
    routeKey: string,
    componentId: string,
    options: Partial<NativeStackNavigationOptions>
  ): void;

  /**
   * Unregister a composition component's options (called on unmount).
   *
   * @param routeKey - The navigation route key
   * @param componentId - Unique component ID to remove
   */
  unregister(routeKey: string, componentId: string): void;
}
