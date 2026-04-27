import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';

const mockCaptureException = jest.fn();

jest.mock('@/services/observabilityService', () => ({
  observabilityService: {
    captureException: (...args: unknown[]) => mockCaptureException(...args),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  // React's error boundary path logs to console.error; silence it for clean
  // test output.
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore?.();
});

function Boom(): never {
  throw new Error('render-error');
}

function Ok() {
  return <Text testID="ok">ok</Text>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <Ok />
      </ErrorBoundary>,
    );
    expect(getByTestId('ok')).toBeTruthy();
  });

  it('renders the fallback UI on render error', () => {
    const { getByTestId, getByText } = render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('calls observabilityService.captureException with the error', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(mockCaptureException).toHaveBeenCalled();
    const [err, ctx] = mockCaptureException.mock.calls[0];
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('render-error');
    expect(ctx).toMatchObject({ extra: expect.any(Object) });
  });

  it('resets error state when "Try again" is pressed', () => {
    // Toggle child via a module-level switch so the same React tree can
    // first throw, then render OK after retry. This exercises the state
    // reset path without unmounting the boundary.
    let throwOnNext = true;
    function Toggle() {
      if (throwOnNext) throw new Error('boom');
      return <Text testID="ok">ok</Text>;
    }
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary>
        <Toggle />
      </ErrorBoundary>,
    );
    expect(getByTestId('error-boundary-fallback')).toBeTruthy();
    throwOnNext = false;
    fireEvent.press(getByTestId('error-boundary-retry'));
    expect(queryByTestId('error-boundary-fallback')).toBeNull();
    expect(getByTestId('ok')).toBeTruthy();
  });
});
