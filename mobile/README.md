# Overview

As a software engineer I want to learn how to build a real cross-platform mobile app: several connected screens,
state that survives restarts, and native device features. I chose a problem I actually have, which is ordering
for a sushi restaurant whose real ordering channel is WhatsApp.

**Sushi Order** is a React Native + Expo app written in TypeScript that runs on Android and iOS. Customers:

1. Get the **nearest branch selected automatically** using the phone's location, or pick one from a list if
   location permission is denied.
2. **Browse the menu**, which only shows the products that branch carries.
3. **Customize items** with single-choice options (size, protein, heat level) and multi-choice extras with a limit,
   each with its own price change, and choose a quantity.
4. **Manage a cart**: change quantities, remove items, and see the subtotal. The cart is saved on the device, so it
   is still there after the app is closed. If you switch to a branch that doesn't carry some items, the app lists
   them and asks before removing them.
5. **Send the order** to the branch as a pre-filled WhatsApp message (items, options, total, name and notes). A
   "Copy order text" button is a fallback when WhatsApp can't be opened.

Orders are not stored on a server and there are no accounts. **New in Module 3:** the catalog (branches,
categories, products, options and per-branch availability) is read live from **Google Cloud Firestore** with
`onSnapshot` listeners, so when staff change a price or switch a product or option off in the staff panel
(`../panel`), the Menu, Product and Cart screens update right away without a new app release. The last catalog
received is saved on the device; if Firestore can't be reached the app shows that saved copy, or the bundled
sample `src/data/catalog.json` on first launch, and a small "Offline" note on the Menu.

My purpose was to learn how navigation, state management with `useReducer` + Context, on-device storage, location
permissions and deep linking work in React Native, and how they behave differently on Android and iOS.

[Software Demo Video](https://www.loom.com/share/0b62006df41241bd90d7ca9e79aca25a)

# Development Environment

- **Tools:** Claude Code (AI coding assistant), Git and GitHub
- **Language:** TypeScript
- **Framework:** React Native 0.86 with Expo SDK 57
- **Testing on devices:** Expo Go on a physical phone, and the iOS Simulator
- **Libraries:**
  - `expo-router`: file-based navigation built on React Navigation's native stack
  - `@react-native-async-storage/async-storage`: saves the cart on the device
  - `expo-location`: location permission and current position
  - `expo-clipboard`: "Copy order text" fallback
  - `firebase` (JS SDK, modular API): reads the catalog from Cloud Firestore in real time
  - `react-native-safe-area-context`: layout around notches and home indicators
  - Jest (`jest-expo` preset) for unit tests, ESLint and Prettier for code quality

## Running the app

Copy `.env.example` to `.env`. By default it points at the local Firebase Emulator (project `demo-sushi`,
started from the repo root with `npm run emulators` and seeded with `npm run seed`). On a **physical phone** set
`EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` to your computer's LAN IP (same Wi-Fi). For a real Firebase project, leave
the emulator host empty and fill in the web app config values.

```bash
npm install
npx expo start        # scan the QR code with Expo Go (Android) or the Camera app (iOS)
npm test              # unit tests
npm run typecheck     # TypeScript check
npm run lint          # ESLint
```

WhatsApp isn't available on simulators; there the order link opens the wa.me web page. To fake a location on the iOS
Simulator: `xcrun simctl location booted set 40.2338,-111.6585` (near the Provo branch).

## How the code is organized

```
src/
  app/                  # screens (Expo Router: every file is a route)
    _layout.tsx         # stack navigator + Cart/Location providers
    index.tsx           # Menu
    product/[id].tsx    # Product detail
    cart.tsx            # Cart
    summary.tsx         # Order summary + WhatsApp
    branch.tsx          # Branch picker (modal)
  components/           # Button, QuantityStepper, OptionGroupPicker, BranchBar, CartBar
  data/catalog.json     # bundled sample catalog: offline fallback on first launch
  lib/                  # pure logic: catalog lookups, pricing, distance (haversine), WhatsApp message
    firebase.ts         # Firebase app + Firestore (connects to the emulator when configured)
    catalogSource.ts    # onSnapshot listeners that combine Firestore documents into a Catalog
  state/                # CatalogContext (live/cached/bundled catalog), cartReducer, CartContext, LocationContext
  types/catalog.ts      # TypeScript types for the catalog
  theme.ts              # colors (light/dark), spacing, radius, font sizes
```

Money is stored as integer cents to avoid floating-point rounding. Cart lines store only product and option ids;
names and prices are looked up from the catalog when the cart is displayed.

# Useful Websites

- [Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/)
- [Using Firebase with Expo](https://docs.expo.dev/guides/using-firebase/)
- [Cloud Firestore: get realtime updates](https://firebase.google.com/docs/firestore/query-data/listen)
- [Expo Router introduction](https://docs.expo.dev/router/introduction/)
- [React Navigation documentation](https://reactnavigation.org/docs/getting-started)
- [Expo Location API](https://docs.expo.dev/versions/v57.0.0/sdk/location/)
- [AsyncStorage documentation](https://react-native-async-storage.github.io/async-storage/)
- [React `useReducer` reference](https://react.dev/reference/react/useReducer)
- [TypeScript handbook](https://www.typescriptlang.org/docs/)
- [Jest getting started](https://jestjs.io/docs/getting-started)
- [Haversine formula (Wikipedia)](https://en.wikipedia.org/wiki/Haversine_formula)

# Future Work

Out of scope for this version, kept here so they don't creep into the current build:

- Delivery-cost calculation
- Payments
- User accounts
- Product photos instead of emoji
- Opening-hours check that warns when a branch is closed
