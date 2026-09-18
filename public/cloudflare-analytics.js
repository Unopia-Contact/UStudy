const ANALYTICS_TOKENS = {
  'ustudy.hakhoi.io.vn': '4267fec093414ddaa7628adde13a3d30',
  'ustudy.unopia.io.vn': '39ecd9932293460a809e9098a40d5f54',
};

const token = ANALYTICS_TOKENS[window.location.hostname];

if (token) {
  const beacon = document.createElement('script');
  beacon.type = 'module';
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({ token });
  document.body.append(beacon);
}
