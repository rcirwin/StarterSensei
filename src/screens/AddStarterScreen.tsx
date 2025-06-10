import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Appbar,
  TextInput,
  Button,
  Chip,
  HelperText,
  Portal,
  Snackbar,
} from 'react-native-paper';
import { useStarterStore } from '../store/starterStore';
import { colors } from '../theme/colors';
import { Starter } from '../types';

interface AddStarterScreenProps {
  navigation: any;
  route: any;
}

type FlourType = 'White flour' | 'Whole wheat' | 'Rye' | 'Spelt' | 'Mixed';
type DefaultRatio = '1:1:1' | '1:2:2' | '1:5:5' | 'custom';

const flourTypeOptions: FlourType[] = ['White flour', 'Whole wheat', 'Rye', 'Spelt', 'Mixed'];
const ratioOptions = [
  { value: '1:1:1', label: '1:1:1', description: 'Equal parts' },
  { value: '1:2:2', label: '1:2:2', description: 'Double flour & water' },
  { value: '1:5:5', label: '1:5:5', description: 'Maintenance' },
  { value: 'custom', label: 'Custom', description: 'Set your own' },
];

export const AddStarterScreen: React.FC<AddStarterScreenProps> = ({ navigation, route }) => {
  const { addStarter, updateStarter, getStarterById } = useStarterStore();
  const starterId = route.params?.starterId;
  const isEditing = !!starterId;
  
  // Form state
  const [name, setName] = useState('');
  const [flourTypes, setFlourTypes] = useState<FlourType[]>([]);
  const [hydration, setHydration] = useState('');
  const [defaultRatio, setDefaultRatio] = useState<DefaultRatio>('1:1:1');
  const [customRatio, setCustomRatio] = useState({ starter: '1', flour: '1', water: '1' });
  const [showCustomRatio, setShowCustomRatio] = useState(false);
  
  // Validation state
  const [nameError, setNameError] = useState('');
  const [hydrationError, setHydrationError] = useState('');
  const [flourTypeError, setFlourTypeError] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  // Load existing starter for editing
  useEffect(() => {
    if (isEditing && starterId) {
      const existingStarter = getStarterById(starterId);
      if (existingStarter) {
        setName(existingStarter.name);
        // For now, convert single flour type to array (we'll support multiple types in future)
        setFlourTypes([existingStarter.flourType as FlourType]);
        setHydration(existingStarter.hydrationPct.toString());
        setDefaultRatio(existingStarter.defaultRatio as DefaultRatio);
        
        if (existingStarter.defaultRatio === 'custom') {
          setShowCustomRatio(true);
          // Parse custom ratio if needed
          const parts = existingStarter.defaultRatio.split(':');
          if (parts.length === 3) {
            setCustomRatio({
              starter: parts[0],
              flour: parts[1],
              water: parts[2],
            });
          }
        }
      }
    }
  }, [isEditing, starterId, getStarterById]);

  const validateForm = () => {
    let isValid = true;

    // Name validation
    if (!name.trim()) {
      setNameError('Please enter a starter name');
      isValid = false;
    } else {
      // Check for duplicates (skip current starter when editing)
      const { starters } = useStarterStore.getState();
      const isDuplicate = starters.some(starter => 
        starter.name.toLowerCase() === name.trim().toLowerCase() && 
        starter.id !== starterId
      );
      
      if (isDuplicate) {
        setNameError('This name is already taken');
        isValid = false;
      } else {
        setNameError('');
      }
    }

    // Flour type validation
    if (flourTypes.length === 0) {
      setFlourTypeError('Please select at least one flour type');
      isValid = false;
    } else {
      setFlourTypeError('');
    }

    // Hydration validation
    const hydrationNum = parseInt(hydration);
    if (!hydration || isNaN(hydrationNum) || hydrationNum < 50 || hydrationNum > 150) {
      setHydrationError('Please enter a value between 50% and 150%');
      isValid = false;
    } else {
      setHydrationError('');
    }

    return isValid;
  };

  const handleFlourTypeSelect = (selectedType: FlourType) => {
    setFlourTypes(prev => {
      if (prev.includes(selectedType)) {
        // Remove if already selected (allow empty selection)
        return prev.filter(type => type !== selectedType);
      } else {
        // Add to selection
        return [...prev, selectedType];
      }
    });
    // Clear flour type error when user makes a selection
    if (flourTypeError) {
      setFlourTypeError('');
    }
  };

  const handleRatioSelect = (selectedRatio: DefaultRatio) => {
    setDefaultRatio(selectedRatio);
    setShowCustomRatio(selectedRatio === 'custom');
  };

  const getFinalRatio = () => {
    if (defaultRatio === 'custom') {
      return `${customRatio.starter}:${customRatio.flour}:${customRatio.water}`;
    }
    return defaultRatio;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const starterData: Omit<Starter, 'id' | 'createdAt' | 'lastFedAt' | 'feedings' | 'photos'> = {
      name: name.trim(),
      flourType: flourTypes.join(' + '), // Convert array to string for storage
      hydrationPct: parseInt(hydration),
      defaultRatio: getFinalRatio(),
      healthStatus: 'healthy',
      imageUri: undefined,
    };

    try {
      if (isEditing && starterId) {
        updateStarter(starterId, starterData);
      } else {
        addStarter(starterData);
      }
      
      setShowSuccessSnackbar(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      Alert.alert('Error', 'Failed to save starter. Please try again.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleCancel} iconColor={colors.secondary} />
        <Appbar.Content 
          title={isEditing ? 'Edit Starter' : 'Add Starter'} 
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <KeyboardAvoidingView 
        style={styles.flex} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Starter Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Starter Name</Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
              }}
              placeholder="e.g., Classic White, Rustic Rye"
              style={styles.textInput}
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              error={!!nameError}
            />
            <HelperText type="error" visible={!!nameError}>
              {nameError}
            </HelperText>
          </View>

          {/* Flour Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Flour Type</Text>
            <View style={styles.chipContainer}>
              {flourTypeOptions.map((type) => (
                <Chip
                  key={type}
                  selected={flourTypes.includes(type)}
                  onPress={() => handleFlourTypeSelect(type)}
                  style={[
                    styles.chip,
                    flourTypes.includes(type) ? styles.selectedChip : styles.unselectedChip
                  ]}
                  textStyle={[
                    styles.chipText,
                    flourTypes.includes(type) ? styles.selectedChipText : styles.unselectedChipText
                  ]}
                >
                  {type}
                </Chip>
              ))}
            </View>
            <HelperText type="error" visible={!!flourTypeError}>
              {flourTypeError}
            </HelperText>
          </View>

          {/* Hydration Percentage */}
          <View style={styles.section}>
            <Text style={styles.label}>Hydration Percentage</Text>
            <TextInput
              value={hydration}
              onChangeText={(text) => {
                setHydration(text);
              }}
              placeholder=""
              keyboardType="numeric"
              style={styles.textInput}
              mode="outlined"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              right={<TextInput.Affix text="%" />}
              error={!!hydrationError}
            />
            <HelperText type="error" visible={!!hydrationError}>
              {hydrationError}
            </HelperText>
            <HelperText type="info" visible={!hydrationError}>
              Typical range: 75-100%
            </HelperText>
          </View>

          {/* Default Feed Ratio */}
          <View style={styles.section}>
            <Text style={styles.label}>Default Feed Ratio</Text>
            <View style={styles.ratioContainer}>
              {ratioOptions.map((option) => (
                <View key={option.value} style={styles.ratioChipWrapper}>
                  <Chip
                    selected={defaultRatio === option.value}
                    onPress={() => handleRatioSelect(option.value as DefaultRatio)}
                    style={[
                      styles.ratioChip,
                      defaultRatio === option.value ? styles.selectedChip : styles.unselectedChip
                    ]}
                    textStyle={[
                      styles.chipText,
                      defaultRatio === option.value ? styles.selectedChipText : styles.unselectedChipText
                    ]}
                  >
                    <View style={styles.ratioChipContent}>
                      <Text style={[
                        styles.ratioLabel,
                        defaultRatio === option.value ? styles.selectedChipText : styles.unselectedChipText
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={[
                        styles.ratioDescription,
                        defaultRatio === option.value ? styles.selectedChipText : styles.unselectedChipText,
                        { opacity: 0.7 }
                      ]}>
                        {option.description}
                      </Text>
                    </View>
                  </Chip>
                </View>
              ))}
            </View>

            {/* Custom Ratio Inputs */}
            {showCustomRatio && (
              <View style={styles.customRatioContainer}>
                <View style={styles.customRatioRow}>
                  <View style={styles.customRatioInput}>
                    <Text style={styles.customRatioLabel}>Starter</Text>
                    <TextInput
                      value={customRatio.starter}
                      onChangeText={(text) => setCustomRatio(prev => ({ ...prev, starter: text }))}
                      placeholder="1"
                      keyboardType="numeric"
                      style={styles.smallTextInput}
                      mode="outlined"
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                  </View>
                  <Text style={styles.ratioSeparator}>:</Text>
                  <View style={styles.customRatioInput}>
                    <Text style={styles.customRatioLabel}>Flour</Text>
                    <TextInput
                      value={customRatio.flour}
                      onChangeText={(text) => setCustomRatio(prev => ({ ...prev, flour: text }))}
                      placeholder="1"
                      keyboardType="numeric"
                      style={styles.smallTextInput}
                      mode="outlined"
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                  </View>
                  <Text style={styles.ratioSeparator}>:</Text>
                  <View style={styles.customRatioInput}>
                    <Text style={styles.customRatioLabel}>Water</Text>
                    <TextInput
                      value={customRatio.water}
                      onChangeText={(text) => setCustomRatio(prev => ({ ...prev, water: text }))}
                      placeholder="1"
                      keyboardType="numeric"
                      style={styles.smallTextInput}
                      mode="outlined"
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomActions}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonText}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            labelStyle={styles.saveButtonText}
          >
            {isEditing ? 'Update Starter' : 'Save Starter'}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Portal>
        <Snackbar
          visible={showSuccessSnackbar}
          onDismiss={() => setShowSuccessSnackbar(false)}
          duration={1500}
          style={styles.snackbar}
        >
          {isEditing ? 'Starter updated successfully!' : 'Starter saved successfully!'}
        </Snackbar>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
    fontFamily: 'Montserrat_600SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 120, // Extra space to prevent cutoff
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.secondary,
    marginBottom: 8,
    fontFamily: 'Poppins_500Medium',
  },
  textInput: {
    backgroundColor: colors.surface,
    fontFamily: 'Poppins_400Regular',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 0,
    marginBottom: 0,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  unselectedChip: {
    backgroundColor: colors.tertiary + '33', // 20% opacity
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  selectedChipText: {
    color: colors.onPrimary,
  },
  unselectedChipText: {
    color: colors.secondary,
  },
  ratioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratioChipWrapper: {
    width: '48%',
  },
  ratioChip: {
    width: '100%',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratioChipContent: {
    alignItems: 'center',
  },
  ratioLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
  },
  ratioDescription: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  customRatioContainer: {
    backgroundColor: colors.tertiary + '1A', // 10% opacity
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  customRatioRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  customRatioInput: {
    flex: 1,
  },
  customRatioLabel: {
    fontSize: 12,
    color: colors.secondary + 'B3', // 70% opacity
    marginBottom: 4,
    fontFamily: 'Poppins_400Regular',
  },
  smallTextInput: {
    backgroundColor: colors.surface,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  ratioSeparator: {
    fontSize: 16,
    color: colors.secondary + '99', // 60% opacity
    marginHorizontal: 8,
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.tertiary,
  },
  cancelButtonText: {
    color: colors.secondary,
    fontFamily: 'Poppins_500Medium',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontFamily: 'Poppins_600SemiBold',
  },
  disabledButton: {
    backgroundColor: colors.disabled,
  },
  snackbar: {
    backgroundColor: colors.success,
  },
}); 