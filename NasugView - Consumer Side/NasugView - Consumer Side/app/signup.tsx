import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { getBusinessLines, signupUser, testConnection } from './utils/api'; // ✅ Using centralized API
import { OCRService } from './utils/ocrService';

export default function Signup() {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [roleOpen, setRoleOpen] = useState(false);
  const [roleValue, setRoleValue] = useState("consumer");
  const [roleItems, setRoleItems] = useState([
    { label: "Consumer", value: "consumer" },
    { label: "Business Owner", value: "business_owner" },
  ]);

  // Document upload state - single document for business/mayor's permit
  const [businessDocument, setBusinessDocument] = useState<any>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  // ✅ New states for Business Line dropdown
  const [businessLineOpen, setBusinessLineOpen] = useState(false);
  const [businessLineValue, setBusinessLineValue] = useState(null);
  const [businessLineItems, setBusinessLineItems] = useState<any[]>([]);

  // ✅ Fetch business lines from database
  useEffect(() => {
    if (roleValue === "business_owner") {
      console.log('📋 User selected Business Owner - fetching business lines...');
      
      getBusinessLines()
        .then((data) => {
          console.log('📋 Business lines response:', data);
          
          if (data.success) {
            setBusinessLineItems(data.data);
            console.log(`✅ Loaded ${data.data.length} business lines`);
          } else {
            console.error('❌ Failed to load business lines:', data.message);
            Alert.alert(
              "Connection Error", 
              data.message || "Failed to load business lines.\n\nPlease check:\n- XAMPP is running\n- Phone is on WiFi\n- Server is reachable",
              [
                { text: "Retry", onPress: () => setRoleValue("consumer") },
                { text: "Cancel", style: "cancel" }
              ]
            );
          }
        })
        .catch((error) => {
          console.error('💥 Exception fetching business lines:', error);
          Alert.alert(
            "Network Error", 
            "Could not connect to server.\n\nPlease ensure:\n1. XAMPP Apache is running\n2. Your phone is on WiFi (192.168.254.x)\n3. Windows Firewall allows connections",
            [
              { text: "Retry", onPress: () => setRoleValue("consumer") },
              { text: "Cancel", style: "cancel" }
            ]
          );
        });
    }
  }, [roleValue]);

  // 🧪 Test server connection
  const handleTestConnection = async () => {
    console.log('🧪 Testing server connection...');
    Alert.alert("Testing Connection", "Checking server connectivity...");
    
    const result = await testConnection();
    
    if (result.success) {
      Alert.alert(
        "✅ Connection Successful", 
        `Server is reachable!\n\nTimestamp: ${result.timestamp}\nYou can proceed with signup.`
      );
    } else {
      Alert.alert(
        "❌ Connection Failed", 
        result.message + "\n\nPlease fix the connection before signing up."
      );
    }
  };

  // ✅ Email validation
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ✅ Password checklist validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // ✅ Pick business document and immediately extract text
  const pickBusinessDocument = async () => {
    console.log('📄 ========== DOCUMENT PICKER STARTED ==========');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      console.log('📄 Document picker result:', JSON.stringify(result, null, 2));

      if (!result.canceled) {
        const selectedDoc = result.assets[0];
        
        console.log('📄 Selected document:');
        console.log('  - Name:', selectedDoc.name);
        console.log('  - URI:', selectedDoc.uri);
        console.log('  - Type:', selectedDoc.mimeType);
        console.log('  - Size:', selectedDoc.size, 'bytes');
        
        setBusinessDocument(selectedDoc);
        
        // Immediately process OCR to show extracted text
        const isImage = selectedDoc.mimeType?.startsWith('image/');
        const isPDF = selectedDoc.mimeType === 'application/pdf';
        
        console.log('📄 Document type check:');
        console.log('  - Is Image:', isImage);
        console.log('  - Is PDF:', isPDF);
        
        if (isImage || isPDF) {
          setIsProcessingOCR(true);
          setExtractedText("");
          setOcrSuccess(false);
          
          try {
            Alert.alert(
              "Processing Document",
              "Extracting text from your permit...",
              [{ text: "OK" }]
            );
            
            console.log('🔍 ========== STARTING OCR ON UPLOADED ATTACHMENT ==========');
            console.log('📄 Document name:', selectedDoc.name);
            console.log('📄 Document type:', selectedDoc.mimeType);
            console.log('📄 Document URI:', selectedDoc.uri);
            console.log('');
            
            // Process OCR without saving to database yet (using ML Kit - works offline!)
            const ocrResult = await OCRService.recognizeText(selectedDoc.uri);
            
            console.log('\n� ========== OCR RESULT RECEIVED ==========');
            console.log('Success:', ocrResult.success);
            console.log('Text length:', ocrResult.text?.length || 0);
            console.log('Confidence:', ocrResult.confidence);
            console.log('Error:', ocrResult.error || 'None');
            
            if (ocrResult.success && ocrResult.text) {
              console.log('\n✅ ========== DATA EXTRACTED FROM IMAGE ==========');
              console.log('📊 Total characters extracted:', ocrResult.text.length);
              console.log('📝 Full extracted text:');
              console.log('==========================================');
              console.log(ocrResult.text);
              console.log('==========================================\n');
              
              // Log business info if available
              if (ocrResult.businessInfo) {
                console.log('🏢 ========== PARSED BUSINESS INFORMATION ==========');
                console.log('Business Name:', ocrResult.businessInfo.businessName || 'Not found');
                console.log('Owner Name:', ocrResult.businessInfo.ownerName || 'Not found');
                console.log('Business TIN:', ocrResult.businessInfo.businessTin || 'Not found');
                console.log('Permit Number:', ocrResult.businessInfo.businessPermitNo || 'Not found');
                console.log('Date Issued:', ocrResult.businessInfo.dateIssued || 'Not found');
                console.log('Valid Until:', ocrResult.businessInfo.validUntil || 'Not found');
                console.log('Address:', ocrResult.businessInfo.address || 'Not found');
                console.log('Business ID No:', ocrResult.businessInfo.businessIdNo || 'Not found');
                console.log('====================================================\n');
              }
              
              setExtractedText(ocrResult.text);
              setOcrSuccess(true);
              
              console.log('✅ Data extraction complete! Showing alert to user...\n');
              
              // Show extracted text to user
              Alert.alert(
                "✅ Text Extracted Successfully!",
                `Found ${ocrResult.text.length} characters of text.\n\nExtracted Text Preview:\n\n${ocrResult.text.substring(0, 300)}${ocrResult.text.length > 300 ? '...' : ''}`,
                [
                  {
                    text: "View Full Text",
                    onPress: () => {
                      console.log('👁️ User viewing full extracted text');
                      Alert.alert("Full Extracted Text", ocrResult.text);
                    }
                  },
                  { text: "OK" }
                ]
              );
            } else {
              console.log('❌ OCR extraction failed');
              console.log('  - Success:', ocrResult.success);
              console.log('  - Text:', ocrResult.text);
              console.log('  - Error:', ocrResult.error);
              
              setOcrSuccess(false);
              setExtractedText("");
              Alert.alert(
                "⚠️ Extraction Failed",
                "Could not extract text from document. You can still proceed with signup and admin will review manually.",
                [{ text: "OK" }]
              );
            }
          } catch (ocrError: any) {
            console.error('💥 OCR error caught:', ocrError);
            console.error('💥 Error message:', ocrError?.message);
            console.error('💥 Error stack:', ocrError?.stack);
            console.error('💥 Full error:', JSON.stringify(ocrError, null, 2));
            
            setOcrSuccess(false);
            Alert.alert(
              "Processing Error",
              `Failed to process document: ${ocrError?.message || 'Unknown error'}. You can still proceed with signup.`,
              [{ text: "OK" }]
            );
          } finally {
            console.log('🏁 OCR processing complete, setting isProcessingOCR to false');
            setIsProcessingOCR(false);
          }
        }
      }
    } catch (error: any) {
      console.error('💥 Document picker error:', error);
      console.error('💥 Error message:', error?.message);
      Alert.alert("Error", `Failed to attach document: ${error?.message || 'Unknown error'}`);
    }
    console.log('📄 ========== DOCUMENT PICKER ENDED ==========');
  };



  const handleSignup = async () => {
    console.log('🚀 ========== SIGNUP PROCESS STARTED ==========');
    console.log('📧 Email:', email);
    console.log('👤 Username:', username);
    console.log('🔐 Password length:', password?.length || 0);
    console.log('✅ Confirm password length:', confirmPassword?.length || 0);
    console.log('👔 Role:', roleValue);
    console.log('🏢 Business Line ID:', businessLineValue);
    console.log('📄 Business Document:', businessDocument ? 'ATTACHED' : 'NOT ATTACHED');
    console.log('📝 Extracted Text Length:', extractedText?.length || 0);
    console.log('✅ OCR Success:', ocrSuccess);
    
    if (!email || !username || !password || !confirmPassword) {
      console.log('❌ Validation failed: Missing required fields');
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      console.log('❌ Validation failed: Invalid email format');
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (
      !(
        passwordChecks.length &&
        passwordChecks.uppercase &&
        passwordChecks.lowercase &&
        passwordChecks.number &&
        passwordChecks.special
      )
    ) {
      console.log('❌ Validation failed: Weak password');
      console.log('Password checks:', passwordChecks);
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Validation failed: Passwords do not match');
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (roleValue === "business_owner" && !businessDocument) {
      console.log('❌ Validation failed: Business document required but not attached');
      Alert.alert("Missing Document", "Please attach your Business Permit or Mayor's Permit.");
      return;
    }

    if (roleValue === "business_owner" && !businessLineValue) {
      console.log('❌ Validation failed: Business line not selected');
      Alert.alert("Error", "Please select your business line.");
      return;
    }

    console.log('✅ All validations passed! Creating FormData...');
    setIsLoading(true);
    const formData = new FormData();

    formData.append("email", email);
    formData.append("username", username);
    formData.append("password", password);
    formData.append("role", roleValue);
    formData.append("business_line_id", businessLineValue || "");
    
    console.log('📦 FormData created with fields:');
    console.log('  - email:', email);
    console.log('  - username:', username);
    console.log('  - password: [HIDDEN]');
    console.log('  - role:', roleValue);
    console.log('  - business_line_id:', businessLineValue || "");

    if (roleValue === "business_owner" && businessDocument) {
      console.log('📄 Adding business document to FormData:');
      console.log('  - URI:', businessDocument.uri);
      console.log('  - Type:', businessDocument.mimeType || "application/pdf");
      console.log('  - Name:', businessDocument.name || "business_permit.pdf");
      console.log('  - Size:', businessDocument.size);
      
      // Default to business_permit field name for backend compatibility
      formData.append("business_permit", {
        uri: businessDocument.uri,
        type: businessDocument.mimeType || "application/pdf",
        name: businessDocument.name || "business_permit.pdf",
      } as any);
    }

    try {
      console.log('🌐 Sending signup request to backend...');
      const result = await signupUser(formData);
      console.log('📥 Received response from backend:', JSON.stringify(result, null, 2));
      setIsLoading(false);

      if (result.success) {
        // If business owner with successfully extracted text, save to database
        if (roleValue === "business_owner" && businessDocument && result.signup_id && ocrSuccess && extractedText) {
          try {
            console.log('📊 Saving extracted permit data to database...');
            
            // Get the business line name from the selected ID
            const selectedBusinessLine = businessLineItems.find(item => item.value === businessLineValue);
            const businessLineName = selectedBusinessLine?.label || null;
            
            console.log('🏢 Selected business line:', {
              id: businessLineValue,
              name: businessLineName
            });
            
            const ocrResult = await OCRService.processImageAndSave(
              businessDocument.uri,
              result.signup_id.toString(),
              businessLineName
            );
            
            if (ocrResult.ocrResult.databaseSaved) {
              console.log('✅ Business permit data saved to database');
            } else {
              console.log('⚠️ Database save failed - admin will review manually');
            }
          } catch (ocrError) {
            console.error('❌ Database save failed:', ocrError);
            console.error('❌ Error details:', JSON.stringify(ocrError, null, 2));
            // Don't block the signup flow - just log the error
          }
        } else {
          console.log('ℹ️ Skipping OCR database save:');
          console.log('  - Is Business Owner:', roleValue === "business_owner");
          console.log('  - Has Document:', !!businessDocument);
          console.log('  - Has Signup ID:', !!result.signup_id);
          console.log('  - OCR Success:', ocrSuccess);
          console.log('  - Has Extracted Text:', !!extractedText);
        }

        if (roleValue === "business_owner") {
          console.log('🎉 Business owner signup complete - awaiting approval');
          Alert.alert(
            "Success",
            "Signup successful! Please check your email for approval verification."
          );
        } else {
          console.log('🎉 Consumer signup complete');
          Alert.alert("Success", "Signup successful! You can now log in.");
        }

        console.log('🧭 Navigating to Tabs screen...');
        navigation.replace("Tabs", { username });
      } else {
        console.log('❌ Signup failed!');
        console.log('❌ Error message:', result.message);
        console.log('❌ Full result:', JSON.stringify(result, null, 2));
        Alert.alert("Error", result.message || "Signup failed.");
      }
    } catch (error: any) {
      console.log('💥 ========== SIGNUP ERROR ==========');
      console.error('❌ Caught exception:', error);
      console.error('❌ Error name:', error?.name);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      console.log('💥 ====================================');
      
      setIsLoading(false);
      Alert.alert("Error", `Could not connect to the server.\n\nDetails: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <KeyboardAwareScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create an Account</Text>

      <DropDownPicker
        open={roleOpen}
        value={roleValue}
        items={roleItems}
        setOpen={setRoleOpen}
        setValue={setRoleValue}
        setItems={setRoleItems}
        style={styles.dropdown}
        placeholder="Select Role"
        dropDownContainerStyle={{ borderColor: "#ccc" }}
        listMode="SCROLLVIEW"
      />

      {/* ✅ Business Line Dropdown (only for Business Owners) */}
      {roleValue === "business_owner" && (
        <>
          <DropDownPicker
            open={businessLineOpen}
            value={businessLineValue}
            items={businessLineItems}
            setOpen={setBusinessLineOpen}
            setValue={setBusinessLineValue}
            setItems={setBusinessLineItems}
            style={styles.dropdown}
            placeholder="Select Business Line"
            dropDownContainerStyle={{ borderColor: "#ccc" }}
            listMode="SCROLLVIEW"
          />
          
          {/* 🧪 Test Connection Button */}
          {businessLineItems.length === 0 && (
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={handleTestConnection}
            >
              <Text style={styles.testButtonText}>🧪 Test Server Connection</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Username"
        placeholderTextColor="#888"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={22}
            color="#008000"
          />
        </TouchableOpacity>
      </View>

      {/* ✅ Password Checklist */}
      <View style={styles.checklist}>
        <Text style={passwordChecks.length ? styles.valid : styles.invalid}>
          • At least 8 characters
        </Text>
        <Text style={passwordChecks.uppercase ? styles.valid : styles.invalid}>
          • One uppercase letter
        </Text>
        <Text style={passwordChecks.lowercase ? styles.valid : styles.invalid}>
          • One lowercase letter
        </Text>
        <Text style={passwordChecks.number ? styles.valid : styles.invalid}>
          • One number
        </Text>
        <Text style={passwordChecks.special ? styles.valid : styles.invalid}>
          • One special character
        </Text>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          style={styles.passwordInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirm}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Ionicons
            name={showConfirm ? "eye-outline" : "eye-off-outline"}
            size={22}
            color="#008000"
          />
        </TouchableOpacity>
      </View>

      {roleValue === "business_owner" && (
        <View style={{ width: "100%" }}>
          {/* Document Upload */}
          <TouchableOpacity 
            style={styles.textUpload} 
            onPress={pickBusinessDocument}
            disabled={isProcessingOCR}
          >
            <Ionicons 
              name={businessDocument ? "checkmark-circle" : "document-attach-outline"} 
              size={18} 
              color={businessDocument ? "#00a000" : "#008000"} 
            />
            <Text style={styles.textUploadLabel}>
              {isProcessingOCR 
                ? "Processing document..." 
                : businessDocument 
                  ? businessDocument.name 
                  : "Attach Business/Mayor's Permit (Image/PDF)"
              }
            </Text>
          </TouchableOpacity>

          {/* Show OCR Status */}
          {businessDocument && !isProcessingOCR && (
            <View style={styles.ocrStatusContainer}>
              <Ionicons 
                name={ocrSuccess ? "checkmark-circle" : "alert-circle"} 
                size={16} 
                color={ocrSuccess ? "#00a000" : "#ff9800"} 
              />
              <Text style={[styles.ocrStatusText, { color: ocrSuccess ? "#00a000" : "#ff9800" }]}>
                {ocrSuccess 
                  ? `✓ Text extracted (${extractedText.length} characters)` 
                  : "⚠ Text extraction failed - manual review needed"
                }
              </Text>
            </View>
          )}

          {isProcessingOCR && (
            <View style={styles.ocrStatusContainer}>
              <ActivityIndicator size="small" color="#008000" />
              <Text style={styles.ocrStatusText}>Extracting text from document...</Text>
            </View>
          )}

          <Text style={styles.noteText}>
            * Upload an image or PDF of your Business Permit/Mayor's Permit.{"\n"}
            * Text will be automatically extracted and shown to you.{"\n"}
            * Admin will review your uploaded permit for verification.{"\n"}
            * Please check your email for approval verification.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#004225",
  },
  dropdown: {
    width: "100%",
    borderColor: "#ccc",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginVertical: 6,
    color: "#000",
  },
  passwordContainer: {
    width: "100%",
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
    justifyContent: "space-between",
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  checklist: {
    width: "100%",
    marginTop: 4,
    marginBottom: 4,
  },
  valid: {
    fontSize: 12,
    color: "#008000",
  },
  invalid: {
    fontSize: 12,
    color: "#a00",
  },
  textUpload: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  textUploadLabel: {
    color: "#008000",
    marginLeft: 6,
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  noteText: {
    fontSize: 12,
    color: "#555",
    marginTop: 6,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#008000",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginTop: 15,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    color: "#008000",
    marginTop: 15,
  },
  ocrStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  ocrStatusText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "500",
  },
  testButton: {
    backgroundColor: "#FFA500",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  testButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
