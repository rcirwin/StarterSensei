import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Appbar,
  Chip,
  Card,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import { useStarterStore } from '../store/starterStore';
import { colors } from '../theme/colors';
import { Starter, Feeding, PhotoAnalysis, CameraAnalysisResult } from '../types';
import { LogFeedingModal } from '../components/LogFeedingModal';

interface StarterDetailScreenProps {
  navigation: any;
  route: any;
}

interface TimelineItem {
  id: string;
  type: 'feeding' | 'photo' | 'camera-analysis';
  timestamp: Date;
  data: Feeding | PhotoAnalysis | CameraAnalysisResult;
}

const { width: screenWidth } = Dimensions.get('window');

export const StarterDetailScreen: React.FC<StarterDetailScreenProps> = ({ navigation, route }) => {
  const { starterId } = route.params;
  const { getStarterById, getFeedingsForStarter, getPhotoAnalysesForStarter, getCameraAnalysesForStarter } = useStarterStore();
  
  const [starter, setStarter] = useState<Starter | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [showFeedingModal, setShowFeedingModal] = useState(false);

  const refreshTimeline = () => {
    const starterData = getStarterById(starterId);
    if (starterData) {
      setStarter(starterData);
      
      // Combine feedings, photo analyses, and camera analyses for timeline
      const feedings = getFeedingsForStarter(starterId);
      const photoAnalyses = getPhotoAnalysesForStarter(starterId);
      const cameraAnalyses = getCameraAnalysesForStarter(starterId);
      
      const feedingItems: TimelineItem[] = feedings.map(feeding => ({
        id: feeding.id,
        type: 'feeding',
        timestamp: feeding.fedAt,
        data: feeding,
      }));
      
      const photoItems: TimelineItem[] = photoAnalyses.map(analysis => ({
        id: analysis.id,
        type: 'photo',
        timestamp: analysis.takenAt,
        data: analysis,
      }));
      
      const cameraItems: TimelineItem[] = cameraAnalyses.map(analysis => ({
        id: analysis.id,
        type: 'camera-analysis',
        timestamp: analysis.timestamp,
        data: analysis,
      }));
      
      // Combine and sort by timestamp (newest first)
      const allItems = [...feedingItems, ...photoItems, ...cameraItems].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
      
      setTimelineItems(allItems);
      console.log('Timeline refreshed - Total items:', allItems.length, 'Camera analyses:', cameraItems.length);
    }
  };

  useEffect(() => {
    refreshTimeline();
  }, [starterId, getStarterById, getFeedingsForStarter, getPhotoAnalysesForStarter, getCameraAnalysesForStarter]);

  // Refresh timeline when modal closes (in case new feeding was added)
  useEffect(() => {
    if (!showFeedingModal) {
      refreshTimeline();
    }
  }, [showFeedingModal]);

  if (!starter) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Loading..." />
        </Appbar.Header>
      </View>
    );
  }

  const getHealthChipStyle = (status: Starter['healthStatus']) => {
    switch (status) {
      case 'healthy':
        return { backgroundColor: '#E0F7FA', textColor: '#00695C' };
      case 'attention':
        return { backgroundColor: '#FFF3E0', textColor: '#E65100' };
      case 'unhealthy':
        return { backgroundColor: '#FFEBEE', textColor: '#C62828' };
    }
  };

  const formatTimeAgo = (date: Date | string | undefined): string => {
    if (!date) return 'Unknown time';
    
    // Convert to Date object if it's a string
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Unknown time';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };

  // Generate sample chart data (in real app this would come from feeding history)
  const chartData = {
    labels: ['6h', '5h', '4h', '3h', '2h', '1h', 'Now'],
    datasets: [
      {
        data: [20, 35, 65, 85, 95, 88, 92],
        strokeWidth: 2,
      },
    ],
  };

  const healthChipStyle = getHealthChipStyle(starter.healthStatus);
  const latestPhotoAnalysis = timelineItems.find(item => item.type === 'photo' || item.type === 'camera-analysis')?.data as PhotoAnalysis | CameraAnalysisResult;

  const handleEditStarter = () => {
    navigation.navigate('EditStarter', { starterId });
  };

  const handleFeedAction = () => {
    setShowFeedingModal(true);
  };

  const handleCameraAction = () => {
    navigation.navigate('CameraCapture', { starterId });
  };

  const handleChatAction = () => {
    if (latestPhotoAnalysis) {
      navigation.navigate('Chat', { analysisId: latestPhotoAnalysis.id });
    }
  };

  const handleTimelineItemPress = (item: TimelineItem) => {
    if (item.type === 'photo') {
      navigation.navigate('PhotoAnalysisDetail', { analysisId: item.id });
    } else if (item.type === 'camera-analysis') {
      navigation.navigate('PhotoAnalysisDetail', { analysisResult: item.data });
    }
  };

  const renderTimelineItem = (item: TimelineItem, index: number) => {
    const isLast = index === timelineItems.length - 1;
    
    if (item.type === 'feeding') {
      const feeding = item.data as Feeding;
      return (
        <View key={item.id} style={styles.timelineItem}>
          <View style={styles.timelineIconContainer}>
            <View style={[styles.timelineIcon, styles.feedingIcon]}>
              <Icon name="coffee" size={12} color={colors.onPrimary} />
            </View>
            {!isLast && <View style={styles.timelineLine} />}
          </View>
          <View style={styles.timelineContent}>
            <Card style={styles.timelineCard}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Feeding</Text>
                  <Text style={styles.cardTime}>{formatTimeAgo(feeding.fedAt)}</Text>
                </View>
                <View style={styles.feedingDetails}>
                  <View style={styles.feedingRow}>
                    <Text style={styles.feedingLabel}>Ratio:</Text>
                    <Text style={styles.feedingValue}>{feeding.ratio}</Text>
                  </View>
                  <View style={styles.feedingRow}>
                    <Text style={styles.feedingLabel}>Temp:</Text>
                    <Text style={styles.feedingValue}>{feeding.tempC}°C</Text>
                  </View>
                </View>
                <Text style={styles.feedingNotes}>
                  Added {feeding.starterWeight}g starter, {feeding.flourWeight}g flour, {feeding.waterWeight}ml water
                </Text>
                {feeding.notes && (
                  <Text style={styles.feedingUserNotes}>
                    {feeding.notes}
                  </Text>
                )}
              </View>
            </Card>
          </View>
        </View>
      );
    } else if (item.type === 'photo') {
      const analysis = item.data as PhotoAnalysis;
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.timelineItem}
          onPress={() => handleTimelineItemPress(item)}
        >
          <View style={styles.timelineIconContainer}>
            <View style={[styles.timelineIcon, styles.photoIcon]}>
              <Icon name="camera" size={12} color={colors.onPrimary} />
            </View>
            {!isLast && <View style={styles.timelineLine} />}
          </View>
          <View style={styles.timelineContent}>
            <Card style={styles.timelineCard}>
              <View style={styles.cardContent}>
                <View style={styles.analysisRow}>
                  <Image source={{ uri: analysis.imageUri }} style={styles.analysisThumbnail} />
                  <View style={styles.analysisDetails}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Photo Analysis</Text>
                      <Text style={styles.cardTime}>{formatTimeAgo(analysis.takenAt)}</Text>
                    </View>
                    <Text style={styles.analysisNotes}>
                      {analysis.jsonResult.nextStep}
                    </Text>
                    <View style={styles.scoreContainer}>
                      <Text style={[
                        styles.scoreText,
                        { color: analysis.jsonResult.rating >= 4 ? '#00695C' : '#E65100' }
                      ]}>
                        Score: {analysis.jsonResult.rating}/5
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        </TouchableOpacity>
      );
    } else if (item.type === 'camera-analysis') {
      const analysis = item.data as CameraAnalysisResult;
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.timelineItem}
          onPress={() => handleTimelineItemPress(item)}
        >
          <View style={styles.timelineIconContainer}>
            <View style={[styles.timelineIcon, styles.photoIcon]}>
              <Icon name="camera" size={12} color={colors.onPrimary} />
            </View>
            {!isLast && <View style={styles.timelineLine} />}
          </View>
          <View style={styles.timelineContent}>
            <Card style={styles.timelineCard}>
              <View style={styles.cardContent}>
                                 <View style={styles.analysisRow}>
                   <Image source={{ uri: analysis.photoUri }} style={styles.analysisThumbnail} />
                   <View style={styles.analysisDetails}>
                     <View style={styles.cardHeader}>
                       <Text style={styles.cardTitle}>AI Analysis</Text>
                      <Text style={styles.cardTime}>{formatTimeAgo(analysis.timestamp)}</Text>
                    </View>
                    <Text style={styles.analysisNotes}>
                      {analysis.recommendations || `Health: ${analysis.healthScore}/10`}
                    </Text>
                    <View style={styles.scoreContainer}>
                      <Text style={[
                        styles.scoreText,
                        { color: analysis.healthScore >= 7 ? '#00695C' : '#E65100' }
                      ]}>
                        Score: {analysis.healthScore}/10
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} iconColor={colors.secondary} />
        <Appbar.Content title={starter.name} titleStyle={styles.headerTitle} />
        <Appbar.Action icon="pencil" onPress={handleEditStarter} iconColor={colors.secondary} />
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Rise Activity Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Rise Activity</Text>
            <Chip
              style={[styles.healthChip, { backgroundColor: healthChipStyle.backgroundColor }]}
              textStyle={[styles.healthChipText, { color: healthChipStyle.textColor }]}
            >
              {starter.healthStatus.charAt(0).toUpperCase() + starter.healthStatus.slice(1)}
            </Chip>
          </View>
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={screenWidth - 64} // Card padding
              height={96}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(242, 160, 52, ${opacity})`,
                fillShadowGradient: colors.primary,
                fillShadowGradientOpacity: 0.1,
                style: {
                  borderRadius: 0,
                },
                propsForDots: {
                  r: "0",
                },
                propsForBackgroundLines: {
                  strokeWidth: 0,
                },
                propsForLabels: {
                  fontSize: 0,
                },
              }}
              bezier
              style={styles.chart}
              withHorizontalLabels={false}
              withVerticalLabels={false}
              withDots={false}
              withInnerLines={false}
              withOuterLines={false}
              withShadow={false}
            />
          </View>
        </Card>

        {/* Last Analysis Card */}
        {latestPhotoAnalysis && (
          <TouchableOpacity onPress={() => {
            const latestItem = timelineItems.find(item => item.type === 'photo' || item.type === 'camera-analysis');
            if (latestItem?.type === 'photo') {
              navigation.navigate('PhotoAnalysisDetail', { analysisId: latestItem.id });
            } else if (latestItem?.type === 'camera-analysis') {
              navigation.navigate('PhotoAnalysisDetail', { analysisResult: latestItem.data });
            }
          }}>
            <Card style={styles.analysisCard}>
              <View style={styles.analysisRow}>
                {'imageUri' in latestPhotoAnalysis ? (
                  <Image source={{ uri: latestPhotoAnalysis.imageUri }} style={styles.lastAnalysisThumbnail} />
                ) : (
                  <Image source={{ uri: (latestPhotoAnalysis as CameraAnalysisResult).photoUri }} style={styles.lastAnalysisThumbnail} />
                )}
                <View style={styles.lastAnalysisDetails}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Last Analysis</Text>
                    {'takenAt' in latestPhotoAnalysis ? (
                      <Text style={styles.cardTime}>{formatTimeAgo(latestPhotoAnalysis.takenAt)}</Text>
                    ) : (
                      <Text style={styles.cardTime}>{formatTimeAgo((latestPhotoAnalysis as CameraAnalysisResult).timestamp)}</Text>
                    )}
                  </View>
                  <Text style={styles.lastAnalysisNotes}>
                    {'jsonResult' in latestPhotoAnalysis ? 
                      latestPhotoAnalysis.jsonResult.nextStep :
                      (latestPhotoAnalysis as CameraAnalysisResult).recommendations[0] || `Health: ${(latestPhotoAnalysis as CameraAnalysisResult).healthScore}/10`
                    }
                  </Text>
                  <View style={styles.lastAnalysisFooter}>
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={12} color={colors.primary} />
                      {'jsonResult' in latestPhotoAnalysis ? (
                        <Text style={styles.ratingText}>{latestPhotoAnalysis.jsonResult.rating}/5</Text>
                      ) : (
                        <Text style={styles.ratingText}>{(latestPhotoAnalysis as CameraAnalysisResult).healthScore}/10</Text>
                      )}
                    </View>
                    {'jsonResult' in latestPhotoAnalysis ? (
                      <Text style={styles.stageText}>{latestPhotoAnalysis.jsonResult.activityStage}</Text>
                    ) : (
                      <Text style={styles.stageText}>{(latestPhotoAnalysis as CameraAnalysisResult).fermentationStage}</Text>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}

        {/* Activity Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
          {timelineItems.map((item, index) => renderTimelineItem(item, index))}
        </View>
      </ScrollView>

      {/* Sticky Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.actionButton, styles.feedButton]} onPress={handleFeedAction}>
          <Icon name="coffee" size={16} color={colors.onPrimary} />
          <Text style={styles.actionButtonText}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.analyzeButton]} onPress={handleCameraAction}>
          <Icon name="camera" size={16} color={colors.onPrimary} />
          <Text style={styles.actionButtonText}>Analyze</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.chatButton]} onPress={handleChatAction}>
          <Icon name="message-circle" size={16} color={colors.onPrimary} />
          <Text style={styles.actionButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Log Feeding Modal */}
      <LogFeedingModal
        visible={showFeedingModal}
        onDismiss={() => setShowFeedingModal(false)}
        starter={starter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140, // Space for action bar (closer to bottom now)
  },
  chartCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    paddingRight: 20, // Extra padding to prevent chip cutoff
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  healthChip: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: 80,
  },
  healthChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chart: {
    borderRadius: 0,
  },
  analysisCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  analysisRow: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  lastAnalysisThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.border,
  },
  lastAnalysisDetails: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  cardTime: {
    fontSize: 12,
    color: colors.disabled,
  },
  lastAnalysisNotes: {
    fontSize: 14,
    color: colors.secondary + 'B3', // 70% opacity
    lineHeight: 20,
    marginBottom: 8,
  },
  lastAnalysisFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: colors.secondary + 'B3', // 70% opacity
    marginLeft: 4,
  },
  stageText: {
    fontSize: 12,
    color: colors.disabled,
  },
  timelineSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedingIcon: {
    backgroundColor: colors.tertiary,
  },
  photoIcon: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 64,
    backgroundColor: colors.tertiary + '4D', // 30% opacity
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    padding: 16,
  },
  feedingDetails: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 24,
  },
  feedingRow: {
    flexDirection: 'row',
  },
  feedingLabel: {
    fontSize: 12,
    color: colors.disabled,
  },
  feedingValue: {
    fontSize: 12,
    color: colors.secondary,
    marginLeft: 4,
  },
  feedingNotes: {
    fontSize: 12,
    color: colors.secondary + 'B3', // 70% opacity
  },
  feedingUserNotes: {
    fontSize: 12,
    color: colors.secondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  analysisThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.border,
  },
  analysisDetails: {
    flex: 1,
  },
  analysisNotes: {
    fontSize: 12,
    color: colors.secondary + 'B3', // 70% opacity
    lineHeight: 16,
    marginBottom: 8,
  },
  scoreContainer: {
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionBar: {
    position: 'absolute',
    bottom: 40, // Only 40px above bottom navigation
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    elevation: 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  feedButton: {
    backgroundColor: colors.primary,
  },
  analyzeButton: {
    backgroundColor: colors.secondary,
  },
  chatButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onPrimary,
  },
}); 