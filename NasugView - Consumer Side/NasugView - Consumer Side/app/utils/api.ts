export const BASE_URL = "http://192.168.254.117/NasugView/NasugView";

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

// Save OCR permit data to backend
export const savePermitData = async (signupId: number, businessInfo: any) => {
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
        validUntil: businessInfo.validUntil
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


