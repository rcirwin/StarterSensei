import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Share,
} from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Chip,
  ProgressBar,
  Surface,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { useStarterStore } from '../store/starterStore';
import { colors } from '../theme/colors';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList, PhotoAnalysis, CameraAnalysisResult } from '../types';
import { convertAIAnalysisToUI } from '../utils/starterAnalysisUtils';

const { width } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'PhotoAnalysisDetail'>;

interface MetricCardProps {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  score: string | number | React.ReactNode;
  scoreColor: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  iconColor,
  title,
  subtitle,
  score,
  scoreColor,
  expanded,
  onToggle,
  children,
}) => {
  const rotateAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Card style={styles.metricCard}>
      <TouchableOpacity onPress={onToggle} style={styles.metricHeader}>
        <View style={styles.metricLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
            <Icon name={icon} size={20} color={iconColor} />
          </View>
          <View style={styles.metricInfo}>
            <Text style={styles.metricTitle}>{title}</Text>
            <Text style={styles.metricSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.metricRight}>
          <Text style={[styles.metricScore, { color: scoreColor }]}>{score}</Text>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Icon name="chevron-down" size={20} color={colors.disabled} />
          </Animated.View>
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.metricDetails}>
          <View style={styles.metricDivider} />
          {children}
        </View>
      )}
    </Card>
  );
};

export const AnalysisResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { starterId, analysisId, analysisResult } = route.params;
  const theme = useTheme();
  
  const { 
    getStarter, 
    getPhotoAnalysis, 
    getCameraAnalysesForStarter 
  } = useStarterStore();
  
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [confidenceProgress] = useState(new Animated.Value(0));

  // Handle both parameter types
  let analysis: PhotoAnalysis | CameraAnalysisResult | undefined;
  let starter: any;

  if (analysisResult) {
    // Direct analysis result passed
    analysis = analysisResult;
    starter = getStarter(analysisResult.starterId);
  } else if (starterId && analysisId) {
    // Legacy parameters passed
    starter = getStarter(starterId);
    const photoAnalysis = getPhotoAnalysis(analysisId);
    const cameraAnalyses = getCameraAnalysesForStarter(starterId);
    analysis = photoAnalysis || cameraAnalyses.find(a => a.id === analysisId);
  }

  if (!starter || !analysis) {
    return (
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Analysis Results" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Analysis not found</Text>
        </View>
      </View>
    );
  }

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleShare = async () => {
    try {
      const healthScore = isPhotoAnalysis 
        ? (analysis as PhotoAnalysis).jsonResult.rating 
        : (analysis as CameraAnalysisResult).healthScore;
      const result = await Share.share({
        message: `My sourdough starter analysis shows excellent health with a score of ${healthScore}/10! 🥖✨`,
        title: 'Starter Analysis Results',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleChatWithAssistant = () => {
    const actualStarterId = analysisResult ? analysisResult.starterId : starterId!;
    const actualAnalysisId = analysisResult ? analysisResult.id : analysisId!;
    navigation.navigate('Chat', { starterId: actualStarterId, analysisId: actualAnalysisId });
  };

  const handleRetakePhoto = () => {
    const actualStarterId = analysisResult ? analysisResult.starterId : starterId!;
    navigation.navigate('CameraCapture', { starterId: actualStarterId });
  };

  // Prepare data for display
  const isPhotoAnalysis = analysis && 'jsonResult' in analysis;
  const imageUri = analysis ? (isPhotoAnalysis 
    ? (analysis as PhotoAnalysis).imageUri 
    : (analysis as CameraAnalysisResult).photoUri) : '';
  
  // Convert AI analysis to UI-friendly format
  const uiData = analysis && !isPhotoAnalysis && (analysis as CameraAnalysisResult).aiAnalysis 
    ? convertAIAnalysisToUI((analysis as CameraAnalysisResult).aiAnalysis!)
    : null;
  
  // Use AI data if available, otherwise fallback to existing logic
  const healthStatus = uiData?.healthStatus.text || 
    (analysis && isPhotoAnalysis 
      ? (analysis as PhotoAnalysis).jsonResult.healthStatus 
      : (analysis && (analysis as CameraAnalysisResult).healthScore >= 7 ? 'healthy' : 
         analysis && (analysis as CameraAnalysisResult).healthScore >= 4 ? 'attention' : 'unhealthy'));
  
  const rating = uiData?.rating || 
    (analysis && isPhotoAnalysis 
      ? (analysis as PhotoAnalysis).jsonResult.rating 
      : (analysis ? (analysis as CameraAnalysisResult).healthScore : 0));
  
  const confidence = uiData?.confidence || 
    (analysis && isPhotoAnalysis 
      ? (analysis as PhotoAnalysis).jsonResult.confidence 
      : 0.94);

  useEffect(() => {
    // Animate confidence bar on mount
    if (analysis) {
      const targetConfidence = confidence / 100; // Convert percentage to decimal
      Animated.timing(confidenceProgress, {
        toValue: targetConfidence,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }
  }, [analysis, confidence, confidenceProgress]);

  const getHealthInfo = () => {
    // Use AI-derived health info if available
    if (uiData?.healthStatus) {
      return {
        title: uiData.healthStatus.text,
        chipText: uiData.healthStatus.chip,
        chipColor: uiData.healthStatus.chipColor,
        description: getHealthDescription(uiData.rating),
      };
    }
    
    // Fallback to existing logic
    switch (healthStatus) {
      case 'healthy':
        return {
          title: 'Excellent Health',
          chipText: 'Peak Activity',
          chipColor: colors.success,
          description: 'Your starter is thriving and ready for baking!',
        };
      case 'attention':
        return {
          title: 'Needs Attention',
          chipText: 'Moderate Activity',
          chipColor: colors.warning,
          description: 'Your starter shows signs of activity but could use some care.',
        };
      default:
        return {
          title: 'Needs Care',
          chipText: 'Low Activity',
          chipColor: colors.error,
          description: 'Your starter needs immediate attention to restore health.',
        };
    }
  };
  
  const getHealthDescription = (rating: number) => {
    if (rating >= 4) return 'Your starter is thriving and ready for baking!';
    if (rating >= 3) return 'Your starter is in good condition with healthy activity.';
    if (rating >= 2) return 'Your starter shows signs of activity but could use some care.';
    return 'Your starter needs immediate attention to restore health.';
  };

  const healthInfo = getHealthInfo();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Analysis Results" />
        <Appbar.Action icon="share" onPress={handleShare} />
      </Appbar.Header>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Status Card */}
        <View style={styles.heroSection}>
          <Card style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.heroTop}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.starterImage} />
                </View>
                <View style={styles.heroInfo}>
                  <Text style={styles.heroTitle}>{healthInfo.title}</Text>
                  <View style={styles.ratingContainer}>
                    <View style={styles.stars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icon
                          key={star}
                          name="star"
                          size={18}
                          color={star <= Math.round(rating) ? colors.primary : colors.disabled}
                          style={{ marginRight: 2 }}
                        />
                      ))}
                    </View>
                    <Text style={styles.ratingText}>{rating}/5</Text>
                  </View>
                  <Chip
                    mode="flat"
                    style={[styles.activityChip, { backgroundColor: `${healthInfo.chipColor}20` }]}
                    textStyle={[styles.chipText, { color: healthInfo.chipColor }]}
                  >
                    {healthInfo.chipText}
                  </Chip>
                </View>
              </View>
              <Text style={styles.heroDescription}>{healthInfo.description}</Text>
            </View>
          </Card>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsSection}>
          {/* Rise Height Card */}
          <MetricCard
            icon="trending-up"
            iconColor={(uiData?.riseScore || 7) >= 7 ? colors.success : (uiData?.riseScore || 7) >= 4 ? colors.warning : colors.error}
            title="Rise Height"
            subtitle={(uiData?.riseDescription?.substring(0, 50) + '...') || "Rise activity analysis"}
            score={(uiData?.riseScore || 7).toString()}
            scoreColor={(uiData?.riseScore || 7) >= 7 ? colors.success : (uiData?.riseScore || 7) >= 4 ? colors.warning : colors.error}
            expanded={expandedCards.rise}
            onToggle={() => toggleCard('rise')}
          >
            <View style={styles.chartContainer}>
              <View style={styles.miniChart}>
                {(uiData?.riseData || [8, 12, 10, 14, 16]).map((height, index) => (
                  <View
                    key={index}
                    style={[
                      styles.chartBar,
                      { 
                        height: height * 2,
                        backgroundColor: (uiData?.riseScore || 7) >= 7 ? colors.success : (uiData?.riseScore || 7) >= 4 ? colors.warning : colors.error,
                      }
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.chartLabel}>
                {(uiData?.riseScore || 7) >= 7 ? 'Strong rise activity' : (uiData?.riseScore || 7) >= 4 ? 'Moderate rise' : 'Limited rise'}
              </Text>
            </View>
            <Text style={styles.metricDescription}>
              {uiData?.riseDescription || "Excellent vertical expansion indicates strong yeast activity and proper fermentation."}
            </Text>
          </MetricCard>

          {/* Bubble Density Card */}
          <MetricCard
            icon="circle"
            iconColor={(uiData?.bubbleScore || 7) >= 7 ? colors.primary : (uiData?.bubbleScore || 7) >= 4 ? colors.warning : colors.error}
            title="Bubble Density"
            subtitle={(uiData?.bubbleDescription?.substring(0, 30) + '...') || "Bubble activity"}
            score={(uiData?.bubbleScore || 7).toString()}
            scoreColor={(uiData?.bubbleScore || 7) >= 7 ? colors.primary : (uiData?.bubbleScore || 7) >= 4 ? colors.warning : colors.error}
            expanded={expandedCards.bubble}
            onToggle={() => toggleCard('bubble')}
          >
            <View style={styles.bubbleContainer}>
              <View style={styles.bubbleGrid}>
                {Array.from({ length: uiData?.bubblePattern?.count || 8 }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.bubble,
                      {
                        width: uiData?.bubblePattern?.sizes?.[index] || (8 + Math.random() * 8),
                        height: uiData?.bubblePattern?.sizes?.[index] || (8 + Math.random() * 8),
                        backgroundColor: `${(uiData?.bubbleScore || 7) >= 7 ? colors.primary : (uiData?.bubbleScore || 7) >= 4 ? colors.warning : colors.error}${Math.floor(30 + Math.random() * 50).toString(16)}`,
                      }
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.bubbleLabel}>
                {uiData?.bubblePattern?.description || "Uniform bubble distribution"}
              </Text>
            </View>
            <Text style={styles.metricDescription}>
              {uiData?.bubbleDescription || "Uniform bubble distribution throughout the starter indicates healthy fermentation process."}
            </Text>
          </MetricCard>

          {/* Surface/Color Card */}
          <MetricCard
            icon="eye"
            iconColor={colors.tertiary}
            title="Surface & Color"
            subtitle={uiData?.colorDescription?.substring(0, 30) + '...' || "Healthy appearance"}
            score={
              <View style={styles.colorSamples}>
                <View style={[styles.colorSample, { backgroundColor: uiData?.colors?.[0] || '#FFF8DC' }]} />
                <View style={[styles.colorSample, { backgroundColor: uiData?.colors?.[1] || '#FFEFD5' }]} />
              </View>
            }
            scoreColor={colors.tertiary}
            expanded={expandedCards.surface}
            onToggle={() => toggleCard('surface')}
          >
            <View style={styles.colorContainer}>
              <View style={styles.colorPalette}>
                <View style={[styles.colorSwatch, { backgroundColor: uiData?.colors?.[0] || '#FFF8DC' }]} />
                <View style={[styles.colorSwatch, { backgroundColor: uiData?.colors?.[1] || '#FFEFD5' }]} />
                <View style={[styles.colorSwatch, { backgroundColor: uiData?.colors?.[2] || '#FFE4B5' }]} />
              </View>
              <Text style={styles.colorLabel}>
                {uiData?.colors ? 'AI-detected colors' : 'Natural color variation'}
              </Text>
            </View>
            <Text style={styles.metricDescription}>
              {uiData?.surfaceDescription || "Creamy white to light tan coloration is normal and healthy for wheat-based starters."}
            </Text>
          </MetricCard>

          {/* Activity Stage Card */}
          <MetricCard
            icon="clock"
            iconColor={uiData?.activityStage?.color || colors.warning}
            title="Activity Stage"
            subtitle={uiData?.activityStage?.description || "Peak fermentation"}
            score={
              <Chip
                mode="flat"
                style={[styles.stageChip, { backgroundColor: `${uiData?.activityStage?.color || colors.warning}20` }]}
                textStyle={[styles.chipText, { color: uiData?.activityStage?.color || colors.warning }]}
              >
                {uiData?.activityStage?.label || "Peak"}
              </Chip>
            }
            scoreColor={uiData?.activityStage?.color || colors.warning}
            expanded={expandedCards.stage}
            onToggle={() => toggleCard('stage')}
          >
            <View style={styles.stageContainer}>
              <View style={styles.stageTimeline}>
                {[0, 1, 2, 3].map((stage) => (
                  <View 
                    key={stage}
                    style={[
                      styles.stageBar, 
                      { 
                        backgroundColor: stage <= (uiData?.activityStage?.position || 2) 
                          ? (uiData?.activityStage?.color || colors.warning)
                          : colors.disabled 
                      }
                    ]} 
                  />
                ))}
              </View>
              <Text style={styles.stageLabel}>Lag → Growth → Peak → Decline</Text>
            </View>
            <Text style={styles.metricDescription}>
              {uiData?.activityStage?.description || "Your starter is at peak activity - perfect timing for baking or maintaining feeding schedule."}
            </Text>
          </MetricCard>
        </View>

        {/* Next Step Callout */}
        <View style={styles.calloutSection}>
          <LinearGradient
            colors={[`${uiData?.activityStage?.color || colors.primary}10`, `${uiData?.activityStage?.color || colors.warning}10`]}
            style={styles.calloutCard}
          >
            <View style={styles.calloutHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${uiData?.activityStage?.color || colors.primary}20` }]}>
                <Icon name="lightbulb" size={24} color={uiData?.activityStage?.color || colors.primary} />
              </View>
              <View style={styles.calloutInfo}>
                <Text style={styles.calloutTitle}>Recommended Action</Text>
                <Text style={styles.calloutDescription}>
                  {uiData?.recommendation || "Feed 1:2:2 ratio and keep at 26°C for 4 hours, then use for baking or refrigerate."}
                </Text>
              </View>
            </View>
            <Surface style={styles.recipeCard}>
              <Text style={styles.recipeLabel}>Recipe Suggestion:</Text>
              <Text style={styles.recipeText}>50g starter + 100g flour + 100g water</Text>
            </Surface>
          </LinearGradient>
        </View>

        {/* Confidence Score */}
        <View style={styles.confidenceSection}>
          <Card style={styles.confidenceCard}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceTitle}>Analysis Confidence</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Analysis Confidence',
                    'Confidence score is based on image clarity, lighting conditions, and feature detection accuracy.'
                  )
                }
              >
                <Icon name="info" size={16} color={colors.disabled} />
              </TouchableOpacity>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: confidenceProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${confidence}%`],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidencePercent}>{confidence}%</Text>
            </View>
            <Text style={styles.confidenceNote}>
              {confidence >= 80 ? 'High confidence' : confidence >= 60 ? 'Good confidence' : 'Moderate confidence'} based on image quality and feature detection
            </Text>
          </Card>
        </View>

        {/* AI Analysis Details */}
        {!isPhotoAnalysis && (analysis as CameraAnalysisResult).aiAnalysis && (
          <View style={styles.aiAnalysisSection}>
            <Card style={styles.aiAnalysisCard}>
              <View style={styles.aiAnalysisHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  <Icon name="cpu" size={20} color={colors.primary} />
                </View>
                <Text style={styles.aiAnalysisTitle}>Starter-Sensei AI Analysis</Text>
              </View>
              <View style={styles.aiAnalysisContent}>
                {Object.entries((analysis as CameraAnalysisResult).aiAnalysis!).map(([key, value]) => {
                  if (key === 'rationale') return null; // We'll show this separately
                  
                  const formatKey = (k: string) => {
                    return k.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                  };
                  
                  return (
                    <View key={key} style={styles.aiAnalysisItem}>
                      <Text style={styles.aiAnalysisLabel}>{formatKey(key)}</Text>
                      <Text style={styles.aiAnalysisValue}>{value}</Text>
                    </View>
                  );
                })}
                
                {(analysis as CameraAnalysisResult).aiAnalysis!.rationale && (
                  <View style={styles.aiRationaleContainer}>
                    <Text style={styles.aiRationaleLabel}>AI Rationale</Text>
                    <View style={styles.aiRationaleBox}>
                      <Text style={styles.aiRationaleText}>
                        {(analysis as CameraAnalysisResult).aiAnalysis!.rationale}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </Card>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <Button
            mode="contained"
            onPress={handleChatWithAssistant}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            icon="message-circle"
          >
            Chat with Assistant
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleRetakePhoto}
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.buttonLabel, { color: colors.secondary }]}
            icon="camera"
          >
            Retake Photo
          </Button>
        </View>
      </ScrollView>
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
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.secondary,
    textAlign: 'center',
  },
  heroSection: {
    padding: 16,
    paddingTop: 24,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 2,
  },
  heroContent: {
    padding: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: `${colors.tertiary}20`,
    marginRight: 16,
  },
  starterImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
    fontFamily: 'Montserrat_600SemiBold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    fontFamily: 'Montserrat_600SemiBold',
  },
  activityChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  heroDescription: {
    fontSize: 14,
    color: `${colors.secondary}B3`,
    textAlign: 'center',
    lineHeight: 20,
  },
  metricsSection: {
    padding: 16,
    gap: 16,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
    overflow: 'hidden',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.secondary,
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 14,
    color: `${colors.secondary}99`,
  },
  metricRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricScore: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
  },
  metricDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  metricDivider: {
    height: 1,
    backgroundColor: `${colors.tertiary}20`,
    marginBottom: 16,
  },
  metricDescription: {
    fontSize: 14,
    color: `${colors.secondary}B3`,
    lineHeight: 20,
  },
  chartContainer: {
    marginBottom: 12,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 8,
  },
  chartBar: {
    width: 12,
    borderRadius: 2,
  },
  chartLabel: {
    fontSize: 12,
    color: `${colors.secondary}99`,
  },
  bubbleContainer: {
    marginBottom: 12,
  },
  bubbleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  bubble: {
    borderRadius: 50,
  },
  bubbleLabel: {
    fontSize: 12,
    color: `${colors.secondary}99`,
  },
  colorContainer: {
    marginBottom: 12,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${colors.tertiary}40`,
  },
  colorSamples: {
    flexDirection: 'row',
    gap: 4,
  },
  colorSample: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: `${colors.tertiary}40`,
  },
  colorLabel: {
    fontSize: 12,
    color: `${colors.secondary}99`,
  },
  stageContainer: {
    marginBottom: 12,
  },
  stageTimeline: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  stageBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  stageChip: {
    paddingHorizontal: 8,
  },
  stageLabel: {
    fontSize: 12,
    color: `${colors.secondary}99`,
  },
  calloutSection: {
    padding: 16,
  },
  calloutCard: {
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  calloutInfo: {
    flex: 1,
    marginLeft: 12,
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
    fontFamily: 'Montserrat_600SemiBold',
  },
  calloutDescription: {
    fontSize: 14,
    color: `${colors.secondary}CC`,
    lineHeight: 20,
  },
  recipeCard: {
    backgroundColor: `${colors.surface}99`,
    borderRadius: 8,
    padding: 12,
  },
  recipeLabel: {
    fontSize: 12,
    color: `${colors.secondary}B3`,
    marginBottom: 4,
    fontFamily: 'RobotoMono_400Regular',
  },
  recipeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.secondary,
  },
  confidenceSection: {
    padding: 16,
  },
  confidenceCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 12,
    backgroundColor: `${colors.tertiary}20`,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 6,
  },
  confidencePercent: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    fontFamily: 'Montserrat_600SemiBold',
  },
  confidenceNote: {
    fontSize: 12,
    color: `${colors.secondary}99`,
    lineHeight: 16,
  },
  buttonSection: {
    padding: 16,
    paddingBottom: 100, // Extra space for bottom tabs
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  secondaryButton: {
    borderColor: `${colors.tertiary}40`,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  aiAnalysisSection: {
    padding: 16,
  },
  aiAnalysisCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  aiAnalysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginLeft: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  aiAnalysisContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  aiAnalysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.tertiary}10`,
  },
  aiAnalysisLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.secondary,
    flex: 1,
    marginRight: 12,
  },
  aiAnalysisValue: {
    fontSize: 14,
    color: `${colors.secondary}CC`,
    flex: 2,
    textAlign: 'right',
  },
  aiRationaleContainer: {
    marginTop: 16,
  },
  aiRationaleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  aiRationaleBox: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  aiRationaleText: {
    fontSize: 14,
    color: `${colors.secondary}DD`,
    lineHeight: 20,
    fontStyle: 'italic',
  },
}); 