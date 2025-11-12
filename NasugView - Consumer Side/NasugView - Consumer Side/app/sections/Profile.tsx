// Profile.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BASE_URL } from '../utils/api';

export default function Profile() {
  const navigation = useNavigation();
  const route = useRoute();
  const { username, profileImage: initialProfile, coverImage: initialCover } = route.params as {
    username: string;
    profileImage: string;
    coverImage: string;
  };

  const [profileImage, setProfileImage] = useState(initialProfile);
  const [coverImage, setCoverImage] = useState(initialCover);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<'profile' | 'cover' | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewPhotoModalVisible, setViewPhotoModalVisible] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);


  const imageSource = profileImage ? { uri: `${BASE_URL}/${profileImage}` } : require('../../assets/images/default.png');
  const coverSource = coverImage ? { uri: `${BASE_URL}/${coverImage}` } : require('../../assets/images/default-cover.jpg');

  const showStatusModal = (message: string) => {
    setStatusMessage(message);
    setStatusModalVisible(true);
    setTimeout(() => setStatusModalVisible(false), 1500);
  };

  const pickAndUploadImage = async (type: 'profile' | 'cover') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setUploading(true);
      const imageUri = result.assets[0].uri;
      const uriParts = imageUri.split('/');
      const originalFilename = uriParts[uriParts.length - 1];
      const ext = originalFilename.split('.').pop();
      const filename = `${username}_${type}_${Date.now()}.${ext}`;

      const formData = new FormData();
      formData.append('username', username);
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: `image/${ext}`,
      } as any);

      const endpoint = type === 'profile'
        ? `${BASE_URL}/upload_profile.php`
        : `${BASE_URL}/upload_cover.php`;

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        setUploading(false);

        if (data.success) {
          if (type === 'profile') setProfileImage(data.image);
          else setCoverImage(data.image);
          showStatusModal(`${type === 'profile' ? 'Profile' : 'Cover'} photo updated!`);
        } else {
          showStatusModal(data.message || 'Upload failed.');
        }
      } catch (error: any) {
        setUploading(false);
        showStatusModal(`Upload failed: ${error.message}`);
      }
    }
  };

  const loadReviews = async () => {
    try {
      const res = await fetch(`${BASE_URL}/load_user_reviews.php?username=${username}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
      } else {
        console.error('Error loading reviews:', data.message);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => { setSelectedType('cover'); setModalVisible(true); }}>
          <Image source={coverSource} style={styles.coverPhoto} />
        </TouchableOpacity>

      <View style={styles.profileInfo}>
  <TouchableOpacity onPress={() => { setSelectedType('profile'); setModalVisible(true); }}>
    <Image source={imageSource} style={styles.profilePhoto} />
  </TouchableOpacity>

  <View style={styles.profileRow}>
    {/* Username on the left */}
    <Text style={styles.postName}>{username}</Text>

    {/* Follow button on the right */}
    <TouchableOpacity
      style={[styles.followButton, isFollowing && styles.followingButton]}
      onPress={() => setIsFollowing((prev: boolean) => !prev)}
    >
      <Text style={[styles.followText, isFollowing && styles.followingText]}>
        {isFollowing ? 'Following' : 'Follow'}
      </Text>
    </TouchableOpacity>
  </View>
</View>


        {/* Reviews */}
        {reviews.map((review, index) => (
          <View key={index} style={styles.reviewCard}>
            {review.image_path && (
              <Image
                source={{ uri: `${BASE_URL}/reviews/${review.image_path}` }}
                style={styles.reviewImage}
                resizeMode="cover"
              />
            )}
            <View style={{ padding: 10 }}>
              <Text style={styles.businessName}>{review.business_name}</Text>
              <Text style={styles.comment}>{review.comment}</Text>
              <Text style={styles.ratings}>Excellent: {review.excellent_rating} | Service: {review.service_rating}</Text>
              <Text style={styles.date}>{new Date(review.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modals */}
      {selectedType && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setViewPhotoModalVisible(true);
              }}>
                <Text style={styles.modalOption}>View Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                pickAndUploadImage(selectedType);
              }}>
                <Text style={styles.modalOption}>Change {selectedType === 'profile' ? 'Profile' : 'Cover'} Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalOption, { color: 'red' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <Modal visible={statusModalVisible} transparent animationType="fade">
        <View style={styles.statusOverlay}>
          <View style={styles.statusBox}>
            {uploading && <ActivityIndicator size="large" color="#008000" />}
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={viewPhotoModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.fullscreenOverlay}
          activeOpacity={1}
          onPressOut={() => setViewPhotoModalVisible(false)}
        >
          <View style={styles.fullscreenImageWrapper}>
            <Image
              source={selectedType === 'profile' ? imageSource : coverSource}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 50 },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 50, paddingBottom: 10, paddingHorizontal: 15,
    backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderColor: '#ddd',
  },
  backButton: { marginRight: 10 },
  topBarTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  coverPhoto: { width: '100%', height: 180 },
  profileInfo: {
    marginTop: -40, flexDirection: 'column',
    alignItems: 'flex-start', paddingHorizontal: 15,
  },
  profilePhoto: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: '#fff',
  },
  postName: {
    fontSize: 18, fontWeight: 'bold',
    marginLeft: 10, color: '#333',
  },
  reviewCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reviewImage: {
    width: '100%',
    height: 200,
  },
  businessName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  comment: {
    fontSize: 14,
    marginBottom: 5,
  },
  ratings: {
    fontSize: 12,
    color: '#555',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff', padding: 20,
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  modalOption: {
    fontSize: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: '#eee',
    color: '#008000', textAlign: 'center',
  },
  statusOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  statusBox: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  profileRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 10,
  width: '100%',
},
followButton: {
  backgroundColor: '#008000',
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 8,
  marginLeft: 10, // space between button and username
},
followingButton: {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#008000',
},
followText: { color: '#fff', fontWeight: 'bold' },
followingText: { color: '#008000', fontWeight: 'bold' },



});
