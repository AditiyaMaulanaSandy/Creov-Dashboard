export const readApiResult = async (response) => {
  let result = null;

  try {
    result = await response.json();
  } catch {
    // Some Apps Script responses are empty even when the request succeeds.
  }

  if (!response.ok || result?.result === 'error' || result?.status === 'error') {
    throw new Error(result?.message || 'Request gagal');
  }

  return result || {};
};

export const isSuccessResult = (result) => result.result === 'success' || result.status === 'success';
