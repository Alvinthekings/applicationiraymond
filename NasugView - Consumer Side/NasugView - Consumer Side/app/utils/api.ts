// ============================================
// 🔧 CENTRALIZED API CONFIGURATION
// ============================================
// Using XAMPP Apache Server at C:\xampp\htdocs\NasugView

// 📱 FOR REAL ANDROID DEVICE (Development Build):
// Use your computer's local network IP address
// Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
export const BASE_URL = "http://192.168.254.115/NasugView";

// 🤖 FOR ANDROID EMULATOR ONLY:
// export const BASE_URL = "http://10.0.2.2/NasugView";

// 🍎 FOR iOS SIMULATOR ONLY:
// export const BASE_URL = "http://localhost/NasugView";

// ⚠️ IMPORTANT FOR DEVELOPMENT BUILD:
// 1. Make sure XAMPP is running
// 2. Your phone must be on the SAME WiFi network as your computer
// 3. Check your computer's IP hasn't changed (run: ipconfig)
// 4. Windows Firewall might block connections - allow Apache in firewall

// ============================================
// � CONNECTION TEST API
// ============================================
export const testConnection = async () => {
  try {
    //console.log('🧪 Testing connection to:', `${BASE_URL}/test_connection.php`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${BASE_URL}/test_connection.php`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await response.json();
    console.log('✅ Connection test successful:', data);
    return data;
  } catch (error: any) {
    console.error('❌ Connection test failed:', error.message);
    return { success: false, message: 'Cannot connect to server: ' + error.message };
  }
};

// ============================================
// �🔒 AUTHENTICATION APIs
// ============================================
export const loginUser = async (username: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const signupUser = async (formData: FormData) => {
  try {
    const response = await fetch(`${BASE_URL}/signup.php`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData - let the browser set it with boundary
    });
    
    // Debug: Log response details
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', response.headers);
    
    const text = await response.text();
    console.log('📡 Response Text:', text);
    
    try {
      const result = JSON.parse(text);
      return result;
    } catch (jsonError) {
      console.error('❌ JSON Parse Error. Server returned:', text);
      return { success: false, message: 'Server error: ' + text.substring(0, 200) };
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, message: 'Network error' };
  }
};

// ============================================
// 📄 BUSINESS APIs
// ============================================
export const getBusinessLines = async () => {
  try {
    console.log('🌐 Fetching business lines from:', `${BASE_URL}/get_business_lines.php`);
    
    // Add timeout to detect network issues faster
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${BASE_URL}/get_business_lines.php`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      return { 
        success: false, 
        message: `Server error: ${response.status}. Cannot connect to ${BASE_URL}. Make sure:\n1. XAMPP Apache is running\n2. Phone is on WiFi (192.168.254.x)\n3. Windows Firewall allows Apache` 
      };
    }
    
    const text = await response.text();
    console.log('📥 Raw response:', text.substring(0, 200));
    
    const data = JSON.parse(text);
    console.log('✅ Business lines fetched successfully:', data);
    return data;
  } catch (error: any) {
    console.error('💥 Get business lines error:', error);
    console.error('💥 Error message:', error.message);
    console.error('💥 Error name:', error.name);
    
    let userMessage = 'Network error. ';
    
    if (error.name === 'AbortError') {
      userMessage = 'Connection timeout. Server took too long to respond. ';
    } else if (error.message.includes('Network request failed')) {
      userMessage = 'Cannot reach server. ';
    }
    
    userMessage += `\n\nTroubleshooting:\n1. Check XAMPP Apache is running\n2. Verify phone on WiFi: 192.168.254.x\n3. Test URL: ${BASE_URL}/get_business_lines.php\n4. Check Windows Firewall`;
    
    return { 
      success: false, 
      message: userMessage
    };
  }
};

export const loadBusinesses = async () => {
  try {
    const res = await fetch(`${BASE_URL}/load_businesses.php`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Load businesses error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const loadNearbyBusinesses = async (lat: number, lon: number) => {
  try {
    const response = await fetch(`${BASE_URL}/load_nearby_businesses.php?lat=${lat}&lon=${lon}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Load nearby businesses error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const loadFeaturedBusinesses = async () => {
  try {
    const response = await fetch(`${BASE_URL}/load_featured_businesses.php`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Load featured businesses error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const loadLeastBusinesses = async () => {
  try {
    const response = await fetch(`${BASE_URL}/load_least_businesses.php`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Load least businesses error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const getBusiness = async (name: string) => {
  try {
    const response = await fetch(`${BASE_URL}/get_business.php?name=${encodeURIComponent(name)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get business error:', error);
    return { success: false, message: 'Network error' };
  }
};

// ============================================
// 🛍️ PRODUCT APIs
// ============================================
export const getProducts = async (businessId?: number) => {
  try {
    const url = businessId 
      ? `${BASE_URL}/get_products.php?business_id=${businessId}`
      : `${BASE_URL}/get_products.php`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get products error:', error);
    return [];
  }
};

export const getProductDetails = async (productId: number) => {
  try {
    const res = await fetch(`${BASE_URL}/productDetails.php?product_id=${productId}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Get product details error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const addProduct = async (formData: FormData) => {
  try {
    const res = await fetch(`${BASE_URL}/add_product.php`, {
      method: 'POST',
      body: formData,
    });
    const text = await res.text();
    const result = JSON.parse(text);
    return result;
  } catch (error) {
    console.error('Add product error:', error);
    return { success: false, message: 'Network error' };
  }
};

// ============================================
// ⭐ REVIEW APIs
// ============================================
export const loadAllReviews = async (username?: string) => {
  try {
    const res = await fetch(`${BASE_URL}/load_allreviews.php?username=${username ?? ''}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Load all reviews error:', error);
    return { success: false, reviews: [] };
  }
};

export const getReviews = async (businessName: string) => {
  try {
    const response = await fetch(`${BASE_URL}/get_reviews.php?business_name=${encodeURIComponent(businessName)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get reviews error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const loadUserReviews = async (username: string) => {
  try {
    const res = await fetch(`${BASE_URL}/load_user_reviews.php?username=${username}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Load user reviews error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const updateReview = async (reviewId: string, action: string, username: string, comment?: string) => {
  try {
    const res = await fetch(`${BASE_URL}/update_review.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, action, username, comment }),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Update review error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const submitReview = async (formData: FormData) => {
  try {
    const response = await fetch(`${BASE_URL}/submit_review.php`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Submit review error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const submitProductReview = async (formData: FormData) => {
  try {
    const response = await fetch(`${BASE_URL}/submit_product_review.php`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Submit product review error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const getCategoryTags = async (category: string) => {
  try {
    const response = await fetch(`${BASE_URL}/get_category_tags.php?category=${category}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get category tags error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const getCategoryNegTags = async (category: string) => {
  try {
    const response = await fetch(`${BASE_URL}/get_category_negtags.php?category=${category}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get category neg tags error:', error);
    return { success: false, message: 'Network error' };
  }
};

// ============================================
// 💬 COMMENT APIs
// ============================================
export const loadComments = async (reviewId: string) => {
  try {
    const res = await fetch(`${BASE_URL}/load_comments.php?review_id=${reviewId}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Load comments error:', error);
    return { success: false, message: 'Network error' };
  }
};

// ============================================
// 👤 USER PROFILE APIs
// ============================================
export const uploadProfilePhoto = async (formData: FormData) => {
  try {
    const response = await fetch(`${BASE_URL}/upload_profile.php`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload profile photo error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const uploadCoverPhoto = async (formData: FormData) => {
  try {
    const response = await fetch(`${BASE_URL}/upload_cover.php`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload cover photo error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const getUserInfo = async (id: string) => {
  try {
    const res = await fetch(`${BASE_URL}/get_user_info.php?id=${id}`);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Get user info error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const updateUserInfo = async (formData: any) => {
  try {
    const res = await fetch(`${BASE_URL}/update_user_info.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Update user info error:', error);
    return { success: false, message: 'Network error' };
  }
};

// ============================================
// 📊 SHOP PERFORMANCE APIs
// ============================================
export const getShopLogs = async (filters?: { product_id?: string; date_from?: string; date_to?: string }) => {
  try {
    let url = `${BASE_URL}/get_shoplogs.php?`;
    if (filters) {
      const params = new URLSearchParams();
      if (filters.product_id) params.append('product_id', filters.product_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      url += params.toString();
    }
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Get shop logs error:', error);
    return { success: false, message: 'Network error' };
  }
};

export const saveShopLog = async (logData: any) => {
  try {
    const res = await fetch(`${BASE_URL}/save_shoplog.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Save shop log error:', error);
    return { success: false, message: 'Network error' };
  }
};

// ============================================
// 🔐 OCR & PERMIT APIs
// ============================================
export const savePermitData = async (
  signupId: number,
  businessInfo: any,
  extras?: { ocrText?: string; imageBase64?: string; imageExt?: string; businessLine?: string }
) => {
  try {
    const response = await fetch(`${BASE_URL}/save_permit.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signup_id: signupId,
        businessIdNo: businessInfo.businessIdNo,
        businessTin: businessInfo.businessTin,
        businessPermitNo: businessInfo.businessPermitNo,
        dateIssued: businessInfo.dateIssued,
        validUntil: businessInfo.validUntil,
        // Also send owner and business name and address to update businessowneraccount
        ownerName: businessInfo.ownerName,
        businessName: businessInfo.businessName,
        businessAddress: businessInfo.address,
        // Include business line from dropdown selection
        businessLine: extras?.businessLine,
        // Optional extras for server-side archiving
        ocrText: extras?.ocrText,
        permitImageBase64: extras?.imageBase64,
        permitImageExt: extras?.imageExt
      }),
    });

    const text = await response.text();
    try {
      const result = JSON.parse(text);
      return result;
    } catch (jsonError) {
      console.error('Save permit error: Response is not valid JSON. Raw response:', text);
      return { success: false, message: 'Server returned invalid JSON', raw: text };
    }
  } catch (error) {
    console.error('Save permit error:', error);
    return { success: false, message: 'Network error' };
  }
};


