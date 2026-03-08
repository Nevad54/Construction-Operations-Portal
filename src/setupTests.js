import '@testing-library/jest-dom/vitest';

const createStorageMock = () => {
  let store = {};

  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

const ensureStorageMock = (propertyName) => {
  const currentValue = globalThis[propertyName];
  if (currentValue && typeof currentValue.clear === 'function') {
    return;
  }

  Object.defineProperty(globalThis, propertyName, {
    value: createStorageMock(),
    configurable: true,
    writable: true,
  });
};

ensureStorageMock('localStorage');
ensureStorageMock('sessionStorage');
