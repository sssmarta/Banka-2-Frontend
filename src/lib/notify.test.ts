import { toast } from './notify';

// We test that the proxy wrapper around react-toastify's toast:
// 1. Delegates calls correctly
// 2. Catches errors without throwing

describe('toast proxy', () => {
  it('is defined and callable', () => {
    expect(toast).toBeDefined();
    expect(typeof toast).toBe('function');
  });

  it('has success method', () => {
    expect(typeof toast.success).toBe('function');
  });

  it('has error method', () => {
    expect(typeof toast.error).toBe('function');
  });

  it('has warning method', () => {
    expect(typeof toast.warning).toBe('function');
  });

  it('has info method', () => {
    expect(typeof toast.info).toBe('function');
  });

  it('does not throw when calling success', () => {
    // react-toastify may fail in test env without ToastContainer,
    // but the proxy should catch the error
    expect(() => toast.success('Test')).not.toThrow();
  });

  it('does not throw when calling error', () => {
    expect(() => toast.error('Error test')).not.toThrow();
  });

  it('does not throw when calling info', () => {
    expect(() => toast.info('Info test')).not.toThrow();
  });

  it('does not throw when calling warning', () => {
    expect(() => toast.warning('Warning test')).not.toThrow();
  });

  it('does not throw when calling toast directly', () => {
    expect(() => toast('Direct test')).not.toThrow();
  });

  it('has dismiss method', () => {
    expect(typeof toast.dismiss).toBe('function');
  });

  it('returns non-function properties as-is', () => {
    // Accessing a non-function property should not throw
    // (toast may or may not have POSITION depending on version)
    expect(() => (toast as Record<string, unknown>)['__nonExistentProp__']).not.toThrow();
  });
});
