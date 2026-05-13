export const readApiResult = async (response) => {
  let result = null;
  let hasParsedJson = false;

  try {
    result = await response.json();
    hasParsedJson = true;
  } catch {
    // Some Apps Script responses are empty even when the request succeeds.
  }

  const apiStatus = String(result?.result || result?.status || '').toLowerCase();
  const hasExplicitFailure = result?.success === false || Boolean(result?.error);

  if (!response.ok || apiStatus === 'error' || hasExplicitFailure) {
    throw new Error(result?.message || result?.error || 'Request gagal');
  }

  if (!hasParsedJson || result === null || result === undefined) {
    return { status: 'success' };
  }

  return result;
};

export const isSuccessResult = (result = {}) => {
  const apiStatus = String(result?.result || result?.status || '').toLowerCase();

  if (result?.success === false || result?.error) return false;
  if (result?.success === true) return true;
  if (!apiStatus) return true;

  return apiStatus === 'success' || apiStatus === 'ok';
};
