// Mock for next/navigation hooks used in client components
export const useRouter = () => ({
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
});

export const useSearchParams = () => {
  const params = new URLSearchParams();
  return {
    get: (key) => params.get(key),
    toString: () => params.toString(),
  };
};
