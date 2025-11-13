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
    { label: "Business Owner", value: "business owner" },
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
    if (roleValue === "business owner") {
      getBusinessLines()
        .then((data) => {
          if (data.success) {
            setBusinessLineItems(data.data);
          }
        })
        .catch((error) => {
          // Silently handle error - user can still use test connection button if needed
        });
    }
  }, [roleValue]);

  // 🧪 Test server connection
  const handleTestConnection = async () => {
   // console.log('🧪 Testing server connection...');
   // Alert.alert("Testing Connection", "Checking server connectivity...");
    
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
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const selectedDoc = result.assets[0];
        
        setBusinessDocument(selectedDoc);
        
        // Immediately process OCR to show extracted text
        const isImage = selectedDoc.mimeType?.startsWith('image/');
        const isPDF = selectedDoc.mimeType === 'application/pdf';
        
        if (isImage || isPDF) {
          setIsProcessingOCR(true);
          setExtractedText("");
          setOcrSuccess(false);
          
          try {
            // Process OCR without saving to database yet (using ML Kit - works offline!)
            const ocrResult = await OCRService.recognizeText(selectedDoc.uri);
            
            if (ocrResult.success && ocrResult.text) {
              const extractedTextLower = ocrResult.text.toLowerCase();
              
              // Validate if the document contains "business permit" or related keywords
              const hasBusinessPermit = extractedTextLower.includes('business permit') || 
                                       extractedTextLower.includes('mayor\'s permit') ||
                                       extractedTextLower.includes('mayors permit') ||
                                       extractedTextLower.includes('business license');
              
              if (hasBusinessPermit) {
                setExtractedText(ocrResult.text);
                setOcrSuccess(true);
              } else {
                setOcrSuccess(false);
                setExtractedText("");
                setBusinessDocument(null);
                Alert.alert(
                  "Invalid Document",
                  "The uploaded document does not appear to be a valid Business Permit or Mayor's Permit. Please upload the correct document."
                );
              }
            } else {
              setOcrSuccess(false);
              setExtractedText("");
            }
          } catch (ocrError: any) {
            setOcrSuccess(false);
          } finally {
            setIsProcessingOCR(false);
          }
        }
      }
    } catch (error: any) {
      Alert.alert("Error", `Failed to attach document: ${error?.message || 'Unknown error'}`);
    }
  };



  const handleSignup = async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (!isValidEmail(email)) {
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
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    if (roleValue === "business owner" && !businessDocument) {
      Alert.alert("Missing Document", "Please attach your Business Permit or Mayor's Permit.");
      return;
    }

    if (roleValue === "business owner" && !businessLineValue) {
      Alert.alert("Error", "Please select your business line.");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();

    formData.append("email", email);
    formData.append("username", username);
    formData.append("password", password);
    formData.append("role", roleValue);
    formData.append("business_line_id", businessLineValue || "");

    if (roleValue === "business owner" && businessDocument) {
      
      // Default to business_permit field name for backend compatibility
      formData.append("business_permit", {
        uri: businessDocument.uri,
        type: businessDocument.mimeType || "application/pdf",
        name: businessDocument.name || "business_permit.pdf",
      } as any);
    }

    try {
      const result = await signupUser(formData);
      setIsLoading(false);

      if (result.success) {
        // If business owner with successfully extracted text, save to database
        if (roleValue === "business owner" && businessDocument && result.signup_id && ocrSuccess && extractedText) {
          try {
            // Get the business line name from the selected ID
            const selectedBusinessLine = businessLineItems.find(item => item.value === businessLineValue);
            const businessLineName = selectedBusinessLine?.label || null;
            
            const ocrResult = await OCRService.processImageAndSave(
              businessDocument.uri,
              result.signup_id.toString(),
              businessLineName
            );
          } catch (ocrError) {
            // Don't block the signup flow - just handle error silently
          }
        }

        if (roleValue === "business owner") {
          Alert.alert(
            "Waiting for Approval",
            "Your account has been created successfully! Please wait for admin approval before you can access the app. You will receive an email notification once approved.",
            [
              {
                text: "OK",
                onPress: () => navigation.replace("Login")
              }
            ]
          );
        } else {
          Alert.alert("Success", "Signup successful! You can now log in.", [
            {
              text: "OK",
              onPress: () => navigation.replace("Tabs", { username })
            }
          ]);
        }
      } else {
        Alert.alert("Error", result.message || "Signup failed.");
      }
    } catch (error: any) {
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
      {roleValue === "business owner" && (
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

      {roleValue === "business owner" && (
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
