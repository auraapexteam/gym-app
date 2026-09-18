import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Search, SlidersHorizontal, Sun, Moon, X } from 'lucide-react-native';
import { colors, radii } from '../theme/tokens';
import { useTheme } from '../context/ThemeContext';
import { GymCard, GymCardData } from '../components/GymCard';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

const CATEGORIES = ['All', 'Gym', 'CrossFit', 'Yoga', 'Boxing', 'Pilates'];
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';

export function ExploreScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark, setTheme } = useTheme();
  const { userProfile } = useAuthStore();
  const [gyms, setGyms] = useState<GymCardData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGym, setSelectedGym] = useState<GymCardData | null>(null);
  const [fetchingGyms, setFetchingGyms] = useState(false);

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0) + 8;

  const fetchBackendGyms = useCallback(async () => {
    try {
      setFetchingGyms(true);
      const res = await apiClient.get('/gyms/directory');
      const rawData = res.data?.data;
      const gymList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : Array.isArray(res.data)
        ? res.data
        : [];

      if (gymList.length > 0) {
        const fetched = gymList.map((item: any, idx: number) => ({
          id: item.id || `gym-${idx}`,
          name: item.name || 'Partner Gym',
          rating: item.rating || 4.8,
          distance: item.address || item.location || (userProfile?.location_address ? `Near ${userProfile.location_address}` : 'Nearby'),
          monthlyPrice: item.monthly_price || item.price || 999,
          imageUrl: item.logoUrl || item.logo_url || DEFAULT_IMAGE,
          tags: ['Gym', 'Fitness', ...(item.weeklyOff ? [`Off: ${item.weeklyOff.join(', ')}`] : [])],
          isOpen: item.status ? item.status === 'active' : true,
        }));
        setGyms(fetched);
      } else {
        setGyms([]);
      }
    } catch (e) {
      console.warn('Error fetching gyms in ExploreScreen:', e);
      setGyms([]);
    } finally {
      setFetchingGyms(false);
    }
  }, [userProfile?.location_address]);

  useFocusEffect(
    useCallback(() => {
      fetchBackendGyms();
    }, [fetchBackendGyms])
  );

  const filteredGyms = gyms.filter((gym) => {
    const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      selectedCategory === 'Gym' ||
      gym.tags?.some((t) => t.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.bg : '#F5F5F0', paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.topHeader}>
        <Text style={[styles.headerTitle, { color: isDark ? colors.white : colors.black }]}>
          Explore
        </Text>
        <TouchableOpacity
          onPress={() => setTheme(isDark ? 'light' : 'dark')}
          style={[
            styles.circleBtn,
            {
              backgroundColor: isDark ? themeColors.surface : '#E5E7EB',
              borderColor: themeColors.surfaceBorder,
            },
          ]}
          activeOpacity={0.8}
        >
          {isDark ? (
            <Sun size={18} color={colors.white} />
          ) : (
            <Moon size={18} color={colors.black} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar & Green Filter Button */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? themeColors.surface : '#FFFFFF',
                borderColor: themeColors.surfaceBorder,
              },
            ]}
          >
            <Search size={18} color={isDark ? themeColors.textMuted : '#6B7280'} style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search gyms, trainers..."
              placeholderTextColor={isDark ? themeColors.textMuted : '#9CA3AF'}
              style={[styles.searchInput, { color: isDark ? themeColors.textPrimary : '#111827' }]}
            />
          </View>

          <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
            <SlidersHorizontal size={20} color={colors.black} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isDark ? themeColors.surface : '#E5E7EB',
                    borderColor: themeColors.surfaceBorder,
                  },
                  isSelected && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: isDark ? themeColors.textPrimary : '#111827' },
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Vertical Gym List Cards */}
        {fetchingGyms ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <View style={styles.gymList}>
            {filteredGyms.map((gym) => (
              <GymCard
                key={gym.id}
                gym={gym}
                variant="vertical"
                onPress={() => setSelectedGym(gym)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Gym Detail Modal */}
      {selectedGym ? (
        <Modal visible animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.dismissOverlay}
              onPress={() => setSelectedGym(null)}
            />
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedGym.name}</Text>
                <TouchableOpacity onPress={() => setSelectedGym(null)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSub}>
                Monthly Pass · ₹{selectedGym.monthlyPrice}/month
              </Text>

              <TouchableOpacity
                onPress={() => {
                  const gym = selectedGym;
                  setSelectedGym(null);
                  navigation.navigate('GymInfo', { gym });
                }}
                style={styles.bookCTA}
                activeOpacity={0.85}
              >
                <Text style={styles.bookCTAText}>View Gym Details & Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 16,
    height: 50,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryScroll: {
    paddingBottom: 16,
  },
  categoryPill: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoryTextActive: {
    color: colors.black,
    fontWeight: '800',
  },
  loaderCenter: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  gymList: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '700',
    marginBottom: 20,
  },
  bookCTA: {
    backgroundColor: colors.accent,
    borderRadius: radii.xl,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCTAText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.black,
  },
});

