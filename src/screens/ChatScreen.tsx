import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import {
  Appbar,
  Card,
  Chip,
  Surface,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStarterStore } from '../store/starterStore';
import { colors } from '../theme/colors';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList, ChatMessage, PhotoAnalysis, CameraAnalysisResult } from '../types';

const { width } = Dimensions.get('window');

type Props = StackScreenProps<RootStackParamList, 'Chat'>;

export const ChatScreen: React.FC<Props> = ({ navigation, route }) => {
  const { starterId, analysisId } = route.params;
  
  const {
    getStarter,
    getPhotoAnalysis,
    getCameraAnalysesForStarter,
    getChatMessagesForAnalysis,
    addChatMessage,
  } = useStarterStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const starter = getStarter(starterId);
  
  // Get analysis if analysisId is provided
  const photoAnalysis = analysisId ? getPhotoAnalysis(analysisId) : null;
  const cameraAnalyses = getCameraAnalysesForStarter(starterId);
  const analysis = photoAnalysis || (analysisId ? cameraAnalyses.find(a => a.id === analysisId) : null);

  useEffect(() => {
    if (analysisId) {
      const existingMessages = getChatMessagesForAnalysis(analysisId);
      setMessages(existingMessages);

      // Add initial AI message if no messages exist
      if (existingMessages.length === 0 && analysis) {
        const initialMessage = generateInitialMessage(analysis);
        const aiMessage: Omit<ChatMessage, 'id'> = {
          analysisId,
          role: 'assistant',
          content: initialMessage,
          timestamp: new Date(),
        };
        addChatMessage(aiMessage);
        setMessages([aiMessage as ChatMessage]);
      }
    }
  }, [analysisId, analysis]);

  const generateInitialMessage = (analysis: PhotoAnalysis | CameraAnalysisResult): string => {
    const isPhotoAnalysis = 'jsonResult' in analysis;
    const healthStatus = isPhotoAnalysis 
      ? (analysis as PhotoAnalysis).jsonResult.healthStatus 
      : ((analysis as CameraAnalysisResult).healthScore >= 7 ? 'healthy' : 
         (analysis as CameraAnalysisResult).healthScore >= 4 ? 'attention' : 'unhealthy');

    if (healthStatus === 'healthy') {
      return `Great news! Your ${starter?.name} starter shows excellent signs of health. The bubble formation indicates active fermentation, and the rise pattern suggests it's ready for baking. What would you like to know about using it?`;
    } else if (healthStatus === 'attention') {
      return `Your ${starter?.name} starter shows moderate activity but could use some attention. I've analyzed the key indicators and can help you improve its health. What specific concerns do you have?`;
    } else {
      return `Your ${starter?.name} starter needs some care to restore its health. Based on the analysis, I can guide you through the steps to get it back to peak condition. What issues are you noticing?`;
    }
  };

  const handleSendMessage = async () => {
    if (inputText.trim().length === 0 || inputText.length > 500) return;

    const userMessage: Omit<ChatMessage, 'id'> = {
      analysisId: analysisId || '',
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    // Add user message
    addChatMessage(userMessage);
    const newMessages = [...messages, userMessage as ChatMessage];
    setMessages(newMessages);
    setInputText('');

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI response (replace with actual OpenAI integration)
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputText.trim());
      const aiMessage: Omit<ChatMessage, 'id'> = {
        analysisId: analysisId || '',
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      addChatMessage(aiMessage);
      setMessages(prev => [...prev, aiMessage as ChatMessage]);
      setIsTyping(false);
    }, 2000);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('float test')) {
      return "The float test is simple: drop a spoonful of starter in water. If it floats, it's ready to bake! This indicates enough gas production for good bread rise.";
    } else if (lowerMessage.includes('how long') || lowerMessage.includes('when')) {
      return "Since your starter has peaked, you can use it within the next 2-4 hours for optimal results. Look for doubling in size, pleasant tangy aroma, and that it passes the float test.";
    } else if (lowerMessage.includes('smell') || lowerMessage.includes('aroma')) {
      return "A healthy starter should have a pleasant, tangy aroma - like yogurt or sourdough bread. If it smells like nail polish remover or rotting, it may need attention.";
    } else if (lowerMessage.includes('feeding') || lowerMessage.includes('feed')) {
      return "For maintenance feeding, use your starter's preferred ratio (typically 1:1:1 or 1:2:2). Feed when it doubles and starts to fall, usually every 12-24 hours at room temperature.";
    } else {
      return "I'm here to help with any sourdough questions! Feel free to ask about feeding schedules, troubleshooting issues, baking timing, or anything else about your starter.";
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View style={styles.userMessageContent}>
            <View style={styles.userMessageBubble}>
              <Text style={styles.userMessageText}>{item.content}</Text>
            </View>
            <View style={styles.userMessageMeta}>
              <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
              <Text style={styles.messageSeparator}>•</Text>
              <Icon name="check" size={12} color={colors.success} />
            </View>
          </View>
          <View style={styles.userAvatar}>
            <Image
              source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg' }}
              style={styles.avatarImage}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.assistantMessageContainer}>
        <View style={styles.assistantAvatar}>
          <Icon name="cpu" size={16} color="white" />
        </View>
        <View style={styles.assistantMessageContent}>
          <View style={styles.assistantMessageBubble}>
            <Text style={styles.assistantMessageText}>{item.content}</Text>
          </View>
          <View style={styles.assistantMessageMeta}>
            <Text style={styles.messageTime}>AI Assistant</Text>
            <Text style={styles.messageSeparator}>•</Text>
            <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => (
    <View style={styles.assistantMessageContainer}>
      <View style={styles.assistantAvatar}>
        <Icon name="cpu" size={16} color="white" />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, { opacity: 0.4 }]} />
          <View style={[styles.typingDot, { opacity: 0.6 }]} />
          <View style={[styles.typingDot, { opacity: 0.8 }]} />
        </View>
      </View>
    </View>
  );

  const renderAnalysisSummary = () => {
    if (!analysis) return null;

    const isPhotoAnalysis = 'jsonResult' in analysis;
    const healthStatus = isPhotoAnalysis 
      ? (analysis as PhotoAnalysis).jsonResult.healthStatus 
      : ((analysis as CameraAnalysisResult).healthScore >= 7 ? 'healthy' : 
         (analysis as CameraAnalysisResult).healthScore >= 4 ? 'attention' : 'unhealthy');

    const riseStatus = isPhotoAnalysis 
      ? (analysis as PhotoAnalysis).jsonResult.riseHeight > 70 ? 'Good' : 'Low'
      : (analysis as CameraAnalysisResult).riseActivity.includes('Good') ? 'Good' : 'Moderate';

    const bubbleStatus = isPhotoAnalysis 
      ? (analysis as PhotoAnalysis).jsonResult.bubbleDensity > 70 ? 'Active' : 'Low'
      : (analysis as CameraAnalysisResult).bubbleFormation.includes('High') ? 'Active' : 'Moderate';

    return (
      <Card style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <Icon name="activity" size={16} color="white" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>
                {healthStatus === 'healthy' ? 'Analysis Complete' : 'Needs Attention'}
              </Text>
              <Text style={styles.summaryDescription}>
                {healthStatus === 'healthy' 
                  ? 'Your starter looks healthy with good bubble formation'
                  : 'Your starter shows signs that need attention'}
              </Text>
            </View>
          </View>
          <View style={styles.summaryMetrics}>
            <View style={[styles.metricChip, { backgroundColor: `${colors.success}20` }]}>
              <Text style={[styles.metricText, { color: colors.success }]}>
                Rise: {riseStatus}
              </Text>
            </View>
            <View style={[styles.metricChip, { backgroundColor: `${colors.success}20` }]}>
              <Text style={[styles.metricText, { color: colors.success }]}>
                Bubbles: {bubbleStatus}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  if (!starter) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Chat" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Starter not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderListData = () => {
    const data = [...messages];
    if (isTyping) {
      data.push({ id: 'typing', role: 'assistant' } as any);
    }
    return data;
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    if (item.id === 'typing') {
      return renderTypingIndicator();
    }
    return renderMessage({ item });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <View style={styles.headerContent}>
            <Chip
              mode="flat"
              style={styles.starterChip}
              textStyle={styles.chipText}
            >
              {starter.name}
            </Chip>
          </View>
          <Appbar.Action icon="more-vertical" onPress={() => {}} />
        </Appbar.Header>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          <FlatList
            ref={flatListRef}
            data={renderListData()}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id || `typing-${index}`}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderAnalysisSummary()}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        </View>

        {/* Message Composer */}
        <Surface style={styles.composer}>
          <View style={styles.composerContent}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask a follow-up question..."
                placeholderTextColor={`${colors.secondary}99`}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim().length > 0 && inputText.length <= 500 
                    ? colors.primary 
                    : `${colors.tertiary}66`
                }
              ]}
              onPress={handleSendMessage}
              disabled={inputText.trim().length === 0 || inputText.length > 500}
            >
              <Icon 
                name="send" 
                size={16} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.composerFooter}>
            <Text style={styles.poweredBy}>Powered by AI</Text>
            <Text style={[
              styles.charCount,
              { color: inputText.length > 500 ? colors.error : `${colors.secondary}99` }
            ]}>
              {inputText.length}/500
            </Text>
          </View>
        </Surface>
      </KeyboardAvoidingView>
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
    flex: 1,
    alignItems: 'center',
  },
  starterChip: {
    backgroundColor: `${colors.tertiary}20`,
  },
  chipText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
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
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
  },
  summaryContent: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
    fontFamily: 'Montserrat_600SemiBold',
  },
  summaryDescription: {
    fontSize: 12,
    color: `${colors.secondary}B3`,
    lineHeight: 16,
  },
  summaryMetrics: {
    flexDirection: 'row',
    gap: 8,
  },
  metricChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userMessageContent: {
    flex: 1,
    maxWidth: width * 0.75,
    marginRight: 8,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    borderTopRightRadius: 4,
    padding: 12,
    alignSelf: 'flex-end',
  },
  userMessageText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  assistantMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  assistantMessageContent: {
    flex: 1,
    maxWidth: width * 0.75,
  },
  assistantMessageBubble: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: `${colors.tertiary}20`,
    elevation: 1,
  },
  assistantMessageText: {
    color: colors.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  assistantMessageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  messageTime: {
    fontSize: 12,
    color: `${colors.secondary}99`,
  },
  messageSeparator: {
    fontSize: 12,
    color: `${colors.secondary}99`,
    marginHorizontal: 4,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: `${colors.tertiary}20`,
    elevation: 1,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    backgroundColor: `${colors.secondary}66`,
    borderRadius: 4,
  },
  composer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: `${colors.tertiary}20`,
    elevation: 8,
    marginBottom: 5,
  },
  composerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.tertiary}30`,
    maxHeight: 96,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.secondary,
    minHeight: 44,
    maxHeight: 96,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  poweredBy: {
    fontSize: 12,
    color: `${colors.secondary}99`,
  },
  charCount: {
    fontSize: 12,
  },
}); 