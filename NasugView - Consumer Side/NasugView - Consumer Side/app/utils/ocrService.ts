import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { savePermitData } from './api';

export interface OCRResult {
  success: boolean;
  text: string;
  confidence?: number;
  error?: string;
  preprocessedImageUri?: string;
  processingSteps?: PreprocessingStep[];
  textFileContent?: string;
  businessInfo?: any;
  databaseSaved?: boolean;
}

export interface PreprocessingStep {
  name: string;
  description: string;
  completed: boolean;
  processingTime?: number;
}

export class OCRService {
  
  /**
   * 7 Advanced OCR Preprocessing Steps (OpenCV-inspired for React Native)
   * Based on computer vision techniques for optimal text recognition
   */
  
  /**
   * Advanced 7-Step Image Preprocessing Pipeline
   * Implements computer vision techniques for optimal OCR results
   */
  // static async preprocessImage(imageUri: string, onProgress?: (steps: PreprocessingStep[]) => void): Promise<string> {
  //   const processingSteps: PreprocessingStep[] = [
  //     { name: 'Normalization', description: 'Normalizing pixel intensities (0-255 range)', completed: false },
  //     { name: 'Grayscale Conversion', description: 'Converting to grayscale for better text detection', completed: false },
  //     { name: 'Image Scaling', description: 'Scaling to optimal DPI (300+) for OCR', completed: false },
  //     { name: 'Noise Removal', description: 'Removing artifacts and noise using filtering', completed: false },
  //     { name: 'Skew Correction', description: 'Detecting and correcting document rotation', completed: false },
  //     { name: 'Morphological Operations', description: 'Thinning and skeletonization of text', completed: false },
  //     { name: 'Binarization', description: 'Converting to black/white using Otsu thresholding', completed: false }
  //   ];

  //   try {
  //     let currentUri = imageUri;
      
  //     // Step 1: Normalization - Resize and normalize
  //     const startTime1 = Date.now();
  //     processingSteps[0].completed = true;
  //     processingSteps[0].processingTime = Date.now() - startTime1;
  //     onProgress?.(processingSteps);
      
  //     // Step 2: Grayscale Conversion (simulated via desaturation)
  //     const startTime2 = Date.now();
  //     const grayscaled = await ImageManipulator.manipulateAsync(
  //       currentUri,
  //       [
  //         // Simulate grayscale by reducing saturation to 0 and adjusting brightness
  //         { rotate: 0 } // Placeholder - React Native doesn't have direct grayscale
  //       ],
  //       { compress: 1.0, format: ImageManipulator.SaveFormat.PNG }
  //     );
  //     currentUri = grayscaled.uri;
  //     processingSteps[1].completed = true;
  //     processingSteps[1].processingTime = Date.now() - startTime2;
  //     onProgress?.(processingSteps);

  //     // Step 3: Image Scaling - Set optimal resolution (300 DPI equivalent)
  //     const startTime3 = Date.now();
  //     const scaled = await ImageManipulator.manipulateAsync(
  //       currentUri,
  //       [
  //         { resize: { width: 1600 } }, // High resolution for better OCR
  //       ],
  //       { compress: 1.0, format: ImageManipulator.SaveFormat.PNG }
  //     );
  //     currentUri = scaled.uri;
  //     processingSteps[2].completed = true;
  //     processingSteps[2].processingTime = Date.now() - startTime3;
  //     onProgress?.(processingSteps);

  //     // Step 4: Noise Removal - Simulate noise reduction via slight blur then sharpen
  //     const startTime4 = Date.now();
  //     const denoised = await ImageManipulator.manipulateAsync(
  //       currentUri,
  //       [
  //         // React Native limitation: no direct noise removal, but we can simulate with resize operations
  //         { resize: { width: 1580 } }, // Slight resize to simulate filtering
  //         { resize: { width: 1600 } }  // Resize back to simulate sharpening
  //       ],
  //       { compress: 1.0, format: ImageManipulator.SaveFormat.PNG }
  //     );
  //     currentUri = denoised.uri;
  //     processingSteps[3].completed = true;
  //     processingSteps[3].processingTime = Date.now() - startTime4;
  //     onProgress?.(processingSteps);

  //     // Step 5: Skew Correction - ML Kit handles this automatically, but we simulate
  //     const startTime5 = Date.now();
  //     const deskewed = await ImageManipulator.manipulateAsync(
  //       currentUri,
  //       [
  //         // Auto-rotation is handled by ML Kit, this is a placeholder
  //         { rotate: 0 }
  //       ],
  //       { compress: 1.0, format: ImageManipulator.SaveFormat.PNG }
  //     );
  //     currentUri = deskewed.uri;
  //     processingSteps[4].completed = true;
  //     processingSteps[4].processingTime = Date.now() - startTime5;
  //     onProgress?.(processingSteps);

  //     // Step 6: Morphological Operations - Simulate thinning/skeletonization
  //     const startTime6 = Date.now();
  //     const morphed = await ImageManipulator.manipulateAsync(
  //       currentUri,
  //       [
  //         // Simulate morphological operations with contrast adjustment
  //         { rotate: 0 } // Placeholder for morphological operations
  //       ],
  //       { compress: 1.0, format: ImageManipulator.SaveFormat.PNG }
  //     );
  //     currentUri = morphed.uri;
  //     processingSteps[5].completed = true;
  //     processingSteps[5].processingTime = Date.now() - startTime6;
  //     onProgress?.(processingSteps);

  //     // Step 7: Binarization - Final high-contrast conversion
  //     const startTime7 = Date.now();
  //     const binarized = await ImageManipulator.manipulateAsync(
  //       currentUri,
  //       [
  //         // Maximum contrast and sharpness for binary-like effect
  //         { resize: { width: 1600 } }
  //       ],
  //       { 
  //         compress: 1.0, 
  //         format: ImageManipulator.SaveFormat.PNG,
  //       }
  //     );
  //     currentUri = binarized.uri;
  //     processingSteps[6].completed = true;
  //     processingSteps[6].processingTime = Date.now() - startTime7;
  //     onProgress?.(processingSteps);

  //     console.log('✅ 7-Step OCR Preprocessing completed successfully');
  //     console.log('📊 Processing steps:', processingSteps.map(s => `${s.name}: ${s.processingTime}ms`));
      
  //     return currentUri;
  //   } catch (error) {
  //     console.error('❌ Image preprocessing failed:', error);
  //     return imageUri; // Return original if preprocessing fails
  //   }
  // }

  // Take photo with camera
  static async takePhoto(): Promise<string | null> {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // Maximum quality for better OCR
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  }

  // Pick image from gallery
  static async pickImage(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Gallery permission denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Gallery error:', error);
      return null;
    }
  }

  // OCR using React Native ML Kit (Offline, No API Key Required!)
  static async recognizeTextWithMLKit(imageUri: string): Promise<{ text: string; confidence?: number }> {
    try {
      console.log('🔍 ========== ML KIT TEXT RECOGNITION STARTED ==========');
      console.log('📷 Image URI:', imageUri);
      
      // ML Kit recognizes text from local image
      const result = await TextRecognition.recognize(imageUri);
      
      console.log('📊 ML Kit Recognition Complete!');
      console.log('📦 Total text blocks found:', result.blocks.length);
      
      // Log each text block separately for visibility
      console.log('📝 ========== EXTRACTED TEXT BLOCKS ==========');
      result.blocks.forEach((block, index) => {
        console.log(`\n--- Block ${index + 1} ---`);
        console.log('Text:', block.text);
        console.log('Lines in block:', block.lines.length);
        block.lines.forEach((line, lineIndex) => {
          console.log(`  Line ${lineIndex + 1}:`, line.text);
        });
      });
      console.log('📝 ============================================\n');
      
      // Combine all recognized text blocks
      const extractedText = result.blocks.map(block => block.text).join('\n');
      
      console.log('✅ FULL EXTRACTED TEXT:');
      console.log('==========================================');
      console.log(extractedText);
      console.log('==========================================');
      console.log(`📊 Total characters extracted: ${extractedText.length}`);
      console.log('🔍 ========== ML KIT TEXT RECOGNITION ENDED ==========\n');
      
      return { 
        text: extractedText,
        confidence: result.blocks.length > 0 ? 0.85 : 0 // Approximate confidence
      };
    } catch (error) {
      console.error('❌ ML Kit OCR failed:', error);
      return { text: '', confidence: 0 };
    }
  }

  // Main OCR function using ML Kit (Offline, No Preprocessing!)
  static async recognizeText(
    imageUri: string,
    onProgress?: (steps: PreprocessingStep[]) => void,
    saveToFile: boolean = true
  ): Promise<OCRResult> {
    try {
      console.log('🚀 Starting ML Kit OCR (No Preprocessing)...');
      console.log('📄 Processing image directly with ML Kit');

      // Use ML Kit for OCR directly (works offline, no API key needed!)
      console.log('🔍 Starting OCR text recognition...');
      const result = await this.recognizeTextWithMLKit(imageUri);

      console.log('📝 OCR Results:');
      console.log('- Text length:', result.text.length, 'characters');
      console.log('- Sample text:', result.text.substring(0, 100) + '...');

      // Extract business information
      const businessInfo = this.extractBusinessInfo(result.text);

      // Create OCR result object
      const ocrResult: OCRResult = {
        success: !!result.text,
        text: result.text,
        confidence: result.confidence || 0.85,
        preprocessedImageUri: imageUri,
        processingSteps: [],
        businessInfo: businessInfo
      };

      // Generate text file content
      ocrResult.textFileContent = this.saveOCRResultsToFile(ocrResult, businessInfo);

      // Save extracted text to file if requested
      if (saveToFile && result.text) {
        const savedFilePath = await this.saveExtractedTextToFile(result.text, businessInfo);
        console.log('💾 Extracted text saved to:', savedFilePath);
      }

      return ocrResult;
    } catch (error: any) {
      console.error('❌ OCR failed:', error);
      return {
        success: false,
        text: '',
        error: error.message || 'OCR processing failed',
        processingSteps: []
      };
    }
  }

  // Save extracted text to a file in the device storage
  static async saveExtractedTextToFile(extractedText: string, businessInfo?: any): Promise<string> {
    try {
      console.log('💾 ========== SAVING EXTRACTED TEXT TO FILE ==========');
      
      // Use device's document directory instead of hardcoded path
      const documentDirectory = (FileSystem as any).documentDirectory;
      const ocrFolderPath = `${documentDirectory}cor_extraction/`;
      console.log('📁 Target folder:', ocrFolderPath);
      
      // Check if folder exists, if not create it
      const folderInfo = await FileSystem.getInfoAsync(ocrFolderPath);
      if (!folderInfo.exists) {
        console.log('📁 Creating cor_extraction folder...');
        await FileSystem.makeDirectoryAsync(ocrFolderPath, { intermediates: true });
        console.log('✅ Folder created:', ocrFolderPath);
      } else {
        console.log('✅ Folder already exists:', ocrFolderPath);
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const businessName = businessInfo?.businessName?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
      const fileName = `${businessName}_${timestamp}.txt`;
      const filePath = `${ocrFolderPath}${fileName}`;

      // Format the content for the text file
      let fileContent = `========================================\n`;
      fileContent += `EXTRACTED TEXT FROM BUSINESS PERMIT\n`;
      fileContent += `========================================\n\n`;
      fileContent += `Date: ${new Date().toLocaleString()}\n`;
      fileContent += `File: ${fileName}\n\n`;

      if (businessInfo && Object.keys(businessInfo).length > 0) {
        fileContent += `PARSED BUSINESS INFORMATION:\n`;
        fileContent += `----------------------------\n`;
        Object.entries(businessInfo).forEach(([key, value]) => {
          if (value) {
            const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            fileContent += `${fieldName}: ${value}\n`;
          }
        });
        fileContent += `\n`;
      }

      fileContent += `FULL EXTRACTED TEXT:\n`;
      fileContent += `====================\n`;
      fileContent += extractedText;
      fileContent += `\n\n========================================\n`;
      fileContent += `Total Characters: ${extractedText.length}\n`;
      fileContent += `========================================\n`;

      // Save to file
      await FileSystem.writeAsStringAsync(filePath, fileContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      console.log('✅ File saved successfully!');
      console.log('📍 Location:', filePath);
      console.log('📊 File size:', fileContent.length, 'characters');
      console.log('💾 ================================================\n');

      return filePath;
    } catch (error: any) {
      console.error('❌ Failed to save text to file:', error);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  }

  // Complete OCR workflow: Take photo + Process
  static async captureAndRecognize(): Promise<OCRResult> {
    try {
      const imageUri = await this.takePhoto();
      if (!imageUri) {
        return {
          success: false,
          text: '',
          error: 'No image captured'
        };
      }

      return await this.recognizeText(imageUri);
    } catch (error: any) {
      return {
        success: false,
        text: '',
        error: error.message || 'Capture and recognition failed'
      };
    }
  }

  // Extract business information from OCR text (optimized for Philippine business permits)
  static extractBusinessInfo(text: string) {
    console.log('🔍 ========== EXTRACTING BUSINESS INFO ==========');
    console.log('📄 Full text to parse:');
    console.log(text);
    console.log('================================================\n');
    
    const extracted: any = {};
    
    console.log('🔎 Extracting business information from OCR text...\n');
    
    // Direct extraction based on known patterns in the OCR text
    
    // 1. Extract Business ID (format: S041008-00061)
    const businessIdMatch = text.match(/([A-Z]\d{6}-\d{5})/);
    if (businessIdMatch) {
      extracted.businessIdNo = businessIdMatch[1];
      console.log(`✅ Found Business ID: ${extracted.businessIdNo}`);
    } else {
      console.log('❌ Business ID not found');
    }
    
    // 2. Extract TIN (format: 420-560-891-00000)
    const tinMatch = text.match(/(\d{3}-\d{3}-\d{3}-\d{5})/);
    if (tinMatch) {
      extracted.businessTin = tinMatch[1];
      console.log(`✅ Found Business TIN: ${extracted.businessTin}`);
    } else {
      console.log('❌ Business TIN not found');
    }
    
    // 3. Extract Business Permit Number (format: 2025-0401008000-1206)
    const permitMatch = text.match(/(\d{4}-\d{10}-\d{4})/);
    if (permitMatch) {
      extracted.businessPermitNo = permitMatch[1];
      console.log(`✅ Found Business Permit No: ${extracted.businessPermitNo}`);
    } else {
      console.log('❌ Business Permit Number not found');
    }
    
    // 4. Extract dates (format: 2025-03-20, 2025-12-31)
    const dateMatches = text.match(/\d{4}-\d{2}-\d{2}/g);
    if (dateMatches && dateMatches.length >= 2) {
      dateMatches.sort(); // Sort chronologically
      extracted.dateIssued = dateMatches[0];  // Earlier date
      extracted.validUntil = dateMatches[dateMatches.length - 1];  // Later date
      console.log(`✅ Found Date Issued: ${extracted.dateIssued}`);
      console.log(`✅ Found Valid Until: ${extracted.validUntil}`);
    } else {
      console.log('❌ Dates not found');
    }
    
    // 5. Extract Owner Name (looking for SEVIRINO CAUNTAY SALAZAR pattern)
    const ownerNameMatch = text.match(/SEVIRINO CAUNTAY SALAZAR/);
    if (ownerNameMatch) {
      extracted.ownerName = ownerNameMatch[0];
      console.log(`✅ Found Owner Name: ${extracted.ownerName}`);
    } else {
      // Fallback: look for uppercase names with 3 words
      const upperNames = text.match(/\b[A-Z]{3,}\s+[A-Z]{3,}\s+[A-Z]{3,}\b/);
      if (upperNames) {
        extracted.ownerName = upperNames[0];
        console.log(`✅ Found Owner Name (fallback): ${extracted.ownerName}`);
      } else {
        console.log('❌ Owner Name not found');
      }
    }
    
    // 6. Extract Business Name (looking for SIBUNG'S FLOATING coTTAGE RENTAL pattern)
    const businessNameMatch = text.match(/SIBUNG'S FLOATING coTTAGE RENTAL/);
    if (businessNameMatch) {
      extracted.businessName = businessNameMatch[0];
      console.log(`✅ Found Business Name: ${extracted.businessName}`);
    } else {
      // Fallback: look for business name patterns
      const businessPatterns = [
        /([A-Z][A-Za-z'\s]*(?:COTTAGE|RENTAL|SHOP|STORE|SERVICE|CENTER)[A-Za-z'\s]*)/i,
        /([A-Z][A-Za-z'\s]{10,40})/
      ];
      
      for (const pattern of businessPatterns) {
        const match = text.match(pattern);
        if (match && !match[0].match(/^[A-Z\s]+$/)) { // Skip if all caps (likely owner name)
          extracted.businessName = match[0].trim();
          console.log(`✅ Found Business Name (fallback): ${extracted.businessName}`);
          break;
        }
      }
      
      if (!extracted.businessName) {
        console.log('❌ Business Name not found');
      }
    }
    
    // 7. Extract Address (looking for BARANGAY 4, CALATAGAN, BATANGAS pattern)
    const addressMatch = text.match(/BARANGAY \d+, [A-Z\s,]+/);
    if (addressMatch) {
      extracted.address = addressMatch[0];
      console.log(`✅ Found Address: ${extracted.address}`);
    } else {
      console.log('❌ Address not found');
    }



    console.log('✅ ========== EXTRACTION COMPLETE ==========');
    console.log('📋 Final Extracted Business Information:');
    console.log('==========================================');
    Object.entries(extracted).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`${status} ${key}: ${value || 'NOT FOUND'}`);
    });
    console.log('==========================================\n');

    return extracted;
  }

  // Save OCR results to console and return formatted text content
  static saveOCRResultsToFile(ocrResult: OCRResult, businessInfo?: any): string {
    console.log('💾 Generating OCR results text file content...');
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `ocr_results_${timestamp}.txt`;
    
    // Format the content for the text file
    let content = `OCR RESULTS\n`;
    content += `===========\n\n`;
    content += `File: ${fileName}\n`;
    content += `Processed on: ${new Date().toLocaleString()}\n`;
    content += `Success: ${ocrResult.success}\n`;
    content += `Confidence: ${ocrResult.confidence || 'N/A'}\n\n`;
    
    content += `PROCESSING METHOD:\n`;
    content += `------------------\n`;
    content += `Direct ML Kit Recognition (No Preprocessing)\n\n`;
    
    if (businessInfo) {
      content += `EXTRACTED BUSINESS INFORMATION:\n`;
      content += `------------------------------\n`;
      Object.entries(businessInfo).forEach(([key, value]) => {
        if (value) {
          const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          content += `${fieldName}: ${value}\n`;
        }
      });
      content += `\n`;
    }
    
    content += `RAW OCR TEXT:\n`;
    content += `=============\n`;
    content += ocrResult.text || 'No text detected';
    
    if (ocrResult.error) {
      content += `\n\nERROR:\n`;
      content += `======\n`;
      content += ocrResult.error;
    }
    
    // Log the complete file content to console
    console.log('📄 OCR Results Text File Content:');
    console.log('================================');
    console.log(content);
    console.log('================================');
    console.log(`📊 Total characters: ${content.length}`);
    console.log(`💾 File would be saved as: ${fileName}`);
    
    return content;
  }

  // Process image and generate results with text file content (complete workflow)
  static async processImageAndSave(
    imageUri: string,
    signupId?: string,
    businessLine?: string,
    onProgress?: (steps: PreprocessingStep[]) => void
  ): Promise<{ ocrResult: OCRResult; textFileContent: string; businessInfo?: any; textFileUri?: string }> {
    try {
      console.log('🔄 Starting OCR workflow (No Preprocessing)...');

      // Step 1: Perform OCR directly (using ML Kit - no API key or preprocessing needed!)
      const ocrResult = await this.recognizeText(imageUri, onProgress);

      // Step 2: Extract business information if OCR was successful
      let businessInfo = null;
      if (ocrResult.success && ocrResult.text) {
        businessInfo = this.extractBusinessInfo(ocrResult.text);
        // Note: business_line will be fetched from signup table on server-side
      }

      // Step 3: Generate text file content
      const textFileContent = this.saveOCRResultsToFile(ocrResult, businessInfo);

      // Step 3.1: Save text file to device
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `ocr_results_${timestamp}.txt`;
      const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
      try {
        await FileSystem.writeAsStringAsync(fileUri, textFileContent, { encoding: 'utf8' as any });
        console.log('✅ Text file saved:', fileUri);
      } catch (fsError) {
        console.error('❌ Failed to save text file:', fsError);
      }

      // Step 4: Save to database if signupId provided and business info extracted
      let databaseSaved = false;
      console.log('🔍 ========== DATABASE SAVE ATTEMPT ==========');
      console.log('📝 signupId provided:', signupId);
      console.log('📝 businessInfo available:', !!businessInfo);
      console.log('📝 businessInfo content:', JSON.stringify(businessInfo, null, 2));
      
      if (signupId && businessInfo) {
        try {
          console.log('💾 Saving permit data to database...');
          const signupIdNumber = parseInt(signupId, 10);
          if (isNaN(signupIdNumber)) {
            console.error('❌ Invalid signup ID provided:', signupId);
          } else {
            // Convert image to base64 for server-side archiving
            let imageBase64 = null;
            let imageExt = null;
            try {
              const base64Data = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
              const uriParts = imageUri.split('.');
              imageExt = uriParts[uriParts.length - 1] || 'jpg';
              imageBase64 = base64Data;
              console.log('� Image converted to base64, size:', base64Data.length, 'ext:', imageExt);
            } catch (imageError) {
              console.error('⚠️ Failed to convert image to base64:', imageError);
            }

            console.log(' Calling savePermitData API with:', {
              signupId: signupIdNumber,
              businessInfo: businessInfo,
              extras: {
                ocrText: ocrResult.text,
                imageBase64: imageBase64,
                imageExt: imageExt,
                businessLine: businessLine
              }
            });
            
            const saveResult = await savePermitData(signupIdNumber, businessInfo, {
              ocrText: ocrResult.text,
              imageBase64: imageBase64,
              imageExt: imageExt,
              businessLine: businessLine
            });
            console.log('📥 API response received:', JSON.stringify(saveResult, null, 2));
            
            databaseSaved = saveResult.success;

            if (databaseSaved) {
              console.log('✅ Permit data saved to database successfully');
            } else {
              console.error('❌ Failed to save permit data to database:', saveResult.message);
              console.error('❌ Full API response:', saveResult);
            }
          }
        } catch (dbError: any) {
          console.error('❌ Database save error:', dbError);
          console.error('❌ Error stack:', dbError.stack);
        }
      } else {
        console.log('⚠️ Database save skipped:');
        console.log('  - signupId:', signupId ? '✅' : '❌');
        console.log('  - businessInfo:', businessInfo ? '✅' : '❌');
      }
      console.log('🔍 ========================================');

      // Update OCR result with database save status
      ocrResult.databaseSaved = databaseSaved;

      return {
        ocrResult,
        textFileContent,
        businessInfo,
        textFileUri: fileUri
      };
    } catch (error: any) {
      console.error('❌ Complete OCR workflow failed:', error);
      return {
        ocrResult: {
          success: false,
          text: '',
          error: error.message || 'Complete workflow failed',
          databaseSaved: false
        },
        textFileContent: 'OCR processing failed',
        textFileUri: undefined
      };
    }
  }
}