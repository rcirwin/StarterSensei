import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { Starter } from '../types';
import { colors } from '../theme/colors';

interface StarterCardProps {
  starter: Starter;
  onPress: () => void;
  onLongPress: () => void;
}

const formatTimeAgo = (date: Date | string | undefined): string => {
  if (!date) return 'Never fed';
  
  // Convert to Date object if it's a string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Never fed';
  }
  
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
    return `Fed ${diffInMinutes} minutes ago`;
  } else if (diffInHours === 1) {
    return 'Fed 1 hour ago';
  } else {
    return `Fed ${diffInHours} hours ago`;
  }
};

const getHealthChipStyle = (status: Starter['healthStatus']) => {
  switch (status) {
    case 'healthy':
      return {
        backgroundColor: colors.healthyBg,
        textColor: colors.healthyText,
      };
    case 'attention':
      return {
        backgroundColor: colors.warningBg,
        textColor: colors.warningText,
      };
    case 'unhealthy':
      return {
        backgroundColor: colors.errorBg,
        textColor: colors.errorText,
      };
  }
};

const getHealthChipLabel = (status: Starter['healthStatus']) => {
  switch (status) {
    case 'healthy':
      return 'Healthy';
    case 'attention':
      return 'Attention';
    case 'unhealthy':
      return 'Unhealthy';
  }
};

// Mock temperature data - in real app this would come from last feeding
const getTemperature = (starterId: string): number => {
  const temps = { '1': 22, '2': 24, '3': 23 };
  return temps[starterId as keyof typeof temps] || 22;
};

export const StarterCard: React.FC<StarterCardProps> = ({ 
  starter, 
  onPress, 
  onLongPress 
}) => {
  const chipStyle = getHealthChipStyle(starter.healthStatus);
  const temperature = getTemperature(starter.id);
  
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.topSection}>
            <View style={styles.thumbnailContainer}>
              {starter.imageUri ? (
                <Image 
                  source={{ uri: starter.imageUri }} 
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderThumbnail}>
                  <Icon name="coffee" size={24} color={colors.secondary} />
                </View>
              )}
            </View>
            
            <View style={styles.infoSection}>
              <View style={styles.headerRow}>
                <Text style={styles.starterName} numberOfLines={1}>
                  {starter.name}
                </Text>
                <Chip
                  style={[styles.healthChip, { backgroundColor: chipStyle.backgroundColor }]}
                  textStyle={[styles.healthChipText, { color: chipStyle.textColor }]}
                >
                  {getHealthChipLabel(starter.healthStatus)}
                </Chip>
              </View>
              
              <Text style={styles.starterDetails}>
                {starter.flourType} • {starter.hydrationPct}% hydration
              </Text>
              
              {starter.lastFedAt && (
                <View style={styles.timeRow}>
                  <Icon name="clock" size={12} color={colors.disabled} />
                  <Text style={styles.timeText}>
                    {formatTimeAgo(starter.lastFedAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.bottomSection}>
            <View style={styles.metaInfo}>
              <Text style={styles.metaText}>{starter.defaultRatio} ratio</Text>
              <Text style={styles.metaText}>{temperature}°C</Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.primary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginVertical: 8,
    elevation: 1,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    padding: 16,
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumbnailContainer: {
    marginRight: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  placeholderThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    minHeight: 28,
  },
  starterName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    flex: 1,
    marginRight: 8,
    fontFamily: 'Montserrat_600SemiBold',
    lineHeight: 24,
  },
  healthChip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthChipText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 14,
  },
  starterDetails: {
    fontSize: 14,
    color: colors.disabled,
    marginBottom: 4,
    fontFamily: 'Poppins_400Regular',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: colors.disabled,
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: colors.disabled,
    fontFamily: 'Poppins_400Regular',
  },
}); 