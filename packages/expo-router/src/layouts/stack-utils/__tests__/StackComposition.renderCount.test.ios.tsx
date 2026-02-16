import { act, fireEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { Button, Text } from 'react-native';
import { ScreenStackItem as _ScreenStackItem } from 'react-native-screens';

import { router } from '../../../imperative-api';
import { renderRouter, screen } from '../../../testing-library';
import Stack from '../../Stack';

jest.mock('react-native-screens', () => {
  const actualScreens = jest.requireActual(
    'react-native-screens'
  ) as typeof import('react-native-screens');
  return {
    ...actualScreens,
    ScreenStackItem: jest.fn((props) => <actualScreens.ScreenStackItem {...props} />),
  };
});

const MockedRouterToolbarHost = jest.fn(({ children }) => <>{children}</>);
const MockedRouterToolbarItem = jest.fn(({ children }) => <>{children}</>);

jest.mock('../../../toolbar/native', () => {
  return {
    RouterToolbarHost: (props: any) => MockedRouterToolbarHost(props),
    RouterToolbarItem: (props: any) => MockedRouterToolbarItem(props),
  };
});

const ScreenStackItem = _ScreenStackItem as jest.MockedFunction<typeof _ScreenStackItem>;

let consoleWarnMock: jest.SpyInstance;
beforeEach(() => {
  consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.clearAllMocks();
});

afterEach(() => {
  consoleWarnMock.mockRestore();
});

describe('Stack composition components render count', () => {
  it('initial render with composition components produces predictable ScreenStackItem calls', () => {
    const indexRender = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        indexRender();
        return (
          <>
            <Stack.Screen.Title>Home</Stack.Screen.Title>
            <Stack.Screen.BackButton hidden />
            <Stack.Header blurEffect="regular" />
            <Text testID="index">Index</Text>
          </>
        );
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    // Screen render fn called once
    expect(indexRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem: initial layout render + composition registration effect
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);

    // Final call should have merged composition options
    const finalProps = ScreenStackItem.mock.calls[1][0];
    expect(finalProps.headerConfig?.title).toBe('Home');
    expect(finalProps.headerConfig?.backButtonInCustomView).toBe(false);
    expect(finalProps.headerConfig?.blurEffect).toBe('regular');
  });

  it('no extra ScreenStackItem calls after composition options settle', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        return (
          <>
            <Stack.Screen.Title>Home</Stack.Screen.Title>
            <Stack.Screen.BackButton hidden />
            <Stack.Header blurEffect="regular" />
            <Text testID="index">Index</Text>
          </>
        );
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    // Clear after initial settle
    jest.clearAllMocks();

    // Flush any pending effects
    act(() => {});

    // No additional ScreenStackItem calls after settling
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });

  it('navigation to another screen does not rerender first screen', () => {
    const indexRender = jest.fn();
    const detailRender = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        indexRender();
        return (
          <>
            <Stack.Screen.Title>Home</Stack.Screen.Title>
            <Text testID="index">Index</Text>
          </>
        );
      },
      detail: function Detail() {
        detailRender();
        return (
          <>
            <Stack.Screen.Title>Detail</Stack.Screen.Title>
            <Text testID="detail">Detail</Text>
          </>
        );
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(indexRender).toHaveBeenCalledTimes(1);
    expect(detailRender).not.toHaveBeenCalled();

    // Verify initial ScreenStackItem calls: layout render + index composition registration
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);
    expect(ScreenStackItem.mock.calls[1][0].headerConfig?.title).toBe('Home');

    jest.clearAllMocks();

    act(() => router.push('/detail'));

    expect(screen.getByTestId('detail')).toBeVisible();

    // Index screen should NOT rerender
    expect(indexRender).not.toHaveBeenCalled();
    // Detail screen renders once
    expect(detailRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem calls after push:
    // [0] index (nav state change), [1] detail (initial), [2] index (rerender), [3] detail (composition)
    // TODO(@ubax): [2] is an extra ScreenStackItem call for index caused by the centralized
    // composition registry — detail's registration triggers a navigator-level state update
    // which re-renders ScreenStackItem for all routes, even though index's merged options are unchanged.
    expect(ScreenStackItem).toHaveBeenCalledTimes(4);
    // Last call should have detail's composition options
    expect(ScreenStackItem.mock.calls[3][0].headerConfig?.title).toBe('Detail');

    jest.clearAllMocks();

    act(() => router.back());

    expect(screen.getByTestId('index')).toBeVisible();

    // Stack preserves screens — neither should rerender on back
    expect(indexRender).not.toHaveBeenCalled();
    expect(detailRender).not.toHaveBeenCalled();

    // ScreenStackItem called for navigation state update, but no composition re-registration
    // [0] index (nav state update), [1] detail (nav state update)
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);
    // Index screen retains its previously merged composition options
    const homeCall = ScreenStackItem.mock.calls.find(
      (call) => call[0].headerConfig?.title === 'Home'
    );
    expect(homeCall).toBeDefined();
  });

  it('multiple composition components on same screen do not multiply renders', () => {
    const indexRender = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      index: function Index() {
        indexRender();
        return (
          <>
            <Stack.Screen.Title>Home</Stack.Screen.Title>
            <Stack.Screen.BackButton hidden />
            <Stack.Header blurEffect="regular" />
            <Stack.Toolbar placement="right">
              <Stack.Toolbar.Button icon="star" onPress={() => {}} />
            </Stack.Toolbar>
            <Text testID="index">Index</Text>
          </>
        );
      },
    });

    expect(screen.getByTestId('index')).toBeVisible();

    // Screen render fn called once
    expect(indexRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem: initial layout render + composition registration (batched, not per-component)
    expect(ScreenStackItem).toHaveBeenCalledTimes(2);

    // Final call should have ALL four components' options merged
    const finalProps = ScreenStackItem.mock.calls[1][0];
    expect(finalProps.headerConfig?.title).toBe('Home');
    expect(finalProps.headerConfig?.backButtonInCustomView).toBe(false);
    expect(finalProps.headerConfig?.blurEffect).toBe('regular');
    // Toolbar right items are present
    expect(finalProps.headerConfig?.headerRightBarButtonItems).toHaveLength(1);
  });

  it('unfocused screens with composition do not trigger extra renders on further navigation', () => {
    const screenARender = jest.fn();
    const screenBRender = jest.fn();
    const screenCRender = jest.fn();

    renderRouter({
      _layout: () => <Stack />,
      index: function ScreenA() {
        screenARender();
        return (
          <>
            <Stack.Screen.Title>Screen A</Stack.Screen.Title>
            <Text testID="screenA">Screen A</Text>
          </>
        );
      },
      'screen-b': function ScreenB() {
        screenBRender();
        return (
          <>
            <Stack.Screen.Title>Screen B</Stack.Screen.Title>
            <Stack.Screen.BackButton>Back to A</Stack.Screen.BackButton>
            <Text testID="screenB">Screen B</Text>
          </>
        );
      },
      'screen-c': function ScreenC() {
        screenCRender();
        return <Text testID="screenC">Screen C</Text>;
      },
    });

    expect(screen.getByTestId('screenA')).toBeVisible();

    // Navigate A -> B
    jest.clearAllMocks();
    act(() => router.push('/screen-b'));
    expect(screen.getByTestId('screenB')).toBeVisible();
    expect(screenARender).not.toHaveBeenCalled();
    expect(screenBRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem calls after A -> B:
    // [0] screen A (nav state), [1] screen B (initial), [2] screen A (rerender), [3] screen B (composition)
    expect(ScreenStackItem).toHaveBeenCalledTimes(4);
    expect(ScreenStackItem.mock.calls[3][0].headerConfig?.title).toBe('Screen B');
    expect(ScreenStackItem.mock.calls[3][0].headerConfig?.backTitle).toBe('Back to A');

    // Navigate B -> C
    jest.clearAllMocks();
    act(() => router.push('/screen-c'));
    expect(screen.getByTestId('screenC')).toBeVisible();

    // Neither A nor B should rerender when navigating to C
    expect(screenARender).not.toHaveBeenCalled();
    expect(screenBRender).not.toHaveBeenCalled();
    expect(screenCRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem calls after B -> C:
    // Screen C has no composition components, so no composition registration call
    // [0] screen B (nav state), [1] screen C (initial), [2] screen B (rerender)
    expect(ScreenStackItem).toHaveBeenCalledTimes(3);
    // Find the screen C call — it should use the default route name as title
    const screenCCall = ScreenStackItem.mock.calls.find(
      (call) => call[0].headerConfig?.title === 'screen-c'
    );
    expect(screenCCall).toBeDefined();
  });

  it('local state changes do not trigger composition re-registration', () => {
    const indexRender = jest.fn();

    function Index() {
      indexRender();
      const [count, setCount] = useState(0);
      return (
        <>
          <Stack.Screen.Title>Static Title</Stack.Screen.Title>
          <Text testID="count">{count}</Text>
          <Button testID="increment" title="+" onPress={() => setCount(count + 1)} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    // Clear after initial settle
    jest.clearAllMocks();

    // Increment counter — triggers rerender of screen component
    act(() => {
      fireEvent.press(screen.getByTestId('increment'));
    });

    expect(screen.getByTestId('count')).toHaveTextContent('1');

    // Screen render fn IS called (state changed, expected)
    expect(indexRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem should NOT be called — composition options unchanged
    // The deepEqual guard in useCompositionOption prevents re-registration
    expect(ScreenStackItem).not.toHaveBeenCalled();
  });

  it('changed composition options DO trigger ScreenStackItem update', () => {
    const indexRender = jest.fn();

    function Index() {
      indexRender();
      const [title, setTitle] = useState('Initial');
      return (
        <>
          <Stack.Screen.Title>{title}</Stack.Screen.Title>
          <Text testID="title">{title}</Text>
          <Button testID="changeTitle" title="Change" onPress={() => setTitle('Updated')} />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('title')).toHaveTextContent('Initial');

    // Verify initial title propagated
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.title).toBe('Initial');

    // Clear after initial settle
    jest.clearAllMocks();

    // Change the title — composition options actually change
    act(() => {
      fireEvent.press(screen.getByTestId('changeTitle'));
    });

    expect(screen.getByTestId('title')).toHaveTextContent('Updated');

    // Screen rerenders (state changed)
    expect(indexRender).toHaveBeenCalledTimes(1);

    // ScreenStackItem SHOULD be called — composition options changed
    // deepEqual detects the difference and allows re-registration
    expect(ScreenStackItem).toHaveBeenCalledTimes(1);
    expect(ScreenStackItem.mock.calls[0][0].headerConfig?.title).toBe('Updated');
  });

  it('conditionally removed composition component clears its options', () => {
    function Index() {
      const [showBackButton, setShowBackButton] = useState(true);
      return (
        <>
          <Stack.Screen.Title>Home</Stack.Screen.Title>
          {showBackButton && <Stack.Screen.BackButton>Go Back</Stack.Screen.BackButton>}
          <Text testID="content">Content</Text>
          <Button
            testID="toggleBackButton"
            title="Toggle"
            onPress={() => setShowBackButton((v) => !v)}
          />
        </>
      );
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Index,
    });

    expect(screen.getByTestId('content')).toBeVisible();

    // Verify initial state has back button options
    const initialProps = ScreenStackItem.mock.calls[1][0];
    expect(initialProps.headerConfig?.title).toBe('Home');
    expect(initialProps.headerConfig?.backTitle).toBe('Go Back');

    jest.clearAllMocks();

    // Remove the BackButton component
    act(() => {
      fireEvent.press(screen.getByTestId('toggleBackButton'));
    });

    // ScreenStackItem should be called — unregister fires, registry changes
    expect(ScreenStackItem).toHaveBeenCalled();

    // The back button options should be cleared (unregistered from composition registry)
    const lastCallIndex = ScreenStackItem.mock.calls.length - 1;
    const finalProps = ScreenStackItem.mock.calls[lastCallIndex][0];
    // Title still present (its composition component is still mounted)
    expect(finalProps.headerConfig?.title).toBe('Home');
    // Back button title should be gone (component unmounted, unregistered)
    expect(finalProps.headerConfig?.backTitle).toBeUndefined();
  });
});
