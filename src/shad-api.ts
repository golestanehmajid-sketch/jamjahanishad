const SHAD_LOGIN_URL = "https://shadapi.noyanet.com/api/v1/Account/login";
const SHAD_EVENT_URL = "https://shadapi.noyanet.com/api/v1/ShadEvent";
const SHAD_TOKEN_TTL_MS = 50 * 60 * 1000;

let tokenCache: { token: string; expiresAt: number } | null = null;

export function clearShadTokenCache() {
  tokenCache = null;
}

export async function getShadAccessToken(
  landingId: number,
  username: string,
  password: string
): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const loginResponse = await fetch(SHAD_LOGIN_URL, {
    method: "POST",
    headers: {
      Accept: "text/plain",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ landingId, username, password }),
  });

  if (!loginResponse.ok) {
    clearShadTokenCache();
    throw new Error(`شکست در احراز هویت با سرور شاد: ${loginResponse.statusText}`);
  }

  const loginData = await loginResponse.json();
  const token = loginData.data;

  if (!token) {
    clearShadTokenCache();
    throw new Error("توکن اختصاصی از وب‌سرویس شاد بازگردانده نشد.");
  }

  tokenCache = {
    token,
    expiresAt: Date.now() + SHAD_TOKEN_TTL_MS,
  };

  return token;
}

export async function fetchShadUserEvent(userHashId: string, token: string) {
  const eventResponse = await fetch(
    `${SHAD_EVENT_URL}?UserHashId=${encodeURIComponent(userHashId)}`,
    {
      method: "GET",
      headers: {
        Accept: "text/plain",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!eventResponse.ok) {
    throw new Error(`خطا در استعلام اطلاعات کاربر از شاد: ${eventResponse.statusText}`);
  }

  return eventResponse.json();
}
