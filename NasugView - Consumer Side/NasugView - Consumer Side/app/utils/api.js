// API configuration for React Native
const API_BASE_URL = 'http://10.0.2.2/NasugView/NasugView/api'; // For Android emulator
// const API_BASE_URL = 'http://localhost/NasugView/NasugView/api'; // For iOS simulator
// const API_BASE_URL = 'http://YOUR_COMPUTER_IP/NasugView/NasugView/api'; // For physical device

/**
 * Save permit data extracted from OCR to backend
 */
export const savePermitData = async (signupId, businessInfo) => {
  try {
    console.log('📤 Sending permit data to backend...');
    console.log('Signup ID:', signupId);
    console.log('Business Info:', businessInfo);
    
    const response = await fetch(`${API_BASE_URL}/save_ocr_data.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signup_id: signupId,
        businessInfo: businessInfo
      }),
    });
    
    const text = await response.text();
    console.log('📥 Raw server response:', text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error(`Server returned invalid JSON: ${text.substring(0, 100)}...`);
    }
    
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ Permit data saved successfully:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error saving permit data:', error);
    throw error;
  }
};

/**
 * Register new user with optional business data
 */
export const registerUser = async (userData) => {
  try {
    console.log('📤 Registering user:', userData.email);
    
    const response = await fetch(`${API_BASE_URL}/react_native_signup.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const text = await response.text();
    console.log('📥 Registration response:', text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ Registration JSON parse error:', parseError);
      throw new Error(`Server returned invalid JSON: ${text.substring(0, 100)}...`);
    }
    
    if (!response.ok) {
      throw new Error(result.message || `Registration failed: ${response.status}`);
    }
    
    console.log('✅ User registered successfully:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
};

/**
 * Mock OCR for testing (use while fixing the real OCR library)
 */
export const mockOCRProcessing = async () => {
  try {
    console.log('🤖 Using mock OCR for testing...');
    
    const response = await fetch(`${API_BASE_URL}/mock_ocr.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mock: true }),
    });
    
    const result = await response.json();
    console.log('✅ Mock OCR completed:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Mock OCR error:', error);
    throw error;
  }
};

/**
 * Complete workflow: OCR + Save to Database
 */
export const processOCRAndSave = async (signupId, imageUri = null) => {
  try {
    console.log('🔄 Starting complete OCR workflow...');
    
    // Step 1: Process OCR (use mock for now)
    const ocrResult = await mockOCRProcessing();
    
    if (!ocrResult.success) {
      throw new Error('OCR processing failed: ' + ocrResult.message);
    }
    
    // Step 2: Save to database if signup_id provided
    let databaseResult = null;
    if (signupId && ocrResult.businessInfo) {
      databaseResult = await savePermitData(signupId, ocrResult.businessInfo);
    }
    
    return {
      ocr: ocrResult,
      database: databaseResult,
      success: true,
      message: 'OCR processing and database save completed'
    };
    
  } catch (error) {
    console.error('❌ Complete OCR workflow failed:', error);
    throw error;
  }
};

export default {
  savePermitData,
  registerUser,
  mockOCRProcessing,
  processOCRAndSave
};