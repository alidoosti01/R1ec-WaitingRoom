const REDIS_PROXY_URL = 'https://redis.example.com';

const redis = {
  async dbsize() {
    return await fetchFromRedis('/dbsize');
  },
  async get(key) {
    return await fetchFromRedis(`/get/${key}`);
  },
  async setex(key, seconds, value) {
    return await fetchFromRedis(`/setex/${key}/${seconds}/${value}`);
  }
};

async function fetchFromRedis(endpoint) {
  try {
    const response = await fetch(`${REDIS_PROXY_URL}${endpoint}`, { method: 'GET' });
    const data = await response.json();
    return data.result;
  } catch (err) {
    console.error(`Error with Redis endpoint ${endpoint}:`, err);
    throw err;
  }
}

// Main event listener
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request).catch(err => new Response(err.stack, { status: 500 })));
});

// Constants
const COOKIE_NAME_ID = '__waiting_room_id';
const COOKIE_NAME_TIME = '__waiting_room_last_update_time';
const TOTAL_ACTIVE_USERS = 10;
const SESSION_DURATION_SECONDS = 20;

// Handle request function
async function handleRequest(request) {
  const { pathname } = new URL(request.url);
  if (pathname === '/') {
    const cookie = parseCookie(request.headers.get('Cookie') || '');
    const userId = cookie[COOKIE_NAME_ID] || crypto.randomUUID();
    const size = await redis.dbsize();

    console.log('current capacity:', size);
    if (size < TOTAL_ACTIVE_USERS || await redis.get(userId)) {
      return getDefaultResponse(cookie, userId);
    } else {
      return getWaitingRoomResponse();
    }
  } else if (pathname === '/favicon.ico') {
    return fetch(request);
  } else {
    return new Response(helloPageHtml, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
  }
}

// Default response function
async function getDefaultResponse(cookie, userId) {
  const response = new Response(helloPageHtml, { headers: { 'content-type': 'text/html;charset=UTF-8' } });

  const now = Date.now();
  const lastUpdate = cookie[COOKIE_NAME_TIME] || 0;
  const diff = now - lastUpdate;
  const updateInterval = (SESSION_DURATION_SECONDS * 1000) / 2;

  if (diff > updateInterval) {
    await redis.setex(userId, SESSION_DURATION_SECONDS, true);
    response.headers.append('Set-Cookie', `${COOKIE_NAME_TIME}=${now}; path=/`);
  }

  response.headers.append('Set-Cookie', `${COOKIE_NAME_ID}=${userId}; path=/`);
  return response;
}

// Waiting room response function
function getWaitingRoomResponse() {
  return new Response(waitingRoomHtml, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
}

// Cookie parser function
function parseCookie(cookieString) {
  return cookieString.split(';').reduce((acc, v) => {
    const [key, val] = v.split('=');
    if (key && val) {
      acc[decodeURIComponent(key.trim())] = decodeURIComponent(val.trim());
    }
    return acc;
  }, {});
}

// HTML content for waiting room
const waitingRoomHtml = `
<title>Waiting Room</title>
<meta http-equiv='refresh' content='30' />
<style>*{box-sizing:border-box;margin:0;padding:0}body{line-height:1.4;font-size:1rem;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;padding:2rem;display:grid;place-items:center;min-height:100vh}.container{width:100%;max-width:800px}p{margin-top:.5rem}</style>
<div class='container'>
  <h1>
    <div>You are now in line.</div>
    <div>Thanks for your patience.</div>
  </h1>
  <p>We are experiencing a high volume of traffic. Please sit tight and we will let you in soon.</p>
  <p><b>This page will automatically refresh, please do not close your browser.</b></p>
</div>
`;

// HTML content for default response
const helloPageHtml = `
<title>Hello Page</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{line-height:1.4;font-size:1rem;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;padding:2rem;display:grid;place-items:center;min-height:100vh}.container{width:100%;max-width:800px}p{margin-top:.5rem}</style>
<div class="container">
  <h1>
    <div>Hello, welcome to our site!</div>
  </h1>
  <p>This is the default page shown to users.</p>
</div>
`;
