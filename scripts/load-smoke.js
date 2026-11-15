import http from 'k6/http';
import { check, sleep } from 'k6';

const base = __ENV.BASE_URL || 'http://localhost:3000';
const cookie = __ENV.SESSION_COOKIE || '';
export const options = {
  scenarios: {
    campus_read_smoke: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 5),
      duration: __ENV.DURATION || '1m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const headers = cookie ? { Cookie: cookie } : {};
  const routes = cookie
    ? ['/home', '/explore', '/projects', '/messages', '/resume', '/opportunities', '/events']
    : ['/'];
  for (const route of routes) {
    const response = http.get(`${base}${route}`, { headers, tags: { route } });
    check(response, { [`${route} responds`]: r => r.status === 200 });
  }
  sleep(1);
}
