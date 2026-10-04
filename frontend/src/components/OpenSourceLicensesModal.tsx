import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import notices from '../assets/third-party-notices.json';

type PackageNotice = typeof notices.packages[number];

export function OpenSourceLicensesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<PackageNotice | null>(null);
  const close = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderColor: colors.border }]}>
          {selected && (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to license list" onPress={() => setSelected(null)} style={styles.headerButton}>
              <Text style={[styles.buttonText, { color: colors.primary }]}>Back</Text>
            </TouchableOpacity>
          )}
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Open source licenses</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close licenses" onPress={close} style={styles.headerButton}>
            <Text style={[styles.buttonText, { color: colors.primary }]}>Close</Text>
          </TouchableOpacity>
        </View>
        {selected ? (
          <ScrollView contentContainerStyle={styles.content}>
            <Text selectable style={[styles.packageTitle, { color: colors.foreground }]}>{selected.name} {selected.version}</Text>
            <Text selectable style={[styles.description, { color: colors.mutedForeground }]}>Declared license: {selected.declaredLicense}</Text>
            <Text selectable style={[styles.description, { color: colors.mutedForeground }]}>Source: {selected.location}</Text>
            {selected.files.length === 0 && (
              <Text style={[styles.licenseText, { color: colors.foreground }]}>This installed package does not include a license or notice file in the locations covered by this list. The declared license above is package metadata, not the full license text.</Text>
            )}
            {selected.files.map((file) => (
              <View key={file.file} style={styles.file}>
                <Text selectable style={[styles.packageTitle, { color: colors.foreground }]}>{file.file}</Text>
                <Text selectable style={[styles.licenseText, { color: colors.foreground }]}>{file.text}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={notices.packages}
            keyExtractor={(item) => item.location}
            contentContainerStyle={styles.content}
            ListHeaderComponent={<Text style={[styles.description, { color: colors.mutedForeground }]}>{notices.coverage}</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${item.name} ${item.version} license`}
                onPress={() => setSelected(item)}
                style={[styles.packageRow, { borderColor: colors.border }]}
              >
                <Text style={[styles.packageTitle, { color: colors.foreground }]}>{item.name} {item.version}</Text>
                <Text style={[styles.description, { color: colors.mutedForeground }]}>{item.declaredLicense} · {item.files.length ? 'License / notice text' : 'Metadata only'}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: 12 },
  headerButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  buttonText: { fontSize: 15, fontWeight: '700' },
  title: { flex: 1, fontSize: 18, fontWeight: '800', paddingVertical: 12, paddingHorizontal: 8 },
  content: { padding: 20, paddingBottom: 40 },
  description: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  packageRow: { paddingVertical: 14, borderBottomWidth: 1 },
  packageTitle: { fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: 6 },
  file: { marginTop: 20 },
  licenseText: { fontSize: 14, lineHeight: 22 },
});
