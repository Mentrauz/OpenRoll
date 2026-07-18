import dns from 'dns';

// Force Node's DNS resolver to prefer IPv4 and use public DNS servers (Google & Cloudflare).
// This prevents querySrv ECONNREFUSED issues on local networks with buggy IPv6 DNS configurations.
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore if setDefaultResultOrder is not supported in older node environments
}

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('[DNS] Failed to set custom DNS servers, using system default:', e);
}
