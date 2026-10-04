import { Alert, Linking, Share } from 'react-native';

export const AURA_APEX_WEBSITE_URL = 'https://www.auraapex.in';
export const TERMS_OF_SERVICE_URL = `${AURA_APEX_WEBSITE_URL}/terms-of-service`;

async function openWebsite(url: string, title: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(`Unable to open ${title}`, `Please visit ${url} in your browser.`);
  }
}

export function openAuraApexWebsite() {
  return openWebsite(AURA_APEX_WEBSITE_URL, 'website');
}

export function openTermsOfService() {
  return openWebsite(TERMS_OF_SERVICE_URL, 'terms of service');
}

export async function shareAuraApex() {
  try {
    await Share.share({
      title: 'Aura Apex',
      message: `Explore Aura Apex, a gym management platform: ${AURA_APEX_WEBSITE_URL}`,
    });
  } catch {
    Alert.alert('Unable to share', `You can share this website address: ${AURA_APEX_WEBSITE_URL}`);
  }
}

export async function openSystemAppSettings() {
  try {
    await Linking.openSettings();
  } catch {
    Alert.alert('Unable to open settings', 'Open your device settings and find Aura Apex to manage app permissions and storage.');
  }
}
