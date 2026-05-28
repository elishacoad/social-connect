# Technology

## The Connect / Bump Method

How two users establish or refresh a friendship in-person.

### Requirements

- Must prove physical presence (not spoofable remotely)
- Must be mutual (both users participate)
- Must work without internet in the moment (or degrade gracefully)
- Must feel satisfying and near-instant
- Must work cross-platform (iOS + Android)

### Technology Options

#### NFC (Near Field Communication)

- **How it works:** Phones exchange NDEF records at 13.56 MHz when held ~4 cm apart
- **Pros:** Strongest proof-of-presence, instant, low power, feels like a deliberate action
- **Cons:** iOS Core NFC has limitations (background reading restricted, no peer-to-peer on iOS). Android NFC is more open but inconsistent across devices. Not all Android phones have NFC.
- **Used by:** Friendster (2026 relaunch, iOS-only)
- **Verdict:** Best proof-of-presence, but iOS peer-to-peer NFC is limited. Would lock us into workarounds or platform-specific flows.

#### QR Code (Mutual Scan)

- **How it works:** Each user generates a temporary QR code. Both users scan each other's code (or one scans and the other confirms). Server matches the pair.
- **Pros:** Works on every phone with a camera. Cross-platform. No special hardware. Can encode a session token with expiry for security.
- **Cons:** Slightly more friction than a tap. QR codes can be screenshotted and shared (mitigated by short expiry + mutual confirmation). Doesn't feel as magical.
- **Used by:** Many apps (WeChat, Snapchat, LinkedIn). Well-understood pattern.
- **Verdict:** Most practical cross-platform option. Mutual scan + server-side session matching + short token expiry makes it secure enough. The "both people scan" ritual adds intentionality.

#### BLE (Bluetooth Low Energy) — Intentional Hold-to-Connect

- **How it works:** Both users tap and hold a "Connect" button simultaneously. Both phones start BLE advertising and scanning, broadcasting a signed temporary token. Each phone discovers the other, reads its token, and checks RSSI (signal strength) to verify proximity (~1-2m at RSSI > -50 dBm). Both tokens are sent to the server, which validates the pair.
- **Pros:** Cross-platform (CoreBluetooth on iOS, Android BLE API — standard protocol, works cross-OS). Lower friction than QR (just hold a button). RSSI provides real proof-of-presence. The simultaneous hold makes it intentional and mutual. Only active while holding (no battery drain). Feels magical — two friends holding phones and getting haptic confirmation.
- **Cons:** RSSI is noisy — walls, bodies, phone cases, and phone orientation affect readings (mitigated by averaging over a few samples and using a generous threshold). In crowded spaces with multiple users holding the button, you need to match by strongest RSSI + server-side token pairing. Discovery typically takes 1-3 seconds but can vary. Not all cheap Android devices have BLE (though coverage is ~95%+ of active devices).
- **Used by:** COVID contact tracing, Blue Social, AirDrop (combined with Wi-Fi), Tile/Chipolo trackers (cross-platform BLE)
- **Verdict:** Strong primary option when combined with an intentional user gesture. The "hold" mechanic transforms BLE from a passive ambient scanner into a deliberate mutual action with proximity proof.

#### Accelerometer + Server Matching (The Original Bump)

- **How it works:** Both users physically bump their phones. App sends accelerometer readings + GPS + timestamp to a server. Server correlates matching bump events from the same location.
- **Pros:** Works on any phone, no special hardware, satisfying physical gesture
- **Cons:** Requires internet. Spoofable (fake bump events from same GPS). Matching algorithm can misfire in crowded spaces. Bump (the app) was acquired by Google and shut down in 2014 after 125M downloads but no sustainable model.
- **Verdict:** Clever but fragile. The matching is probabilistic, not deterministic. Fun gesture but unreliable in practice.

#### Ultrasound / Data-Over-Sound

- **How it works:** Phone speakers emit inaudible ultrasonic tones, phone microphones detect them. Exchange identifiers via sound.
- **Pros:** No special hardware, works without internet/Bluetooth/NFC, short range (1-3m)
- **Cons:** Requires microphone permission (trust barrier). Ambient noise can interfere. Less tested in consumer apps. SDKs exist (LISNR Radius) but niche.
- **Verdict:** Interesting but unproven for consumer social. Microphone permission is a hard sell.

### Leading Candidates

The two strongest options for our use case are **BLE hold-to-connect** and **mutual QR scan**. No decision yet — could use one for initial connect and another for reconnect, or combine them. Both need prototyping.

#### BLE Hold-to-Connect

1. Both users tap and hold the "Connect" button
2. Both phones begin BLE advertising (broadcasting a signed, short-lived session token) and scanning simultaneously
3. Each phone discovers the other and reads its token
4. RSSI is sampled over several readings and averaged to confirm proximity (threshold: > -50 dBm, roughly within 1-2m)
5. On proximity confirmation, both tokens are sent to the server
6. Server validates both tokens are legitimate, unexpired, and paired
7. Friendship created or refreshed — haptic feedback confirms success
8. Users release the button

**Strengths:**

- Cross-platform (standard BLE protocol works iOS-to-Android)
- The simultaneous hold is intentional, mutual, and physical
- RSSI provides real proximity proof
- Lower friction than QR (no camera, no scanning, just hold)
- The gesture creates a small shared moment
- Only active during the hold — zero battery impact

**Edge cases to solve:**

- **Noisy RSSI:** Average over multiple samples (3-5 readings over 1-2 seconds). Use a generous but meaningful threshold.
- **Crowded spaces:** Server-side token pairing + strongest RSSI match. Each session token is unique.
- **Slow discovery:** The hold gesture naturally accommodates BLE's 1-3 second discovery time. UI shows a pulsing/searching state.
- **No BLE on device:** Need a fallback path.

#### Mutual QR Scan

1. User A's connect screen shows a temporary QR code containing a signed session token
2. User B scans User A's QR code
3. User A scans User B's QR code (or User B confirms on their screen)
4. Server matches the two session tokens, verifies both are valid and unexpired
5. Friendship created or refreshed

**Strengths:**

- Works on every phone with a camera, no hardware dependency
- Well-understood pattern (WeChat, Snapchat, LinkedIn all use it)
- Deterministic — camera scan either works or doesn't (no RSSI noise)
- Session tokens with short expiry (~60 seconds) prevent screenshot sharing

**Weaknesses:**

- More friction (open camera, scan, switch roles)
- Weaker proof-of-presence (QR can be screenshotted, mitigated by expiry)
- Feels more transactional than BLE hold

### Open Questions

- Which method for first-time connect vs. reconnect? Could use QR for initial connect (more ceremony) and BLE for reconnects (fast, familiar).
- Should QR serve as fallback for BLE, or should they be independent flows?
- NFC as a third option on supported devices?
- What RSSI threshold feels right in practice? Needs real-device testing.
- Haptic feedback patterns — different for connect vs. reconnect?

### Security (Both Methods)

- Tokens are signed server-side, single-use, and expire quickly
- Both tokens must be submitted within a short time window
- Server validates the pair before creating/refreshing the friendship
- BLE adds RSSI proximity verification as an additional layer
