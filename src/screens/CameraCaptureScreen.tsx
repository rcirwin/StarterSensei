import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Animated,
  Image,
} from 'react-native';
import {
  Appbar,
  Text,
  Button,
  Card,
  Chip,
  RadioButton,
  TextInput,
  ProgressBar,
  Snackbar,
} from 'react-native-paper';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Slider from '@react-native-community/slider';
import { useStarterStore } from '../store/starterStore';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types';

type CameraCaptureScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CameraCapture'
>;

type CameraCaptureScreenRouteProp = RouteProp<RootStackParamList, 'CameraCapture'>;

interface Props {
  navigation: CameraCaptureScreenNavigationProp;
  route: CameraCaptureScreenRouteProp;
}

const { width } = Dimensions.get('window');
const CAMERA_HEIGHT = 400;

const FLOUR_TYPES = [
  'White flour',
  'Whole wheat',
  'Rye',
  'Spelt',
  'Mixed'
];

const TIME_OPTIONS = [
  { label: '2-4 hours', value: '2-4h' },
  { label: '4-8 hours', value: '4-8h' },
  { label: '8-12 hours', value: '8-12h' },
  { label: '12-24 hours', value: '12-24h' },
  { label: '1-2 days', value: '1-2d' },
  { label: 'More than 2 days', value: '2d+' },
];

const GOAL_OPTIONS = [
  { value: 'baking', label: 'Ready to bake bread' },
  { value: 'maintenance', label: 'Regular maintenance' },
  { value: 'troubleshoot', label: 'Troubleshoot issues' },
  { value: 'revive', label: 'Revive dormant starter' },
];

export const CameraCaptureScreen: React.FC<Props> = ({ navigation, route }) => {
  const { starterId } = route.params;
  const { addPhotoAnalysis } = useStarterStore();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Context form state
  const [timeSinceFeed, setTimeSinceFeed] = useState('');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [starterWeight, setStarterWeight] = useState('50');
  const [flourWeight, setFlourWeight] = useState('50');
  const [waterWeight, setWaterWeight] = useState('50');
  const [selectedFlourTypes, setSelectedFlourTypes] = useState<string[]>([]);
  const [roomTemp, setRoomTemp] = useState(72);
  const [goal, setGoal] = useState('');
  
  const cameraRef = useRef<CameraView>(null);
  const focusAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const getFlashIcon = () => {
    if (flash === 'off') return 'flash-off';
    if (flash === 'on') return 'zap';
    return 'zap';
  };

  const animateFocus = (x: number, y: number) => {
    focusAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(focusAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(focusAnimation, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCameraPress = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    animateFocus(locationX, locationY);
  };

  const validateContext = (): boolean => {
    if (!timeSinceFeed || !starterWeight || !flourWeight || !waterWeight || selectedFlourTypes.length === 0 || !goal) {
      setSnackbarMessage('Please fill in all context information before analysis');
      setSnackbarVisible(true);
      return false;
    }
    return true;
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      setCapturedImage(photo.uri);

    } catch (error) {
      console.error('Error taking picture:', error);
      setSnackbarMessage('Failed to capture photo');
      setSnackbarVisible(true);
    }
  };

  const submitForAnalysis = async () => {
    if (!validateContext()) return;

    try {
      setIsAnalyzing(true);
      setProgress(0);
      
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            
            // Complete analysis after progress reaches 100%
            setTimeout(() => {
              completeAnalysis(capturedImage!);
            }, 500);
            
            return 100;
          }
          return newProgress;
        });
      }, 200);

    } catch (error) {
      console.error('Error during analysis:', error);
      setSnackbarMessage('Analysis failed');
      setSnackbarVisible(true);
      setIsAnalyzing(false);
    }
  };

  const completeAnalysis = (photoUri: string) => {
    // Generate mock analysis results
    const analysisResult = {
      id: Date.now().toString(),
      starterId,
      photoUri,
      timestamp: new Date(),
      healthScore: 8.5,
      riseActivity: 'Good vertical expansion detected',
      bubbleFormation: 'Consistent bubble pattern throughout',
      fermentationStage: 'Peak activity phase',
      recommendations: [
        'Use for bread within 2-4 hours',
        'Feed if continuing maintenance',
      ],
      context: {
        timeSinceFeed,
        lastFeedRatio: `${starterWeight}:${flourWeight}:${waterWeight}`,
        flourType: selectedFlourTypes.join(' + '),
        roomTemp,
        goal,
      },
    };

    addPhotoAnalysis(analysisResult);
    setIsAnalyzing(false);
    
    // Navigate immediately to analysis results screen
    navigation.navigate('PhotoAnalysisDetail', { 
      starterId, 
      analysisId: analysisResult.id 
    });
  };

  const retakePhoto = () => {
    setIsAnalyzing(false);
    setShowResults(false);
    setProgress(0);
    setCapturedImage(null);
  };

  const navigateToChat = () => {
    navigation.navigate('Chat', { starterId });
  };

  const toggleFlourType = (flourType: string) => {
    setSelectedFlourTypes(prev => 
      prev.includes(flourType) 
        ? prev.filter(type => type !== flourType)
        : [...prev, flourType]
    );
  };

  const adjustTemperature = (delta: number) => {
    setRoomTemp(prev => Math.max(60, Math.min(85, prev + delta)));
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Camera Access" />
        </Appbar.Header>
        <View style={styles.permissionContainer}>
          <Text variant="bodyLarge" style={styles.permissionText}>
            We need your permission to show the camera
          </Text>
          <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
            Grant Permission
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Camera Access" />
        </Appbar.Header>
        <View style={styles.permissionContainer}>
          <Text variant="bodyLarge" style={styles.permissionText}>
            Camera permission is required to analyze your starter
          </Text>
          <Button mode="contained" onPress={requestPermission} style={styles.permissionButton}>
            Grant Permission
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Analyze Starter" />
        <Appbar.Action 
          icon={getFlashIcon()} 
          onPress={toggleFlash}
          iconColor={flash === 'off' ? colors.disabled : colors.primary}
        />
      </Appbar.Header>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Camera Section or Image Preview */}
        {!showResults && (
          <View style={styles.cameraContainer}>
            {!capturedImage ? (
              // Camera View
              <TouchableOpacity 
                style={styles.cameraWrapper}
                onPress={handleCameraPress}
                activeOpacity={1}
              >
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing={facing}
                  flash={flash}
                >
                  {/* Grid Overlay */}
                  <View style={styles.gridOverlay}>
                    {Array.from({ length: 9 }).map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.gridCell,
                          {
                            borderRightWidth: (index + 1) % 3 === 0 ? 0 : 1,
                            borderBottomWidth: index >= 6 ? 0 : 1,
                          },
                        ]}
                      />
                    ))}
                  </View>

                  {/* Focus Ring */}
                  <Animated.View
                    style={[
                      styles.focusRing,
                      {
                        opacity: focusAnimation,
                        transform: [{
                          scale: focusAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        }],
                      },
                    ]}
                  />
                </CameraView>
              </TouchableOpacity>
            ) : (
              // Image Preview
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: capturedImage }} style={styles.imagePreview} />
              </View>
            )}

            {/* Camera Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity style={styles.controlButton}>
                <Icon name="image" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={capturedImage ? retakePhoto : takePicture}
                disabled={isAnalyzing}
              >
                <View style={styles.captureButtonInner}>
                  <Icon 
                    name={capturedImage ? "x" : "camera"} 
                    size={24} 
                    color={colors.primary} 
                  />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={toggleCameraFacing}
              >
                <Icon name="rotate-cw" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Processing State */}
        {isAnalyzing && (
          <View style={styles.processingContainer}>
            <View style={styles.processingIcon}>
              <Icon name="cpu" size={32} color={colors.primary} />
            </View>
            <Text variant="headlineSmall" style={styles.processingTitle}>
              Analyzing Your Starter
            </Text>
            <Text variant="bodyMedium" style={styles.processingSubtitle}>
              Our AI is examining the health and activity...
            </Text>
            <ProgressBar 
              progress={progress / 100} 
              color={colors.primary}
              style={styles.progressBar}
            />
          </View>
        )}

        {/* Analysis Results */}
        {showResults && (
          <View style={styles.resultsContainer}>
            {/* Health Score Card */}
            <Card style={styles.resultCard}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Health Score
                  </Text>
                  <Chip mode="flat" style={styles.healthChip}>
                    Excellent
                  </Chip>
                </View>
                <View style={styles.scoreContainer}>
                  <Text variant="displaySmall" style={styles.score}>
                    8.5
                  </Text>
                  <View style={styles.scoreBarContainer}>
                    <ProgressBar 
                      progress={0.85} 
                      color={colors.success}
                      style={styles.scoreBar}
                    />
                    <Text variant="bodySmall" style={styles.scoreLabel}>
                      Out of 10
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Rise Activity */}
            <Card style={styles.resultCard}>
              <Card.Content>
                <View style={styles.activityHeader}>
                  <Icon name="trending-up" size={20} color={colors.primary} />
                  <Text variant="titleSmall" style={styles.activityTitle}>
                    Rise Activity
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.activityDescription}>
                  Good vertical expansion detected
                </Text>
                <View style={styles.activityChart}>
                  {[6, 8, 5, 7].map((height, index) => (
                    <View
                      key={index}
                      style={[
                        styles.chartBar,
                        { height: height * 4 }
                      ]}
                    />
                  ))}
                  <Text variant="bodySmall" style={styles.chartLabel}>
                    Active fermentation
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Recommendations */}
            <Card style={styles.resultCard}>
              <Card.Content>
                <View style={styles.activityHeader}>
                  <Icon name="lightbulb" size={20} color={colors.primary} />
                  <Text variant="titleSmall" style={styles.activityTitle}>
                    Recommended Action
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.recommendationText}>
                  Your starter is at peak activity! Perfect time for baking or feeding if maintaining.
                </Text>
                <View style={styles.recommendationsList}>
                  <View style={styles.recommendationItem}>
                    <Icon name="check-circle" size={16} color={colors.success} />
                    <Text variant="bodySmall" style={styles.recommendationItemText}>
                      Use for bread within 2-4 hours
                    </Text>
                  </View>
                  <View style={styles.recommendationItem}>
                    <Icon name="check-circle" size={16} color={colors.success} />
                    <Text variant="bodySmall" style={styles.recommendationItemText}>
                      Feed if continuing maintenance
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Context Form */}
        {!isAnalyzing && !showResults && capturedImage && (
          <View style={styles.contextContainer}>
            <Card style={styles.contextCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.contextTitle}>
                  Analysis Context
                </Text>

                {/* Time since last feed */}
                <View style={styles.formField}>
                  <Text variant="bodyMedium" style={styles.fieldLabel}>
                    Time since last feed
                  </Text>
                  <TouchableOpacity 
                    style={styles.dropdownTrigger}
                    onPress={() => setShowTimeDropdown(!showTimeDropdown)}
                  >
                    <Text style={styles.dropdownText}>
                      {timeSinceFeed ? TIME_OPTIONS.find(opt => opt.value === timeSinceFeed)?.label : 'Select time range'}
                    </Text>
                    <Icon name="chevron-down" size={20} color={colors.onSurface} />
                  </TouchableOpacity>
                  
                  {showTimeDropdown && (
                    <View style={styles.dropdownContent}>
                      {TIME_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setTimeSinceFeed(option.value);
                            setShowTimeDropdown(false);
                          }}
                        >
                          <Text>{option.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Last feed ratio */}
                <View style={styles.formField}>
                  <Text variant="bodyMedium" style={styles.fieldLabel}>
                    Last feed ratio (Starter:Flour:Water)
                  </Text>
                  <View style={styles.ratioInputs}>
                    <TextInput
                      mode="outlined"
                      label="Starter"
                      value={starterWeight}
                      onChangeText={setStarterWeight}
                      style={styles.ratioInput}
                      keyboardType="numeric"
                      right={<TextInput.Affix text="g" />}
                    />
                    <TextInput
                      mode="outlined"
                      label="Flour"
                      value={flourWeight}
                      onChangeText={setFlourWeight}
                      style={styles.ratioInput}
                      keyboardType="numeric"
                      right={<TextInput.Affix text="g" />}
                    />
                    <TextInput
                      mode="outlined"
                      label="Water"
                      value={waterWeight}
                      onChangeText={setWaterWeight}
                      style={styles.ratioInput}
                      keyboardType="numeric"
                      right={<TextInput.Affix text="g" />}
                    />
                  </View>
                </View>

                {/* Flour type */}
                <View style={styles.formField}>
                  <Text variant="bodyMedium" style={styles.fieldLabel}>
                    Flour type
                  </Text>
                  <View style={styles.flourTypeContainer}>
                    {FLOUR_TYPES.map((flourType) => (
                      <Chip
                        key={flourType}
                        mode={selectedFlourTypes.includes(flourType) ? 'flat' : 'outlined'}
                        selected={selectedFlourTypes.includes(flourType)}
                        onPress={() => toggleFlourType(flourType)}
                        style={[
                          styles.flourChip,
                          selectedFlourTypes.includes(flourType) && styles.flourChipSelected
                        ]}
                      >
                        {flourType}
                      </Chip>
                    ))}
                  </View>
                </View>

                {/* Room temperature */}
                <View style={styles.formField}>
                  <Text variant="bodyMedium" style={styles.fieldLabel}>
                    Current room temperature
                  </Text>
                  <View style={styles.temperatureContainer}>
                    <View style={styles.tempControls}>
                      <TouchableOpacity 
                        style={styles.tempButton}
                        onPress={() => adjustTemperature(-1)}
                      >
                        <Icon name="minus" size={16} color={colors.onSurface} />
                      </TouchableOpacity>
                      
                      <View style={styles.tempDisplay}>
                        <Text variant="bodyLarge" style={styles.tempValue}>
                          {roomTemp}°F
                        </Text>
                        <Text variant="bodySmall" style={styles.tempCelsius}>
                          {Math.round((roomTemp - 32) * 5/9)}°C
                        </Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.tempButton}
                        onPress={() => adjustTemperature(1)}
                      >
                        <Icon name="plus" size={16} color={colors.onSurface} />
                      </TouchableOpacity>
                    </View>
                    
                    <Slider
                      style={styles.temperatureSlider}
                      minimumValue={60}
                      maximumValue={85}
                      value={roomTemp}
                      onValueChange={setRoomTemp}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.primary}
                      step={1}
                    />
                  </View>
                  <View style={styles.temperatureLabels}>
                    <Text variant="bodySmall" style={styles.tempLabel}>Cool (60°F)</Text>
                    <Text variant="bodySmall" style={styles.tempLabel}>Warm (85°F)</Text>
                  </View>
                </View>

                {/* Goal selection */}
                <View style={styles.formField}>
                  <Text variant="bodyMedium" style={styles.fieldLabel}>
                    Your goal
                  </Text>
                  <RadioButton.Group value={goal} onValueChange={setGoal}>
                    {GOAL_OPTIONS.map((option) => (
                      <TouchableOpacity 
                        key={option.value}
                        style={styles.radioItem}
                        onPress={() => setGoal(option.value)}
                      >
                        <RadioButton value={option.value} />
                        <Text variant="bodyMedium" style={styles.radioLabel}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </RadioButton.Group>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Submit Button */}
        {capturedImage && !isAnalyzing && !showResults && (
          <View style={styles.submitContainer}>
            <Button
              mode="contained"
              onPress={submitForAnalysis}
              style={styles.submitButton}
              icon="cpu"
              disabled={!timeSinceFeed || !goal || selectedFlourTypes.length === 0}
            >
              Submit for Analysis
            </Button>
          </View>
        )}

        {/* Action Buttons */}
        {showResults && (
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={navigateToChat}
              style={styles.actionButton}
              icon="message-circle"
            >
              Ask Follow-up Questions
            </Button>
            <Button
              mode="outlined"
              onPress={retakePhoto}
              style={styles.actionButton}
              icon="camera"
            >
              Retake Photo
            </Button>
          </View>
        )}
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    elevation: 0,
    shadowOpacity: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    color: colors.onSurface,
  },
  permissionButton: {
    backgroundColor: colors.primary,
  },
  cameraContainer: {
    backgroundColor: 'black',
  },
  cameraWrapper: {
    height: CAMERA_HEIGHT,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  imagePreviewContainer: {
    height: CAMERA_HEIGHT,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.3,
  },
  gridCell: {
    width: '33.333%',
    height: '33.333%',
    borderColor: 'white',
  },
  focusRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primary,
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: 'black',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  processingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingTitle: {
    color: colors.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSubtitle: {
    color: colors.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  resultsContainer: {
    padding: 16,
    gap: 16,
  },
  resultCard: {
    backgroundColor: colors.surface,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  healthChip: {
    backgroundColor: `${colors.success}20`,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  score: {
    color: colors.success,
    fontWeight: '600',
  },
  scoreBarContainer: {
    flex: 1,
  },
  scoreBar: {
    height: 12,
    borderRadius: 6,
  },
  scoreLabel: {
    color: colors.secondary,
    marginTop: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  activityTitle: {
    color: colors.onSurface,
    fontWeight: '500',
  },
  activityDescription: {
    color: colors.secondary,
    marginBottom: 16,
  },
  activityChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  chartBar: {
    width: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  chartLabel: {
    color: colors.secondary,
    marginLeft: 8,
  },
  recommendationText: {
    color: colors.onSurface,
    marginBottom: 16,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationItemText: {
    color: colors.secondary,
    flex: 1,
  },
  contextContainer: {
    padding: 16,
  },
  contextCard: {
    backgroundColor: colors.surface,
    elevation: 1,
  },
  contextTitle: {
    color: colors.onSurface,
    fontWeight: '600',
    marginBottom: 24,
  },
  formField: {
    marginBottom: 24,
  },
  fieldLabel: {
    color: colors.onSurface,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownText: {
    color: colors.onSurface,
  },
  dropdownContent: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: 4,
    elevation: 2,
    shadowOpacity: 0.1,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ratioInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  ratioInput: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flourTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flourChip: {
    marginBottom: 4,
  },
  flourChipSelected: {
    backgroundColor: colors.primary,
  },
  temperatureContainer: {
    gap: 16,
  },
  tempControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  tempButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  tempValue: {
    color: colors.onSurface,
    fontWeight: '600',
  },
  tempCelsius: {
    color: colors.secondary,
  },
  temperatureSlider: {
    height: 40,
  },
  temperatureLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tempLabel: {
    color: colors.secondary,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    color: colors.onSurface,
    marginLeft: 8,
    flex: 1,
  },
  submitContainer: {
    padding: 16,
  },
  submitButton: {
    paddingVertical: 8,
    backgroundColor: colors.primary,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 8,
  },
}); 