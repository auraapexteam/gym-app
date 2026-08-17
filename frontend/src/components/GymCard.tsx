import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/tokens';
import { Star, MapPin, Heart } from 'lucide-react-native';
import { useGymStore } from '../store/useGymStore';

export interface GymCardData {
  id: string;
  name: string;
  rating?: number;
  distance?: string;
  monthlyPrice?: number | string;
  imageUrl?: string;
  tags?: string[];
  isOpen?: boolean;
}

interface GymCardProps {
  gym: GymCardData;
  onPress?: () => void;
  variant?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}

const DEFAULT_GYM_IMAGE =
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80';

export function GymCard({ gym, onPress, variant = 'vertical', style }: GymCardProps) {
  const isHorizontal = variant === 'horizontal';
  const { savedGymIds, toggleBookmarkGym } = useGymStore();
  const isBookmarked = savedGymIds.includes(gym.id);

  const handleToggleBookmark = (e: any) => {
    e?.stopPropagation?.();
    toggleBookmarkGym(gym.id);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        isHorizontal ? styles.horizontalCard : styles.verticalCard,
        style,
      ]}
    >
      <View style={isHorizontal ? styles.horizImageWrapper : styles.vertImageWrapper}>
        <Image
          source={{ uri: gym.imageUrl || DEFAULT_GYM_IMAGE }}
          style={styles.image}
          resizeMode="cover"
        />
        {gym.isOpen !== false ? (
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>OPEN</Text>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={handleToggleBookmark}
          style={styles.bookmarkBtn}
          activeOpacity={0.8}
        >
          <Heart
            size={14}
            color={isBookmarked ? colors.danger : colors.white}
            fill={isBookmarked ? colors.danger : 'none'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.nameText} numberOfLines={1}>
          {gym.name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.metaText}>{gym.rating || 4.8}</Text>
          </View>

          <View style={[styles.metaItem, { marginLeft: 8 }]}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{gym.distance || '0.8 km'}</Text>
          </View>

          {!isHorizontal && gym.monthlyPrice ? (
            <Text style={styles.priceTextRight}>₹{gym.monthlyPrice}/mo</Text>
          ) : null}
        </View>

        {gym.tags && gym.tags.length > 0 && !isHorizontal ? (
          <View style={styles.tagRow}>
            {gym.tags.map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {isHorizontal && gym.monthlyPrice ? (
          <Text style={styles.horizPriceText}>₹{gym.monthlyPrice}/mo</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  horizontalCard: {
    width: 200,
    marginRight: 14,
  },
  verticalCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  horizImageWrapper: {
    height: 110,
    width: '100%',
  },
  vertImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  openBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  openBadgeText: {
    color: colors.black,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 10,
  },
  nameText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginLeft: 3,
    fontWeight: '600',
  },
  priceTextRight: {
    marginLeft: 'auto',
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  horizPriceText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  tagChip: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginTop: 2,
  },
  tagChipText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
});
