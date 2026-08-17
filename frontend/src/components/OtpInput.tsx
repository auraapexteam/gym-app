import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, radii } from '../theme/tokens';

interface OtpInputProps {
  length?: number;
  onCodeFilled?: (code: string) => void;
  onCodeChange?: (code: string) => void;
}

export function OtpInput({ length = 6, onCodeFilled, onCodeChange }: OtpInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const fullCode = code.join('');
    if (onCodeChange) onCodeChange(fullCode);
    if (fullCode.length === length && onCodeFilled) {
      onCodeFilled(fullCode);
    }
  }, [code, length, onCodeChange, onCodeFilled]);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newCode = [...code];

    if (cleaned.length > 1) {
      // Pasted code
      const pasted = cleaned.slice(0, length).split('');
      for (let i = 0; i < length; i++) {
        newCode[i] = pasted[i] || '';
      }
      setCode(newCode);
      const nextFocus = Math.min(pasted.length, length - 1);
      inputsRef.current[nextFocus]?.focus();
      return;
    }

    newCode[index] = cleaned;
    setCode(newCode);

    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array(length)
        .fill(0)
        .map((_, index) => {
          const isFocused = focusedIndex === index;
          const isFilled = !!code[index];
          return (
            <TextInput
              key={index}
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              style={[
                styles.box,
                (isFocused || isFilled) && styles.activeBox,
              ]}
              keyboardType="number-pad"
              maxLength={1}
              value={code[index]}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              selectTextOnFocus
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  box: {
    width: 48,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  activeBox: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
});
