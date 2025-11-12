import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { BASE_URL } from '../utils/api';

export default function SubmitReviewNo() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { name, address, username, category } = route.params as {
    name: string;
    address: string;
    username: string;
    category: string;
  };

  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [poorQualityRating, setPoorQualityRating] = useState(0);
  const [badServiceRating, setBadServiceRating] = useState(0);
  const [comment, setComment] = useState('');
  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [backModalVisible, setBackModalVisible] = useState(false);
  const [thankYouModalVisible, setThankYouModalVisible] = useState(false);

  const [pendingBackAction, setPendingBackAction] = useState<any>(null);
  const backListenerRef = useRef<any>(null);

  // Load tags dynamically
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(`${BASE_URL}/get_category_negtags.php?category=${category}`);
        const result = await response.json();
        if (result.success) setTags(result.tags);
        else setTags([]);
      } catch (error) {
        console.error('Error fetching tags:', error);
        setTags([]);
      }
    };
    if (category) fetchTags();
  }, [category]);

  // Confirm before going back
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      setPendingBackAction(e);
      setBackModalVisible(true);
    });
    backListenerRef.current = unsubscribe;
    return unsubscribe;
  }, [navigation]);

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

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPickedImage(result.assets[0].uri);
    }
  };

  const submitReview = async () => {
    if (poorQualityRating === 0 || badServiceRating === 0 || comment.trim() === '') {
      Alert.alert('Error', 'Please rate all traits and write a comment.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('business_name', name);
      formData.append('excellent_rating', poorQualityRating.toString());
      formData.append('service_rating', badServiceRating.toString());
      formData.append('comment', comment);
      formData.append('tags', JSON.stringify(selectedTags));

      if (pickedImage) {
        const uriParts = pickedImage.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        formData.append('image', {
          uri: pickedImage,
          name: `photo.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        } as any);
      }

      const response = await fetch(`${BASE_URL}/submit_review.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // reset fields
        setPoorQualityRating(0);
        setBadServiceRating(0);
        setComment('');
        setPickedImage(null);
        setSelectedTags([]);
        // show thank you modal
        setThankYouModalVisible(true);
      } else {
        Alert.alert('Failed', result.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('❌ submitReview error:', error);
      Alert.alert('Error', 'Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // handle OK from thank-you modal
  const handleThankYouOkay = () => {
    if (backListenerRef.current) {
      backListenerRef.current(); // unsubscribe the back listener
      backListenerRef.current = null;
    }
    setThankYouModalVisible(false);
    navigation.goBack();
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.businessHeader}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{name}</Text>
            <Text style={styles.businessLocation}>📍 {address}</Text>
          </View>
        </View>

        <Text style={styles.heading}>What don't you recommend about {name}?</Text>
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

        <Text style={styles.label}>Rate the Service/Product:</Text>
        <View style={styles.starsRow}>
          {[...Array(5)].map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setPoorQualityRating(i + 1)}>
              <Ionicons
                name={i < poorQualityRating ? 'star' : 'star-outline'}
                size={28}
                color="#FFD700"
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Rate your Experience:</Text>
        <View style={styles.starsRow}>
          {[...Array(5)].map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setBadServiceRating(i + 1)}>
              <Ionicons
                name={i < badServiceRating ? 'star' : 'star-outline'}
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
          placeholder="Share your experience..."
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
            <TouchableOpacity style={styles.roundSubmitButton} onPress={submitReview}>
              <Text style={styles.roundSubmitText}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={imageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <Image
            source={{ uri: pickedImage ?? undefined }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={() => {
              setImageModalVisible(false);
              setPickedImage(null);
            }}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Thank You Modal */}
      <Modal visible={thankYouModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#004225', textAlign: 'center' }}>
              🙏 Thank you for your feedback!
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#444',
                textAlign: 'center',
                marginVertical: 10,
              }}
            >
              Your honest review helps others know what could be improved.
            </Text>
            <TouchableOpacity
              style={[styles.roundSubmitButton, { alignSelf: 'center', marginTop: 10 }]}
              onPress={handleThankYouOkay}
            >
              <Text style={styles.roundSubmitText}>Okay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Back confirmation modal */}
      <Modal visible={backModalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '85%' }}>
            <Text
              style={{
                fontSize: 16,
                color: '#004225',
                fontWeight: 'bold',
                marginBottom: 10,
                textAlign: 'center',
              }}
            >
              Discard Recommendation?
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#444',
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              Recommendations help people find great businesses. Are you sure you want to discard
              your draft?
            </Text>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={[
                  styles.roundSubmitButton,
                  {
                    backgroundColor: '#ccc',
                    flex: 1,
                    marginRight: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 12,
                  },
                ]}
                onPress={() => {
                  setBackModalVisible(false);
                  if (pendingBackAction) {
                    navigation.dispatch(pendingBackAction.data.action);
                    setPendingBackAction(null);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roundSubmitButton,
                  {
                    flex: 1,
                    marginLeft: 10,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingVertical: 12,
                  },
                ]}
                onPress={() => {
                  setBackModalVisible(false);
                  setPendingBackAction(null);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>No</Text>
              </TouchableOpacity>
            </View>
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
  heading: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#004225' },
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
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  roundSubmitButton: {
    backgroundColor: '#008000',
    paddingVertical: 7,
    paddingHorizontal: 28,
    borderRadius: 20,
  },
  roundSubmitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cameraButtonPlain: { padding: 2, alignSelf: 'flex-start' },
  imagePreview: { marginTop: 10, width: 150, height: 150, borderRadius: 8 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: { width: '90%', height: '70%', borderRadius: 10 },
  cancelButton: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  cancelButtonText: { color: '#008000', fontSize: 16, fontWeight: 'bold' },
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
});
