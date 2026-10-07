import React from 'react';
import { Alert, Switch } from 'react-native';
import Renderer, { act } from 'react-test-renderer';
import { ProfileSetupScreen } from '../src/screens/ProfileSetupScreen';
import { WizardStepLayout } from '../src/components/WizardStepLayout';

const mockCompleteOnboarding = jest.fn();
jest.mock('../src/store/useAuthStore', () => ({ useAuthStore: () => ({
  userProfile: { weight_kg: 70, fitness_level: 'Beginner', gender: 'Female' },
  completeOnboarding: mockCompleteOnboarding, signOut: jest.fn(),
}) }));
jest.mock('../src/components/WizardStepLayout', () => ({ WizardStepLayout: (props: any) =>
  require('react').createElement('WizardStepLayout', props, props.children) }));

let tree: Renderer.ReactTestRenderer | undefined;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockCompleteOnboarding.mockResolvedValue(undefined);
});
afterEach(() => { if (tree) act(() => tree!.unmount()); tree = undefined; jest.restoreAllMocks(); });

async function finalStep() {
  await act(async () => { tree = Renderer.create(<ProfileSetupScreen navigation={{ canGoBack: () => false }} />); });
  for (let index = 1; index < 11; index++) act(() => tree!.root.findByType(WizardStepLayout).props.onNext());
  expect(tree!.root.findByType(WizardStepLayout).props.currentStep).toBe(11);
  expect(tree!.root.findByType(Switch).props.value).toBe(false);
}

test('declining optional collection finishes setup with no selected profile or fitness values', async () => {
  await finalStep();
  const skip = tree!.root.findByProps({ accessibilityLabel: 'Continue without optional information' });
  await act(async () => { skip.props.onPress(); });
  expect(mockCompleteOnboarding).toHaveBeenCalledTimes(1);
  const payload = mockCompleteOnboarding.mock.calls[0][0];
  expect(payload).toMatchObject({ onboarding_completed: true, healthDataConsent: false,
    weight_kg: null, height_cm: null, gender: null, date_of_birth: null, fitness_level: null,
    fitness_goal: null, training_frequency: null, location_address: null, gym_preference: null,
    has_health_condition: null, health_conditions: [], dietary_preference: null });
});

test('a failed consent-free save can be retried without selecting consent or losing the entered values', async () => {
  await finalStep();
  mockCompleteOnboarding.mockRejectedValueOnce(new Error('Offline'));
  const skip = () => tree!.root.findByProps({ accessibilityLabel: 'Continue without optional information' });
  await act(async () => { skip().props.onPress(); });
  expect(Alert.alert).toHaveBeenCalledWith('Profile not saved', 'Offline');
  expect(tree!.root.findByType(WizardStepLayout).props.currentStep).toBe(11);
  expect(tree!.root.findByType(Switch).props.value).toBe(false);
  await act(async () => { skip().props.onPress(); });
  expect(mockCompleteOnboarding.mock.calls.map(call => call[0].healthDataConsent)).toEqual([false, false]);
});

test('the save-with-information action still requires a deliberate consent choice', async () => {
  await finalStep();
  await act(async () => { tree!.root.findByType(WizardStepLayout).props.onNext(); });
  expect(mockCompleteOnboarding).not.toHaveBeenCalled();
  expect(Alert.alert).toHaveBeenCalledWith('Profile not saved', expect.stringContaining('consent'));
  act(() => tree!.root.findByType(Switch).props.onValueChange(true));
  await act(async () => { tree!.root.findByType(WizardStepLayout).props.onNext(); });
  expect(mockCompleteOnboarding).toHaveBeenCalledWith(expect.objectContaining({
    healthDataConsent: true, weight_kg: 70, fitness_level: 'Beginner', gender: 'Female', onboarding_completed: true,
  }));
});
