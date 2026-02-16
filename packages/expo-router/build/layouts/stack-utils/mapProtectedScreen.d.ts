import { type ProtectedProps } from '../../views/Protected';
/**
 * Converts StackScreen children into base Screen children that React Navigation
 * can recognise via `isScreen()`. Also recursively processes nested Protected
 * wrappers and filters out StackHeader elements (used only for native header config).
 */
export declare function mapProtectedScreen(props: ProtectedProps): ProtectedProps;
//# sourceMappingURL=mapProtectedScreen.d.ts.map