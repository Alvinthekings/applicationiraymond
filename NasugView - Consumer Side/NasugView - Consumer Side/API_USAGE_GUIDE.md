# 🚀 API Usage Guide

## 📍 Centralized IP Configuration

All API calls are now centralized in `app/utils/api.ts`. To change your server IP address, **only edit ONE line**:

```typescript
// In app/utils/api.ts
export const BASE_URL = "http://192.168.254.117/NasugView/NasugView";
```

Change `192.168.254.117` to your server's IP address.

---

## 🔧 How to Use API Functions

### ✅ OLD WAY (Don't use anymore):
```typescript
import { BASE_URL } from './utils/api';

const response = await fetch(`${BASE_URL}/login.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
```

### ✨ NEW WAY (Use this):
```typescript
import { loginUser } from './utils/api';

const result = await loginUser(username, password);
if (result.success) {
  // Handle success
}
```

---

## 📚 Available API Functions

### 🔒 Authentication
- `loginUser(username, password)` - User login
- `signupUser(formData)` - User signup

### 📄 Business
- `getBusinessLines()` - Get all business categories
- `loadBusinesses()` - Load all businesses
- `loadNearbyBusinesses(lat, lon)` - Load businesses near location
- `loadFeaturedBusinesses()` - Load top-rated businesses
- `loadLeastBusinesses()` - Load businesses to check out
- `getBusiness(name)` - Get single business by name

### 🛍️ Products
- `getProducts(businessId?)` - Get products (optional filter by business)
- `getProductDetails(productId)` - Get product details
- `addProduct(formData)` - Add new product

### ⭐ Reviews
- `loadAllReviews(username?)` - Load all reviews
- `getReviews(businessName)` - Get reviews for a business
- `loadUserReviews(username)` - Get user's reviews
- `updateReview(reviewId, action, username, comment?)` - Like/comment on review
- `submitReview(formData)` - Submit new review
- `submitProductReview(formData)` - Submit product review
- `getCategoryTags(category)` - Get positive tags for category
- `getCategoryNegTags(category)` - Get negative tags for category

### 💬 Comments
- `loadComments(reviewId)` - Load comments for review

### 👤 User Profile
- `uploadProfilePhoto(formData)` - Upload profile picture
- `uploadCoverPhoto(formData)` - Upload cover photo
- `getUserInfo(id)` - Get user information
- `updateUserInfo(formData)` - Update user information

### 📊 Shop Performance
- `getShopLogs(filters?)` - Get shop performance logs
- `saveShopLog(logData)` - Save shop log entry

### 🔐 OCR & Permits
- `savePermitData(signupId, businessInfo)` - Save OCR permit data

---

## 💡 Migration Examples

### Example 1: Login
**Before:**
```typescript
const response = await fetch(`${BASE_URL}/login.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
const result = await response.json();
```

**After:**
```typescript
import { loginUser } from './utils/api';

const result = await loginUser(username, password);
```

### Example 2: Load Businesses
**Before:**
```typescript
const res = await fetch(`${BASE_URL}/load_businesses.php`);
const data = await res.json();
```

**After:**
```typescript
import { loadBusinesses } from './utils/api';

const data = await loadBusinesses();
```

### Example 3: Submit Review
**Before:**
```typescript
const response = await fetch(`${BASE_URL}/submit_review.php`, {
  method: 'POST',
  body: formData,
});
const result = await response.json();
```

**After:**
```typescript
import { submitReview } from './utils/api';

const result = await submitReview(formData);
```

---

## ⚡ Benefits

1. **Single Point of Configuration** - Change IP address in ONE place only
2. **Consistent Error Handling** - All API calls handle errors the same way
3. **Type Safety** - Better TypeScript support
4. **Easier Testing** - Can mock API functions easily
5. **Cleaner Code** - Less boilerplate in components
6. **Better Maintainability** - API changes happen in one file

---

## 🔄 Migration Checklist

- [x] Created centralized API functions in `api.ts`
- [ ] Update `signup.tsx` to use `signupUser()`
- [ ] Update `home.tsx` to use new review functions
- [ ] Update `marketplace.tsx` to use new business functions
- [ ] Update other files as needed

---

## 🎯 Next Steps

You can still use `BASE_URL` directly if needed for image URLs:

```typescript
import { BASE_URL } from './utils/api';

const imageUri = `${BASE_URL}/${profileImage}`;
```

But for all API calls, use the helper functions! 🚀
