import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { OCRResult, OCRService, PreprocessingStep } from '../utils/ocrService';

interface BusinessOCRProps {
  onBusinessInfoExtracted?: (info: any) => void;
  documentType: 'business_permit' | 'mayors_permit' | 'tin_certificate';
}

export default function BusinessOCRScanner({ onBusinessInfoExtracted, documentType }: BusinessOCRProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedInfo, setExtractedInfo] = useState<any>(null);
  const [preprocessingSteps, setPreprocessingSteps] = useState<PreprocessingStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');

  // Process uploaded image with OCR
  const processUploadedImage = async (imageUri: string) => {
    try {
      setIsProcessing(true);
      setImage(imageUri);
      
      // Step 1: Start Advanced 7-Step OCR Pipeline
      setCurrentStep('Starting 7-step preprocessing...');
      
      const result: OCRResult = await OCRService.recognizeText(imageUri, (steps) => {
        setPreprocessingSteps([...steps]);
        const currentStepInfo = steps.find(s => !s.completed);
        if (currentStepInfo) {
          setCurrentStep(`Processing: ${currentStepInfo.name}`);
        } else {
          setCurrentStep('Analyzing text with ML Kit...');
        }
      });
      
      if (result.success) {
        setExtractedText(result.text);
        
        // Step 2: Extract business information
        const businessInfo = OCRService.extractBusinessInfo(result.text);
        setExtractedInfo(businessInfo);
        
        // Notify parent component
        if (onBusinessInfoExtracted) {
          onBusinessInfoExtracted({
            documentType,
            imageUri,
            text: result.text,
            extractedInfo: businessInfo
          });
        }
        
        setCurrentStep('✅ OCR Processing Complete!');
        
        Alert.alert(
          '🚀 Advanced OCR Complete!', 
          `✅ 7-Step preprocessing applied successfully!\n📝 Extracted ${result.text.length} characters\n🎯 Business info detected: ${Object.keys(businessInfo).filter(k => businessInfo[k]).length} fields`,
          [{ text: 'Excellent!' }]
        );
      } else {
        Alert.alert('OCR Error', result.error || 'Failed to extract text');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      const imageUri = await OCRService.pickImage();
      if (!imageUri) {
        return;
      }
      
      // Process the uploaded image with OCR
      await processUploadedImage(imageUri);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload document');
    }
  };

  const getDocumentTitle = () => {
    switch (documentType) {
      case 'business_permit':
        return 'Business Permit';
      case 'mayors_permit':
        return "Mayor's Permit";
      case 'tin_certificate':
        return 'TIN Certificate';
      default:
        return 'Document';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Scan {getDocumentTitle()}</Text>
      <Text style={styles.subtitle}>
        Upload your document image and let our 7-step OCR system automatically extract business information
      </Text>

      {/* Image Display */}
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      )}

      {/* Upload Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.uploadButton]} 
          onPress={handleUploadDocument}
          disabled={isProcessing}
        >
          <Ionicons name="cloud-upload" size={24} color="white" />
          <Text style={styles.buttonText}>Upload {getDocumentTitle()}</Text>
        </TouchableOpacity>
      </View>

      {/* Advanced Processing Indicator */}
      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.processingText}>
            🔬 Advanced OCR Pipeline
          </Text>
          <Text style={styles.processingSubtext}>
            {currentStep}
          </Text>
          
          {/* 7-Step Progress Indicator */}
          {preprocessingSteps.length > 0 && (
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsTitle}>📋 Processing Steps:</Text>
              {preprocessingSteps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <Text style={step.completed ? styles.stepCompleted : styles.stepPending}>
                    {step.completed ? '✅' : '⏳'} {step.name}
                  </Text>
                  {step.completed && step.processingTime && (
                    <Text style={styles.stepTime}>{step.processingTime}ms</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Extracted Information */}
      {extractedInfo && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Extracted Information:</Text>
          {Object.entries(extractedInfo).map(([key, value]: [string, any]) => (
            value && (
              <View key={key} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</Text>
                <Text style={styles.infoValue}>{value}</Text>
              </View>
            )
          ))}
        </View>
      )}

      {/* Raw Text (for debugging) */}
      {extractedText && (
        <View style={styles.textContainer}>
          <Text style={styles.textTitle}>Raw OCR Text:</Text>
          <ScrollView style={styles.textScroll} nestedScrollEnabled>
            <Text style={styles.extractedText}>{extractedText}</Text>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    minWidth: 200,
    justifyContent: 'center',
  },
  uploadButton: {
    backgroundColor: '#2e7d32',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  processingContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 20,
  },
  processingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginTop: 10,
  },
  processingSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  textContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  textTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  textScroll: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
  },
  extractedText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  // 7-Step Processing Styles
  stepsContainer: {
    marginTop: 15,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  stepCompleted: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  stepPending: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
  },
  stepTime: {
    fontSize: 10,
    color: '#999',
    fontWeight: '300',
  },
});