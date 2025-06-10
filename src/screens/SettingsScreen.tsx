import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Image,
} from 'react-native';
import {
  Appbar,
  Card,
  Button,
  Switch,
  Portal,
  Modal,
  Surface,
  Snackbar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStarterStore } from '../store/starterStore';
import { colors } from '../theme/colors';

interface SettingsScreenProps {}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { clearAllData } = useStarterStore();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [diagnosticsEnabled, setDiagnosticsEnabled] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedApiKey = await AsyncStorage.getItem('dev_api_key');
      const savedDiagnostics = await AsyncStorage.getItem('diagnostics_enabled');
      
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
      
      setDiagnosticsEnabled(savedDiagnostics === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveApiKey = async () => {
    try {
      if (apiKey.trim()) {
        await AsyncStorage.setItem('dev_api_key', apiKey.trim());
        showSnackbar('API key saved successfully');
      } else {
        await AsyncStorage.removeItem('dev_api_key');
        showSnackbar('API key removed');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      showSnackbar('Failed to save API key');
    }
  };

  const toggleDiagnostics = async (enabled: boolean) => {
    try {
      setDiagnosticsEnabled(enabled);
      await AsyncStorage.setItem('diagnostics_enabled', enabled.toString());
      showSnackbar(enabled ? 'Diagnostics enabled' : 'Diagnostics disabled');
    } catch (error) {
      console.error('Error saving diagnostics setting:', error);
    }
  };

  const handleClearAllData = () => {
    setShowClearModal(true);
  };

  const confirmClearData = async () => {
    try {
      // Clear app data
      clearAllData();
      
      // Clear AsyncStorage settings
      await AsyncStorage.clear();
      
      // Reset local state
      setApiKey('');
      setDiagnosticsEnabled(false);
      
      setShowClearModal(false);
      showSnackbar('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      showSnackbar('Failed to clear data');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const openAmazonStore = () => {
    // Replace with actual Amazon store URL
    const url = 'https://amazon.com/superbaking';
    Linking.openURL(url).catch(() => {
      showSnackbar('Unable to open store link');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Icon name="settings" size={16} color="white" />
          </View>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </Appbar.Header>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Info Section */}
        <View style={styles.section}>
          <Card style={styles.appInfoCard}>
            <View style={styles.appInfoContent}>
              <View style={styles.appIcon}>
                <Icon name="activity" size={32} color="white" />
              </View>
              <Text style={styles.appName}>Starter Sensei</Text>
              <Text style={styles.appVersion}>Version 1.0.0 (MVP)</Text>
              <Text style={styles.companyName}>SuperBaking Co.</Text>
            </View>
          </Card>
        </View>

        {/* API Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Settings</Text>
          <Card style={styles.settingsCard}>
            <View style={styles.cardContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>API Key</Text>
                <Text style={styles.settingDescription}>
                  OpenAI API key for enhanced features
                </Text>
                <View style={styles.apiKeyContainer}>
                  <TextInput
                    style={styles.apiKeyInput}
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder="sk-..."
                    placeholderTextColor={`${colors.secondary}66`}
                    secureTextEntry={!showApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.apiKeyToggle}
                    onPress={() => setShowApiKey(!showApiKey)}
                  >
                    <Icon
                      name={showApiKey ? 'eye-off' : 'eye'}
                      size={16}
                      color={colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
                <Button
                  mode="outlined"
                  onPress={saveApiKey}
                  style={styles.saveButton}
                  labelStyle={styles.saveButtonText}
                >
                  Save API Key
                </Button>
              </View>

              <View style={styles.settingDivider} />

              <View style={styles.settingRow}>
                <View style={styles.settingHeader}>
                  <Text style={styles.settingLabel}>Diagnostics</Text>
                  <Switch
                    value={diagnosticsEnabled}
                    onValueChange={toggleDiagnostics}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.settingDescription}>
                  Enable detailed logging for troubleshooting
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* SuperBaking Store Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>See More by SuperBaking</Text>
          <Card style={styles.settingsCard}>
            <TouchableOpacity style={styles.storeContent} onPress={openAmazonStore}>
              <View style={styles.storeInfo}>
                <View style={styles.storeIcon}>
                  <Icon name="shopping-bag" size={20} color="white" />
                </View>
                <View style={styles.storeText}>
                  <Text style={styles.storeTitle}>SuperBaking Store</Text>
                  <Text style={styles.storeDescription}>
                    Discover our full range of baking tools and ingredients
                  </Text>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={openAmazonStore}
                style={styles.storeButton}
                labelStyle={styles.storeButtonText}
                icon="external-link"
              >
                Visit Our Amazon Store
              </Button>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
          <Card style={[styles.settingsCard, { borderColor: `${colors.error}20` }]}>
            <TouchableOpacity style={styles.cardContent} onPress={handleClearAllData}>
              <View style={styles.dangerRow}>
                <View style={styles.dangerInfo}>
                  <Icon name="trash-2" size={20} color={colors.error} />
                  <View style={styles.dangerText}>
                    <Text style={styles.dangerTitle}>Clear All Data</Text>
                    <Text style={styles.dangerDescription}>This cannot be undone</Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={16} color={`${colors.error}66`} />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Brand Watermark */}
        <View style={styles.brandSection}>
          <View style={styles.brandWatermark}>
            <View style={styles.brandIcon}>
              <Icon name="activity" size={12} color="white" />
            </View>
            <Text style={styles.brandText}>Powered by SuperBaking</Text>
          </View>
        </View>
      </ScrollView>

      {/* Clear Data Confirmation Modal */}
      <Portal>
        <Modal
          visible={showClearModal}
          onDismiss={() => setShowClearModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Icon name="alert-triangle" size={32} color={colors.error} />
              </View>
              <Text style={styles.modalTitle}>Clear All Data?</Text>
              <Text style={styles.modalDescription}>
                This will permanently delete all your starters, feedings, and photos. 
                This action cannot be undone.
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={confirmClearData}
                style={styles.confirmButton}
                labelStyle={styles.confirmButtonText}
              >
                Yes, Clear All Data
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowClearModal(false)}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonText}
              >
                Cancel
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
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
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 24,
    height: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.secondary,
    fontFamily: 'Montserrat_600SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
  appInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
  },
  appInfoContent: {
    padding: 16,
    alignItems: 'center',
  },
  appIcon: {
    width: 64,
    height: 64,
    backgroundColor: colors.primary,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
    fontFamily: 'Montserrat_600SemiBold',
  },
  appVersion: {
    fontSize: 14,
    color: `${colors.secondary}B3`,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 12,
    color: `${colors.secondary}99`,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: `${colors.tertiary}20`,
  },
  cardContent: {
    padding: 16,
  },
  settingRow: {
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.secondary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: `${colors.secondary}B3`,
    lineHeight: 20,
  },
  settingDivider: {
    height: 1,
    backgroundColor: `${colors.tertiary}20`,
    marginVertical: 16,
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  apiKeyInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: `${colors.tertiary}30`,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.secondary,
    marginRight: 8,
  },
  apiKeyToggle: {
    padding: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: `${colors.tertiary}30`,
    borderRadius: 8,
  },
  saveButton: {
    borderColor: colors.primary,
  },
  saveButtonText: {
    color: colors.primary,
  },
  storeContent: {
    padding: 16,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  storeIcon: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  storeText: {
    flex: 1,
  },
  storeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
    fontFamily: 'Montserrat_600SemiBold',
  },
  storeDescription: {
    fontSize: 14,
    color: `${colors.secondary}B3`,
    lineHeight: 20,
  },
  storeButton: {
    backgroundColor: colors.primary,
  },
  storeButtonText: {
    color: 'white',
  },
  dangerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dangerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dangerText: {
    marginLeft: 12,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.error,
    marginBottom: 2,
  },
  dangerDescription: {
    fontSize: 12,
    color: `${colors.secondary}99`,
  },
  brandSection: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for bottom tabs
    alignItems: 'center',
  },
  brandWatermark: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 16,
    height: 16,
    backgroundColor: `${colors.primary}99`,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandText: {
    fontSize: 12,
    color: `${colors.secondary}66`,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 64,
    height: 64,
    backgroundColor: `${colors.error}20`,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Montserrat_600SemiBold',
  },
  modalDescription: {
    fontSize: 14,
    color: `${colors.secondary}B3`,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalActions: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    color: 'white',
  },
  cancelButton: {
    borderColor: `${colors.tertiary}40`,
  },
  cancelButtonText: {
    color: colors.secondary,
  },
  snackbar: {
    backgroundColor: colors.success,
  },
}); 