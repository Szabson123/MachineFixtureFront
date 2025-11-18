export function getCSRFToken() {
  return document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "";
}

export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    "Content-Type": "application/json",
    "X-CSRFToken": getCSRFToken(),
    ...(options.headers || {}),
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}
