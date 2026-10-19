// Extra ICE servers for co-op.
//
// Out of the box the game only uses public STUN servers (built into Trystero). That connects most
// pairs of players directly, but two people who are both behind strict NAT (some mobile networks,
// some corporate Wi-Fi) need a TURN relay in between. If friends see "connecting…" forever, add one
// here — e.g. a free Cloudflare Calls / Metered.ca account gives you URLs and credentials:
//
//   export const ICE_SERVERS = [
//     { urls: ['turn:example.com:3478', 'turns:example.com:5349'], username: 'user', credential: 'pass' },
//   ];
//
// Everything stays end-to-end encrypted either way; TURN only forwards the packets.
export const ICE_SERVERS = [];
