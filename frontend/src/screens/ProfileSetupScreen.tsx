import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors, radii } from '../theme/tokens';
import { WizardStepLayout } from '../components/WizardStepLayout';
import { SelectableCard } from '../components/SelectableCard';
import { SelectableChip } from '../components/SelectableChip';
import { ChevronDown, MapPin } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../api/supabase';
import { apiClient } from '../api/client';

// Custom Touch Slider Component (iOS & Android compatible)
const CustomSlider = ({ value, min, max, onChange, unit }: any) => {
  const [sliderWidth, setSliderWidth] = useState(0);

  const handleTouch = (event: any) => {
    const x = event.nativeEvent.locationX;
    if (sliderWidth > 0) {
      const pct = Math.max(0, Math.min(1, x / sliderWidth));
      const val = Math.round(min + pct * (max - min));
      onChange(val);
    }
  };

  return (
    <View style={styles.sliderContainer}>
      <View
        style={styles.sliderTrackBackground}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderStart={handleTouch}
        onResponderMove={handleTouch}
      >
        <View
          style={[
            styles.sliderTrackFill,
            { width: `${((value - min) / (max - min)) * 100}%` },
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            { left: `${((value - min) / (max - min)) * 100}%` },
          ]}
        />
      </View>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabelText}>{min} {unit}</Text>
        <Text style={styles.sliderLabelText}>{max} {unit}</Text>
      </View>
    </View>
  );
};

export function ProfileSetupScreen({ navigation }: any) {
  const { user, loadUserProfile, completeOnboarding, signOut } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // 11 step state matching PDF default values
  const [dob, setDob] = useState('06/13/2005');
  const [gender, setGender] = useState('Female');
  const [weight, setWeight] = useState(46);
  const [height, setHeight] = useState(157);
  const [fitnessLevel, setFitnessLevel] = useState('Beginner');
  const [goals, setGoals] = useState<string[]>(['Build Muscle']);
  const [frequency, setFrequency] = useState('Every day');
  const [location, setLocation] = useState('Pune');
  const [gymTypes, setGymTypes] = useState<string[]>(['Commercial Gym']);
  const [hasHealthCondition, setHasHealthCondition] = useState('No');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [dietaryPref, setDietaryPref] = useState('No Preference');

  const TOTAL_STEPS = 11;

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      signOut();
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      const payload = {
        date_of_birth: dob,
        gender: gender,
        weight_kg: weight,
        height_cm: height,
        fitness_level: fitnessLevel,
        fitness_goal: goals.join(', '),
        training_frequency: frequency,
        location_address: location,
        gym_preference: gymTypes.join(', '),
        has_health_condition: hasHealthCondition === 'Yes',
        health_conditions: selectedConditions,
        dietary_preference: dietaryPref,
        onboarding_completed: true,
      };

      await completeOnboarding(payload);

      try {
        await apiClient.patch('/auth/me', payload);
      } catch (apiErr) {
        console.log('REST API patch fallback');
      }
    } catch (err: any) {
      console.warn('Complete onboarding error:', err);
      await completeOnboarding({ onboarding_completed: true });
    } finally {
      setLoading(false);
    }
  };

  const toggleMultiSelect = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const getStepInfo = () => {
    switch (step) {
      case 1:
        return {
          emoji: '🎂',
          title: 'Date of birth',
          subtitle: 'Used for fitness metrics and age-appropriate training.',
        };
      case 2:
        return {
          emoji: '✨',
          title: 'How do you identify?',
          subtitle: 'Helps personalise workout recommendations.',
        };
      case 3:
        return {
          emoji: '⚖️',
          title: "What's your weight?",
          subtitle: "We'll track your progress over time.",
        };
      case 4:
        return {
          emoji: '📏',
          title: 'How tall are you?',
          subtitle: 'Used for BMI and posture analysis.',
        };
      case 5:
        return {
          emoji: '⚡',
          title: 'Rate your fitness level',
          subtitle: 'Helps us calibrate workout intensity from day one.',
        };
      case 6:
        return {
          emoji: '🎯',
          title: "What's your goal?",
          subtitle: "Pick one or more — we'll build every session around these.",
        };
      case 7:
        return {
          emoji: '📅',
          title: 'Training frequency?',
          subtitle: 'Sets realistic expectations and recovery.',
        };
      case 8:
        return {
          emoji: '📍',
          title: 'Where are you based?',
          subtitle: 'To show the best gyms near you.',
        };
      case 9:
        return {
          emoji: '🏋️',
          title: 'Preferred gym type?',
          subtitle: "Pick one or more — we'll prioritise these in your feed.",
        };
      case 10:
        return {
          emoji: '🩺',
          title: 'Any health conditions?',
          subtitle: 'Helps us keep your workouts safe and effective.',
        };
      case 11:
        return {
          emoji: '🥗',
          title: 'Dietary preference?',
          subtitle: 'Optional — powers your AI nutrition plan.',
        };
      default:
        return { emoji: '✨', title: '', subtitle: '' };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <WizardStepLayout
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      emoji={stepInfo.emoji}
      title={stepInfo.title}
      subtitle={stepInfo.subtitle}
      onBack={handleBack}
      onNext={handleNext}
      nextButtonLabel={step === TOTAL_STEPS ? "Let's Go 🚀" : 'Continue →'}
      loading={loading}
    >
      {/* Step 1: Date of Birth */}
      {step === 1 ? (
        <View style={styles.dateUnderlineWrapper}>
          <TextInput
            value={dob}
            onChangeText={setDob}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={colors.textMuted}
            style={styles.dateTextInput}
          />
          <ChevronDown size={20} color={colors.textSecondary} />
        </View>
      ) : null}

      {/* Step 2: Gender */}
      {step === 2 ? (
        <View style={styles.grid2x2}>
          {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((item) => {
            const isSelected = gender === item;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setGender(item)}
                activeOpacity={0.85}
                style={[
                  styles.pillGridItem,
                  isSelected && styles.pillGridItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.pillGridText,
                    isSelected && styles.pillGridTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Step 3: Weight */}
      {step === 3 ? (
        <View>
          <View style={styles.valueDisplayRow}>
            <Text style={styles.bigValueText}>{weight}</Text>
            <Text style={styles.unitGreenText}>kg</Text>
          </View>
          <CustomSlider
            value={weight}
            min={30}
            max={180}
            unit="kg"
            onChange={setWeight}
          />
        </View>
      ) : null}

      {/* Step 4: Height */}
      {step === 4 ? (
        <View>
          <View style={styles.valueDisplayRow}>
            <Text style={styles.bigValueText}>{height}</Text>
            <Text style={styles.unitGreenText}>cm</Text>
          </View>
          <CustomSlider
            value={height}
            min={120}
            max={220}
            unit="cm"
            onChange={setHeight}
          />
        </View>
      ) : null}

      {/* Step 5: Fitness Level */}
      {step === 5 ? (
        <View>
          {[
            { title: 'Beginner', subtitle: 'Just getting started' },
            { title: 'Intermediate', subtitle: 'Working out regularly' },
            { title: 'Advanced', subtitle: 'Training intensively' },
            { title: 'Athlete', subtitle: 'Competing or elite training' },
          ].map((item) => (
            <SelectableCard
              key={item.title}
              title={item.title}
              subtitle={item.subtitle}
              selected={fitnessLevel === item.title}
              onPress={() => setFitnessLevel(item.title)}
            />
          ))}
        </View>
      ) : null}

      {/* Step 6: Goals */}
      {step === 6 ? (
        <View style={styles.grid2x2}>
          {[
            'Lose Weight',
            'Build Muscle',
            'Improve Endurance',
            'Stay Active',
            'Gain Flexibility',
            'Sports Performance',
          ].map((item) => {
            const isSelected = goals.includes(item);
            return (
              <TouchableOpacity
                key={item}
                onPress={() => toggleMultiSelect(item, goals, setGoals)}
                activeOpacity={0.85}
                style={[
                  styles.pillGridItem,
                  isSelected && styles.pillGridItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.pillGridText,
                    isSelected && styles.pillGridTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Step 7: Training Frequency */}
      {step === 7 ? (
        <View>
          {['1-2 days/week', '3-4 days/week', '5-6 days/week', 'Every day'].map(
            (item) => (
              <SelectableCard
                key={item}
                title={item}
                selected={frequency === item}
                onPress={() => setFrequency(item)}
              />
            )
          )}
        </View>
      ) : null}

      {/* Step 8: Location */}
      {step === 8 ? (
        <View>
          <View style={styles.underlineInputRow}>
            <MapPin size={20} color={colors.accent} style={{ marginRight: 10 }} />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your city"
              placeholderTextColor={colors.textMuted}
              style={styles.locationTextInput}
            />
          </View>
          <TouchableOpacity style={styles.useLocationPill} activeOpacity={0.8}>
            <MapPin size={14} color={colors.accent} />
            <Text style={styles.useLocationText}>Use current location</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Step 9: Preferred Gym Type */}
      {step === 9 ? (
        <View style={styles.grid2x2}>
          {[
            'Commercial Gym',
            'CrossFit Box',
            'Yoga Studio',
            'Boxing Club',
            'Boutique Studio',
            'Any',
          ].map((item) => {
            const isSelected = gymTypes.includes(item);
            return (
              <TouchableOpacity
                key={item}
                onPress={() => toggleMultiSelect(item, gymTypes, setGymTypes)}
                activeOpacity={0.85}
                style={[
                  styles.pillGridItem,
                  isSelected && styles.pillGridItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.pillGridText,
                    isSelected && styles.pillGridTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Step 10: Health Conditions */}
      {step === 10 ? (
        <View>
          <View style={styles.toggleRow}>
            {['Yes', 'No'].map((item) => {
              const isSelected = hasHealthCondition === item;
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    setHasHealthCondition(item);
                    if (item === 'No') setSelectedConditions([]);
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.toggleHalfItem,
                    isSelected && styles.pillGridItemSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillGridText,
                      isSelected && styles.pillGridTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {hasHealthCondition === 'Yes' ? (
            <View style={styles.conditionsWrapSection}>
              <Text style={styles.conditionsLabel}>Select all that apply:</Text>
              <View style={styles.chipWrapContainer}>
                {[
                  'Diabetes',
                  'Hypertension',
                  'Asthma',
                  'Back Pain',
                  'Knee Issues',
                  'Heart Condition',
                  'Joint Pain',
                  'Obesity',
                  'Other',
                ].map((cond) => (
                  <SelectableChip
                    key={cond}
                    label={cond}
                    selected={selectedConditions.includes(cond)}
                    onPress={() =>
                      toggleMultiSelect(
                        cond,
                        selectedConditions,
                        setSelectedConditions
                      )
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Step 11: Dietary Preference */}
      {step === 11 ? (
        <View>
          {[
            'No Preference',
            'Vegetarian',
            'Vegan',
            'Keto',
            'Intermittent Fasting',
            'Gluten-Free',
          ].map((item) => (
            <SelectableCard
              key={item}
              title={item}
              selected={dietaryPref === item}
              onPress={() => setDietaryPref(item)}
            />
          ))}
        </View>
      ) : null}
    </WizardStepLayout>
  );
}

const styles = StyleSheet.create({
  dateUnderlineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accent,
    paddingBottom: 8,
    marginTop: 20,
  },
  dateTextInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pillGridItem: {
    width: '48%',
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pillGridItemSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillGridText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  pillGridTextSelected: {
    color: colors.black,
    fontWeight: '800',
  },
  valueDisplayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: 12,
  },
  bigValueText: {
    color: colors.textPrimary,
    fontSize: 56,
    fontWeight: '900',
  },
  unitGreenText: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 6,
  },
  sliderContainer: {
    marginVertical: 20,
    width: '100%',
  },
  sliderTrackBackground: {
    height: 6,
    backgroundColor: colors.surfaceBorder,
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accent,
    position: 'absolute',
    transform: [{ translateX: -10 }],
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  underlineInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accent,
    paddingBottom: 8,
    marginTop: 16,
  },
  locationTextInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  useLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  useLocationText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleHalfItem: {
    width: '48%',
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionsWrapSection: {
    marginTop: 12,
  },
  conditionsLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  chipWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

