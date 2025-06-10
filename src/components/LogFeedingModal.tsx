import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Modal,
  Portal,
  Button,
  Chip,
  Snackbar,
} from 'react-native-paper';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Feather';
import { useStarterStore } from '../store/starterStore';
import { colors } from '../theme/colors';
import { Starter } from '../types';

interface LogFeedingModalProps {
  visible: boolean;
  onDismiss: () => void;
  starter: Starter;
}

interface RatioPreset {
  label: string;
  starter: number;
  flour: number;
  water: number;
}

const ratioPresets: RatioPreset[] = [
  { label: '1:1:1', starter: 1, flour: 1, water: 1 },
  { label: '1:2:2', starter: 1, flour: 2, water: 2 },
  { label: '1:3:3', starter: 1, flour: 3, water: 3 },
  { label: '1:5:5', starter: 1, flour: 5, water: 5 },
];

export const LogFeedingModal: React.FC<LogFeedingModalProps> = ({ visible, onDismiss, starter }) => {
  const { addFeeding } = useStarterStore();
  
  const [selectedRatio, setSelectedRatio] = useState(ratioPresets[0]);
  const [starterWeight, setStarterWeight] = useState('50');
  const [flourWeight, setFlourWeight] = useState('50');
  const [waterWeight, setWaterWeight] = useState('50');
  const [tempC, setTempC] = useState(22);
  const [notes, setNotes] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Convert Celsius to Fahrenheit
  const tempF = Math.round((tempC * 9/5) + 32);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setSelectedRatio(ratioPresets[0]);
      calculateWeights(ratioPresets[0]);
      setTempC(22);
      setNotes('');
      setShowSuccessSnackbar(false);
      setShowErrorSnackbar(false);
    }
  }, [visible]);

  const calculateWeights = (ratio: RatioPreset) => {
    const baseWeight = 50;
    setStarterWeight((baseWeight * ratio.starter).toString());
    setFlourWeight((baseWeight * ratio.flour).toString());
    setWaterWeight((baseWeight * ratio.water).toString());
  };

  const handleRatioSelect = (ratio: RatioPreset) => {
    setSelectedRatio(ratio);
    calculateWeights(ratio);
  };

  const handleTempIncrease = () => {
    if (tempC < 35) {
      setTempC(tempC + 1);
    }
  };

  const handleTempDecrease = () => {
    if (tempC > 15) {
      setTempC(tempC - 1);
    }
  };

  const validateInputs = (): boolean => {
    const starterNum = parseInt(starterWeight);
    const flourNum = parseInt(flourWeight);
    const waterNum = parseInt(waterWeight);

    if (!starterWeight || !flourWeight || !waterWeight) {
      setErrorMessage('Please fill in all weight fields');
      return false;
    }

    if (starterNum < 1 || flourNum < 1 || waterNum < 1) {
      setErrorMessage('All weights must be at least 1 gram');
      return false;
    }

    if (starterNum > 1000 || flourNum > 1000 || waterNum > 1000) {
      setErrorMessage('Weights cannot exceed 1000 grams');
      return false;
    }

    return true;
  };

  const handleAddFeeding = () => {
    if (!validateInputs()) {
      setShowErrorSnackbar(true);
      return;
    }

    const feedingData = {
      starterId: starter.id,
      fedAt: new Date(),
      ratio: selectedRatio.label,
      starterWeight: parseInt(starterWeight),
      flourWeight: parseInt(flourWeight),
      waterWeight: parseInt(waterWeight),
      tempC,
      notes: notes.trim(),
    };

    addFeeding(feedingData);
    setShowSuccessSnackbar(true);
    
    // Close modal after a short delay
    setTimeout(() => {
      onDismiss();
    }, 1500);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modal}>
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Log Feeding</Text>
              <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                <Icon name="x" size={20} color={colors.disabled} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>{starter.name} Starter</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Feeding Ratio */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Feeding Ratio</Text>
              <View style={styles.ratioChips}>
                {ratioPresets.map((ratio) => (
                  <Chip
                    key={ratio.label}
                    selected={selectedRatio.label === ratio.label}
                    onPress={() => handleRatioSelect(ratio)}
                    style={[
                      styles.ratioChip,
                      selectedRatio.label === ratio.label ? styles.selectedChip : styles.unselectedChip
                    ]}
                    textStyle={[
                      styles.ratioChipText,
                      selectedRatio.label === ratio.label ? styles.selectedChipText : styles.unselectedChipText
                    ]}
                  >
                    {ratio.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Weights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weights (grams)</Text>
              <View style={styles.weightInputs}>
                <View style={styles.weightInput}>
                  <Text style={styles.inputLabel}>Starter</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={starterWeight}
                    onChangeText={setStarterWeight}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <View style={styles.weightInput}>
                  <Text style={styles.inputLabel}>Flour</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={flourWeight}
                    onChangeText={setFlourWeight}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <View style={styles.weightInput}>
                  <Text style={styles.inputLabel}>Water</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={waterWeight}
                    onChangeText={setWaterWeight}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>
            </View>

            {/* Temperature */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Temperature</Text>
              <View style={styles.temperatureContainer}>
                <View style={styles.temperatureHeader}>
                  <Text style={styles.temperatureLabel}>Room Temperature</Text>
                  <View style={styles.temperatureDisplay}>
                    <Text style={styles.temperatureValue}>
                      {tempC}°C / {tempF}°F
                    </Text>
                    <View style={styles.temperatureButtons}>
                      <TouchableOpacity
                        style={styles.tempButton}
                        onPress={handleTempIncrease}
                      >
                        <Icon name="chevron-up" size={12} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.tempButton}
                        onPress={handleTempDecrease}
                      >
                        <Icon name="chevron-down" size={12} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={15}
                  maximumValue={35}
                  value={tempC}
                  onValueChange={(value: number) => setTempC(Math.round(value))}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.border}
                  thumbTintColor={colors.primary}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any observations about your starter..."
                placeholderTextColor={colors.disabled}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonText}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddFeeding}
              style={styles.addButton}
              labelStyle={styles.addButtonText}
            >
              Add Feeding
            </Button>
          </View>
        </View>

        {/* Success Snackbar */}
        <Snackbar
          visible={showSuccessSnackbar}
          onDismiss={() => setShowSuccessSnackbar(false)}
          duration={3000}
          style={styles.successSnackbar}
        >
          <View style={styles.snackbarContent}>
            <Icon name="check-circle" size={16} color={colors.onPrimary} />
            <Text style={styles.snackbarText}>Feeding logged successfully!</Text>
          </View>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          visible={showErrorSnackbar}
          onDismiss={() => setShowErrorSnackbar(false)}
          duration={3000}
          style={styles.errorSnackbar}
        >
          <View style={styles.snackbarContent}>
            <Icon name="alert-triangle" size={16} color={colors.onPrimary} />
            <Text style={styles.snackbarText}>{errorMessage}</Text>
          </View>
        </Snackbar>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '100%',
    paddingBottom: 0,
  },
  handle: {
    width: 48,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.secondary,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.disabled,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.secondary,
    marginBottom: 12,
  },
  ratioChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratioChip: {
    marginRight: 0,
    marginVertical: 0,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  unselectedChip: {
    backgroundColor: colors.tertiary + '33', // 20% opacity
  },
  ratioChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedChipText: {
    color: colors.onPrimary,
  },
  unselectedChipText: {
    color: colors.secondary,
  },
  weightInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  weightInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.disabled,
    marginBottom: 4,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: colors.secondary,
    backgroundColor: colors.surface,
  },
  temperatureContainer: {
    backgroundColor: colors.tertiary + '1A', // 10% opacity
    borderRadius: 8,
    padding: 16,
  },
  temperatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  temperatureLabel: {
    fontSize: 14,
    color: colors.disabled,
  },
  temperatureDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  temperatureValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
  },
  temperatureButtons: {
    gap: 4,
  },
  tempButton: {
    width: 24,
    height: 24,
    backgroundColor: colors.primary + '33', // 20% opacity
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 24,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.secondary,
    textAlignVertical: 'top',
    minHeight: 80,
    backgroundColor: colors.surface,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40, // Extra padding for bottom safe area
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  successSnackbar: {
    backgroundColor: colors.success,
    marginBottom: 100,
  },
  errorSnackbar: {
    backgroundColor: colors.error,
    marginBottom: 100,
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snackbarText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
}); 