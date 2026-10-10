const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const { createRequire } = require('node:module');
const { Script } = require('node:vm');
const ts = require('typescript');

// Execute real TypeScript modules against native-storage mocks. No server or
// native runtime is needed to reproduce logout, account-switch and request races.
function fixture() {
  const root = resolve(__dirname, '..');
  const cache = new Map();
  const storage = new Map();
  const platform = { OS: 'ios', select: (options) => options.ios ?? options.default };
  const mocks = {
    'react-native': { Platform: platform },
    'expo-secure-store': {
      setItemAsync: async (key, value) => { storage.set(key, value); },
      getItemAsync: async (key) => storage.get(key) ?? null,
      deleteItemAsync: async (key) => { storage.delete(key); },
    },
  };
  function load(file) {
    const absolute = resolve(root, file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    if (absolute.endsWith('/src/store/hooks.ts')) return {};
    const module = { exports: {} };
    cache.set(absolute, module);
    const compiled = ts.transpileModule(readFileSync(absolute, 'utf8'), {
      fileName: absolute,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const nativeRequire = createRequire(absolute);
    function localRequire(name) {
      if (mocks[name]) return mocks[name];
      if (name.startsWith('@/') || name.startsWith('.')) {
        const candidate = name.startsWith('@/') ? resolve(root, name.slice(2)) : resolve(dirname(absolute), name);
        for (const suffix of ['', '.ts', '.tsx']) {
          if (existsSync(candidate + suffix) && /\.tsx?$/.test(candidate + suffix)) return load(candidate + suffix);
        }
      }
      return nativeRequire(name);
    }
    const run = new Script(`(function(require,module,exports,__filename,__dirname){${compiled}\n})`, { filename: absolute }).runInThisContext();
    run(localRequire, module, module.exports, absolute, dirname(absolute));
    return module.exports;
  }
  return { load, storage };
}

test('saving a session requires an explicit biometric opt-in; disabling removes its token', async () => {
  const { load, storage } = fixture();
  const auth = load('src/storage/auth.storage.ts');
  await auth.saveAccessToken('test-active');
  await auth.saveBiometricSession({ email: 'test@example.com', token: 'test-backup' });
  assert.equal(await auth.getBiometricUnlockEnabled(), false);
  await auth.saveBiometricUnlockEnabled(true);
  await auth.clearBiometricSession();
  assert.equal(await auth.getBiometricSession(), null);
  assert.equal(await auth.getBiometricUnlockEnabled(), false);
  assert.equal(await auth.getAccessToken(), 'test-active');
  assert.equal(storage.has('biometric_saved_session'), false);
});

test('logout removes active and saved credentials', async () => {
  const { load } = fixture();
  const auth = load('src/storage/auth.storage.ts');
  await auth.saveAccessToken('test-active');
  await auth.saveBiometricSession({ email: 'test@example.com', token: 'test-backup' });
  await auth.saveBiometricUnlockEnabled(true);
  await auth.removeAccessToken();
  assert.equal(await auth.getAccessToken(), null);
  assert.equal(await auth.getBiometricSession(), null);
  assert.equal(await auth.getBiometricUnlockEnabled(), false);
});

test('server explanations survive Axios errors, while authenticated 401s expire sessions', () => {
  const { load } = fixture();
  const { getApiErrorMessage } = load('src/utils/api-error.ts');
  const { AxiosError } = require('axios');
  const config = { headers: {} };
  const response = { status: 403, data: { message: 'Limit reached for this plan.' }, config };
  assert.equal(getApiErrorMessage(new AxiosError('Request failed with status code 403', undefined, config, undefined, response)), 'Limit reached for this plan.');
  response.status = 401; response.data.message = 'Incorrect password.';
  assert.equal(getApiErrorMessage(new AxiosError('Request failed', undefined, config, undefined, response)), 'Incorrect password.');
  config.headers.Authorization = 'Bearer test';
  assert.match(getApiErrorMessage(new AxiosError('Request failed', undefined, config, undefined, response)), /session has expired/);
  assert.equal(getApiErrorMessage({ status: 401, isUnauthorized: false, message: 'Incorrect OTP.' }), 'Incorrect OTP.');
});

test('logout and account switching clear all private caches and ignore old completions', () => {
  const { load } = fixture();
  const { store } = load('src/store/store.ts');
  const { setSessionUser, clearSession, hydrateSession } = load('src/store/session.slice.ts');
  const { addLegacyItem, refreshVaultData } = load('src/store/vault.slice.ts');
  const { setSubscriptionData, fetchSubscription } = load('src/store/subscription.slice.ts');
  const paid = { plan: { code: 'FAMILY' }, effectivePlanCode: 'FAMILY', purchaseVerification: 'VERIFIED', subscription: { status: 'ACTIVE' }, entitlements: { CUSTOM_CHECK_IN: true }, limits: { TRUSTED_PERSONS: 8 } };
  const userA = { id: 'A', email: 'a@example.com' };
  const userB = { id: 'B', email: 'b@example.com' };
  store.dispatch(setSessionUser(userA));
  store.dispatch(addLegacyItem({ id: 'item-A', title: 'Private' }));
  store.dispatch(setSubscriptionData(paid));
  store.dispatch(fetchSubscription.pending('old-subscription'));
  store.dispatch(refreshVaultData.pending('old-vault'));
  store.dispatch(hydrateSession.pending('old-user'));
  store.dispatch(clearSession());
  store.dispatch(setSessionUser(userB));
  store.dispatch(fetchSubscription.fulfilled(paid, 'old-subscription'));
  store.dispatch(refreshVaultData.fulfilled({ items: [{ id: 'item-A' }], recipients: [], issues: [], checkIn: null, releasePolicy: null }, 'old-vault'));
  store.dispatch(hydrateSession.fulfilled(userA, 'old-user'));
  assert.equal(store.getState().session.user.id, 'B');
  assert.equal(store.getState().subscription.effectivePlanCode, 'STARTER');
  assert.equal(store.getState().subscription.limits.TRUSTED_PERSONS, 1);
  assert.equal(store.getState().vault.items.length, 0);
  store.dispatch(addLegacyItem({ id: 'item-B' }));
  store.dispatch(setSubscriptionData(paid));
  store.dispatch(setSessionUser(userA));
  assert.equal(store.getState().vault.items.length, 0);
  assert.equal(store.getState().subscription.effectivePlanCode, 'STARTER');
});

test('an older subscription response cannot overwrite the newer account request', () => {
  const { load } = fixture();
  const { store } = load('src/store/store.ts');
  const { fetchSubscription } = load('src/store/subscription.slice.ts');
  store.dispatch(fetchSubscription.pending('older'));
  store.dispatch(fetchSubscription.pending('newer'));
  store.dispatch(fetchSubscription.fulfilled({ plan: { code: 'STARTER' }, effectivePlanCode: 'STARTER', purchaseVerification: 'NOT_REQUIRED', subscription: null, entitlements: {}, limits: {} }, 'newer'));
  store.dispatch(fetchSubscription.fulfilled({ plan: { code: 'FAMILY' }, entitlements: { CUSTOM_CHECK_IN: true }, limits: { TRUSTED_PERSONS: 8 } }, 'older'));
  assert.equal(store.getState().subscription.plan.code, 'STARTER');
  assert.equal(store.getState().subscription.entitlements.CUSTOM_CHECK_IN, false);
});

test('late authenticated successes and failures cannot affect a replacement session', async () => {
  const { load } = fixture();
  const auth = load('src/storage/auth.storage.ts');
  const { api, onSessionExpired } = load('src/api/client.ts');
  const { AxiosError } = require('axios');
  let expireCount = 0;
  onSessionExpired(() => { expireCount += 1; });
  await auth.saveAccessToken('old-token');
  let finish, started;
  const startedRequest = new Promise((resolve) => { started = resolve; });
  api.defaults.adapter = (config) => new Promise((resolve) => {
    finish = () => resolve({ config, status: 200, statusText: 'OK', headers: {}, data: { owner: 'old' } });
    started();
  });
  const result = api.get('/users/me').then(() => 'accepted', (reason) => reason.code);
  await startedRequest;
  await auth.saveAccessToken('new-token');
  finish();
  assert.equal(await result, 'ERR_CANCELED');
  const onError = api.interceptors.response.handlers[0].rejected;
  const unauthorized = (token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    return new AxiosError('Unauthorized', undefined, config, undefined, { status: 401, data: {}, config });
  };
  await assert.rejects(onError(unauthorized('old-token')));
  assert.equal(expireCount, 0);
  await assert.rejects(onError(unauthorized('new-token')));
  assert.equal(expireCount, 1);
});

test('paid checkout cannot manufacture purchase tokens in development', async () => {
  const { load } = fixture();
  const { PurchaseService } = load('src/services/purchase.service.ts');
  await assert.rejects(PurchaseService.purchasePlan('FAMILY'), /not available yet/);
});

test('saved-file downloads match the API route and preserve bytes and cancellation', async () => {
  const { load } = fixture();
  const { api } = load('src/api/client.ts');
  const { downloadLegacyItem } = load('src/api/vault.api.ts');
  const controllerPath = resolve(__dirname, '../../virasat-server/src/legacy-items/legacy-items.controller.ts');
  const controller = ts.createSourceFile(controllerPath, readFileSync(controllerPath, 'utf8'), ts.ScriptTarget.Latest, true);
  const controllerClass = controller.statements.find(ts.isClassDeclaration);
  const handler = controllerClass.members.find((member) => member.name?.getText(controller) === 'downloadFile');
  const getDecorator = ts.getDecorators(handler).find((decorator) => decorator.expression.expression?.getText(controller) === 'Get');
  const route = getDecorator.expression.arguments[0].text;
  const bytes = Uint8Array.from([0, 127, 255]).buffer;
  const abortController = new AbortController();
  api.defaults.adapter = async (config) => {
    assert.equal(config.method, 'get');
    assert.equal(config.url, `/vault/items/${route.replace(':id', 'saved-file')}`);
    assert.equal(config.responseType, 'arraybuffer');
    assert.equal(config.signal, abortController.signal);
    return { config, status: 200, statusText: 'OK', headers: {}, data: bytes };
  };
  assert.equal(await downloadLegacyItem('saved-file', abortController.signal), bytes);
});

test('patched UUID dependency preserves Xcode project identifier generation', () => {
  const project = require('xcode').project('/tmp/unused-security-test.pbxproj');
  project.hash = { project: { objects: {} } };
  const identifiers = new Set(Array.from({ length: 50 }, () => project.generateUuid()));
  assert.equal(identifiers.size, 50);
  for (const id of identifiers) assert.match(id, /^[0-9A-F]{24}$/);
});

test('Expo query-string uses the patched decoder for valid and hostile URL input', { timeout: 2000 }, () => {
  const queryString = require('query-string');
  assert.equal(queryString.parse('email=owner%40example.com').email, 'owner@example.com');
  assert.equal(queryString.parse('name=%E0%A4%B5%E0%A4%BF%E0%A4%B0%E0%A4%BE%E0%A4%B8%E0%A4%A4').name, 'विरासत');
  assert.equal(queryString.parse('name=%F0%9F%92%9A').name, '💚');
  assert.equal(queryString.parse('name=hello+world').name, 'hello world');
  const hostile = '%C0%AF'.repeat(5000);
  assert.equal(queryString.parse(`malformed=${hostile}`).malformed, hostile);
  assert.equal(queryString.parse('mode=reset&email=owner%40example.com').mode, 'reset');
});
