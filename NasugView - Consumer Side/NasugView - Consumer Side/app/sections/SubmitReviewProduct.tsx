import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { BASE_URL } from '../utils/api';

export default function SubmitReviewProduct() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { product_id, business_id, name, product_name, price, category } = route.params as {
    product_id: string;
    business_id?: string;
    name?: string;
    product_name?: string;
    price?: string;
    category?: string;
  };

  const displayName = product_name || name || 'Unnamed Product';

  const [username, setUsername] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [valueForMoneyRating, setValueForMoneyRating] = useState(0);
  const [comment, setComment] = useState('');
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [thankYouModalVisible, setThankYouModalVisible] = useState(false);
  const [backModalVisible, setBackModalVisible] = useState(false);

  // ✅ Load logged-in username
  useEffect(() => {
    const fetchUser = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);
      console.log('👤 Logged-in user:', storedUsername);
    };
    fetchUser();
  }, []);

  // ✅ Debug route params
  useEffect(() => {
    console.log('🧩 Received route params:', route.params);
  }, [route.params]);

  // ✅ Fetch category tags dynamically
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(`${BASE_URL}/get_category_tags.php?category=${category}`);
        const result = await response.json();
        if (result.success) setTags(result.tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    if (category) fetchTags();
  }, [category]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission denied', 'You need to allow permission to access photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setPickedImage(result.assets[0].uri);
    }
  };

  const submitProductReview = async () => {
    if (productQualityRating === 0 || valueForMoneyRating === 0 || comment.trim() === '') {
      Alert.alert('Error', 'Please rate all traits and write a comment.');
      return;
    }

    if (!username) {
      Alert.alert('Error', 'Could not identify logged-in user.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('product_id', product_id);
      formData.append('product_name', displayName);
      formData.append('username', username);
      formData.append('quality_rating', productQualityRating.toString());
      formData.append('value_rating', valueForMoneyRating.toString());
      formData.append('comment', comment);

      if (pickedImage) {
        const uriParts = pickedImage.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        formData.append('image', {
          uri: pickedImage,
          name: `photo.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        } as any);
      }

      const response = await fetch(`${BASE_URL}/submit_product_review.php`, {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      console.log('📦 Raw response:', text);
      const result = JSON.parse(text);

      if (result.success) {
        setProductQualityRating(0);
        setValueForMoneyRating(0);
        setComment('');
        setPickedImage(null);
        setSelectedTags([]);
        setThankYouModalVisible(true);
      } else {
        Alert.alert('Failed', result.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('❌ submitProductReview error:', error);
      Alert.alert('Error', 'Network error or invalid server response.');
    } finally {
      setLoading(false);
    }
  };

  const handleThankYouOkay = () => {
    setThankYouModalVisible(false);
    navigation.goBack();
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.businessHeader}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{displayName}</Text>
            <Text style={styles.businessLocation}>💰 ₱{price || '0.00'}</Text>
          </View>
        </View>

        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagButton, selectedTags.includes(tag) && styles.tagButtonSelected]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Rate Product Quality:</Text>
        <View style={styles.starsRow}>
          {[...Array(5)].map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setProductQualityRating(i + 1)}>
              <Ionicons
                name={i < productQualityRating ? 'star' : 'star-outline'}
                size={28}
                color="#FFD700"
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Rate Value for Money:</Text>
        <View style={styles.starsRow}>
          {[...Array(5)].map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setValueForMoneyRating(i + 1)}>
              <Ionicons
                name={i < valueForMoneyRating ? 'star' : 'star-outline'}
                size={28}
                color="#FFD700"
              />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          placeholder="Share your experience with this product..."
          style={styles.input}
        />

        <View style={styles.bottomRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.cameraButtonPlain} onPress={pickImage}>
              <Ionicons name="camera-outline" size={45} color="#008000" />
            </TouchableOpacity>
            {pickedImage && (
              <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                <Image
                  source={{ uri: pickedImage }}
                  style={[styles.imagePreview, { marginLeft: 10 }]}
                />
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#008000" />
          ) : (
            <TouchableOpacity style={styles.roundSubmitButton} onPress={submitProductReview}>
              <Text style={styles.roundSubmitText}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ✅ Thank You Modal */}
      <Modal
        visible={thankYouModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThankYouModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✅ Review Submitted!</Text>
            <Text style={styles.modalMessage}>
              Thank you for sharing your experience.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleThankYouOkay}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  businessHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  businessInfo: { flex: 1 },
  businessName: { fontSize: 16, fontWeight: 'bold', color: '#004225' },
  businessLocation: { fontSize: 12, color: '#666', marginTop: 4 },
  label: { fontSize: 16, marginTop: 10, marginBottom: 5, color: '#444', fontWeight: 'bold' },
  starsRow: { flexDirection: 'row', marginBottom: 10 },
  input: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    textAlignVertical: 'top',
    padding: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  roundSubmitButton: {
    backgroundColor: '#008000',
    paddingVertical: 7,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  roundSubmitText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  cameraButtonPlain: { padding: 2, alignSelf: 'flex-start' },
  imagePreview: { marginTop: 10, width: 150, height: 150, borderRadius: 8 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  tagButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    marginBottom: 8,
  },
  tagButtonSelected: { backgroundColor: '#008000', borderColor: '#008000' },
  tagText: { color: '#444' },
  tagTextSelected: { color: '#fff' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#008000', marginBottom: 8 },
  modalMessage: { fontSize: 14, textAlign: 'center', color: '#333', marginBottom: 20 },
  modalButton: {
    backgroundColor: '#008000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalButtonText: { color: '#fff', fontWeight: '600' },
});
