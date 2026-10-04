import { Alert, Linking, Share } from 'react-native';
import {
  AURA_APEX_WEBSITE_URL,
  TERMS_OF_SERVICE_URL,
  openAuraApexWebsite,
  openTermsOfService,
  shareAuraApex,
  openSystemAppSettings,
} from '../src/utils/settingsActions';

beforeEach(() => jest.spyOn(Alert, 'alert').mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

test.each([
  [openAuraApexWebsite, AURA_APEX_WEBSITE_URL],
  [openTermsOfService, TERMS_OF_SERVICE_URL],
] as const)('opens the published destination and gives a browser fallback on failure', async (open, url) => {
  const launch = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await open();
  expect(launch).toHaveBeenCalledWith(url);
  expect(Alert.alert).not.toHaveBeenCalled();

  launch.mockRejectedValue(new Error('No browser'));
  await open();
  expect(Alert.alert).toHaveBeenCalledWith(expect.stringContaining('Unable to open'), expect.stringContaining(url));
});

test.each([Share.sharedAction, Share.dismissedAction])('shares a real website and handles %s without a fake success alert', async (action) => {
  jest.spyOn(Share, 'share').mockResolvedValue({ action });
  await shareAuraApex();
  expect(Share.share).toHaveBeenCalledWith({
    title: 'Aura Apex',
    message: `Explore Aura Apex, a gym management platform: ${AURA_APEX_WEBSITE_URL}`,
  });
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('provides the real URL when native sharing fails', async () => {
  jest.spyOn(Share, 'share').mockRejectedValue(new Error('Unavailable'));
  await shareAuraApex();
  expect(Alert.alert).toHaveBeenCalledWith('Unable to share', expect.stringContaining(AURA_APEX_WEBSITE_URL));
});

test('provides device settings guidance if the settings launch fails', async () => {
  jest.spyOn(Linking, 'openSettings').mockRejectedValue(new Error('Unavailable'));
  await openSystemAppSettings();
  expect(Alert.alert).toHaveBeenCalledWith('Unable to open settings', expect.stringContaining('Aura Apex'));
});
