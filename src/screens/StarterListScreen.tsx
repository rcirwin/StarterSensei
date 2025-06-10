import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { Appbar, FAB, Portal, Modal, List, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { StarterCard } from '../components/StarterCard';
import { useStarterStore } from '../store/starterStore';
import { colors } from '../theme/colors';
import { Starter } from '../types';

interface StarterListScreenProps {
  navigation: any;
}

export const StarterListScreen: React.FC<StarterListScreenProps> = ({ navigation }) => {
  const { starters, deleteStarter } = useStarterStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStarter, setSelectedStarter] = useState<Starter | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);

  // Refresh the list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Any refresh logic would go here
      // For now, just a placeholder since we're using local state
    }, [])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleStarterPress = useCallback((starter: Starter) => {
    navigation.navigate('StarterDetail', { starterId: starter.id });
  }, [navigation]);

  const handleStarterLongPress = useCallback((starter: Starter) => {
    setSelectedStarter(starter);
    setShowContextMenu(true);
  }, []);

  const handleAddStarter = useCallback(() => {
    navigation.navigate('AddStarter');
  }, [navigation]);

  const handleEditStarter = useCallback(() => {
    if (selectedStarter) {
      setShowContextMenu(false);
      navigation.navigate('EditStarter', { starterId: selectedStarter.id });
    }
  }, [selectedStarter, navigation]);

  const handleTakePhoto = useCallback(() => {
    if (selectedStarter) {
      setShowContextMenu(false);
      navigation.navigate('CameraCapture', { starterId: selectedStarter.id });
    }
  }, [selectedStarter, navigation]);

  const handleDeleteStarter = useCallback(() => {
    if (selectedStarter) {
      Alert.alert(
        'Delete Starter',
        `Are you sure you want to delete "${selectedStarter.name}"? This will also delete all feeding logs and photos.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteStarter(selectedStarter.id);
              setShowContextMenu(false);
              setSelectedStarter(null);
            },
          },
        ]
      );
    }
  }, [selectedStarter, deleteStarter]);

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
    setSelectedStarter(null);
  }, []);

  const renderStarter = useCallback(({ item }: { item: Starter }) => (
    <StarterCard
      starter={item}
      onPress={() => handleStarterPress(item)}
      onLongPress={() => handleStarterLongPress(item)}
    />
  ), [handleStarterPress, handleStarterLongPress]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyImageContainer}>
        <Icon name="coffee" size={80} color={colors.disabled} />
      </View>
      <Text style={styles.emptyTitle}>No Starters Yet</Text>
      <Text style={styles.emptyDescription}>
        Start your sourdough journey by creating your first starter profile.
      </Text>
      <Button 
        mode="contained" 
        onPress={handleAddStarter}
        style={styles.emptyButton}
        labelStyle={styles.emptyButtonText}
      >
        Create Your First Starter
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Icon name="coffee" size={16} color={colors.onPrimary} />
            </View>
            <Appbar.Content 
              title="Starters" 
              titleStyle={styles.headerTitle}
            />
          </View>
        </View>
      </Appbar.Header>

      <View style={styles.content}>
        {starters.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={starters}
            renderItem={renderStarter}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddStarter}
        color={colors.onPrimary}
      />

      <Portal>
        <Modal
          visible={showContextMenu}
          onDismiss={handleCloseContextMenu}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.contextMenu}>
            <View style={styles.modalHandle} />
            
            <List.Item
              title="Edit Starter"
              left={(props) => <List.Icon {...props} icon="pencil" color={colors.secondary} />}
              onPress={handleEditStarter}
              style={styles.contextMenuItem}
            />
            
            <List.Item
              title="Take Photo"
              left={(props) => <List.Icon {...props} icon="camera" color={colors.secondary} />}
              onPress={handleTakePhoto}
              style={styles.contextMenuItem}
            />
            
            <List.Item
              title="Delete Starter"
              left={(props) => <List.Icon {...props} icon="delete" color={colors.error} />}
              titleStyle={{ color: colors.error }}
              onPress={handleDeleteStarter}
              style={styles.contextMenuItem}
            />
            
            <Button
              mode="text"
              onPress={handleCloseContextMenu}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonText}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
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
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.secondary,
    fontFamily: 'Montserrat_600SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingVertical: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyImageContainer: {
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Montserrat_600SemiBold',
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.disabled,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
    fontFamily: 'Poppins_400Regular',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: colors.onPrimary,
    fontWeight: '500',
    fontFamily: 'Poppins_500Medium',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 70, // Closer to bottom navigation bar
    backgroundColor: colors.primary,
    borderRadius: 28,
    width: 56,
    height: 56,
  },
  modalContainer: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  contextMenu: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 24,
  },
  modalHandle: {
    width: 48,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  contextMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  cancelButton: {
    marginTop: 16,
    marginHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderRadius: 0,
    paddingTop: 16,
  },
  cancelButtonText: {
    color: colors.disabled,
    fontFamily: 'Poppins_400Regular',
  },
}); 