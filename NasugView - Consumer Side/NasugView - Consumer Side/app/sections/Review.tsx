import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { BASE_URL } from '../utils/api';

type ReviewType = {
  username: string;
  fname: string;
  lname: string;
  excellent_rating: number;
  service_rating: number;
  comment: string;
  created_at: string;
  image_path?: string;
  images?: string[];
};

export default function Review() {
  const route = useRoute();
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState('All');

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { name, image, address, username, category } = route.params as {
    name: string;
    image: string;
    address: string;
    username: string;
    category?: string;
  };

  const businessCategory = category ?? '';
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [ratingStats, setRatingStats] = useState<number[]>([0, 0, 0, 0, 0]);

  const tags = ['All', 'Good Product/Service', 'Bad Product/Service', 'Nice Experience', 'Bad Experience'];

  const fetchReviews = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const response = await fetch(`${BASE_URL}/get_reviews.php?business_name=${encodeURIComponent(name)}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
        setRatingStats(data.star_counts);
      } else {
        console.warn('No reviews found:', data.message);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000); 
    }
  };

  useEffect(() => {
    fetchReviews();

    const interval = setInterval(() => {
      fetchReviews(true); // silent refresh
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Filter reviews based on selected tag
  const displayedReviews = reviews.filter((review) => {
    switch (selectedTag) {
      case 'All':
        return true;
      case 'Good Product/Service':
        return review.excellent_rating >= 4;
      case 'Bad Product/Service':
        return review.excellent_rating < 4;
      case 'Nice Experience':
        return review.service_rating >= 4;
      case 'Bad Experience':
        return review.service_rating < 4;
      default:
        return true;
    }
  });

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchReviews()} />}
      >
        <Text style={styles.recommendText}>
          Do you recommend <Text style={{ fontWeight: 'bold' }}>{name}</Text>?
        </Text>

        <View style={styles.recommendButtons}>
          <TouchableOpacity
            style={styles.yesButton}
            onPress={() => navigation.navigate('SubmitReview', { name, image, address, username, category: businessCategory })}
          >
            <Text style={styles.buttonText}>Yes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.noButton}
            onPress={() => navigation.navigate('SubmitReviewNo', { name, image, address, username, category: businessCategory })}
          >
            <Text style={styles.noButtonText}>No</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Reviews</Text>

        <View style={styles.tagFilters}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, selectedTag === tag && styles.selectedTag]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text style={[styles.tagText, selectedTag === tag && styles.selectedTagText]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ratingBreakdown}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingStats[5 - star] || 0;
            const total = ratingStats.reduce((a, b) => a + b, 0);
            const percent = total > 0 ? (count / total) * 100 : 0;
            return (
              <View key={star} style={styles.barRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: 50 }}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.starLabel}> {star}</Text>
                </View>
                <View style={styles.barBackground}>
                  <View style={[styles.barFill, { width: `${percent}%` }]} />
                </View>
                <Text style={styles.countText}> {count}</Text>
              </View>
            );
          })}
        </View>

       {displayedReviews.map((review, index) => {
  // Format the date nicely (e.g. "Oct 9, 2025")
  const formattedDate = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View key={`${review.username}-${index}`} style={styles.reviewCard}>
      {/* 👤 Full Name + Date */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={styles.reviewerName}>
          {`${review.fname} ${review.lname}`}
        </Text>
        <Text style={styles.reviewDate}>{formattedDate}</Text>
      </View>

      {/* ⭐ Excellent Rating */}
      <View style={styles.starsRow}>
        <Text style={{ marginRight: 5 }}>Service:</Text>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={`excellent-${review.username}-${i}`}
            name={i < review.excellent_rating ? 'star' : 'star-outline'}
            size={20}
            color="#FFD700"
          />
        ))}
      </View>

      {/* ⭐ Service Rating */}
      <View style={styles.starsRow}>
        <Text style={{ marginRight: 5 }}>Experience:</Text>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={`service-${review.username}-${i}`}
            name={i < review.service_rating ? 'star' : 'star-outline'}
            size={20}
            color="#FFD700"
          />
        ))}
      </View>

      {/* 💬 Comment */}
      <Text style={styles.comment}>{review.comment}</Text>

      {/* 🖼️ Review Image (if any) */}
      {review.image_path && (
        <TouchableOpacity
          onPress={() => {
            setSelectedImageUri(review.image_path ?? null);
            setModalVisible(true);
          }}
        >
          <Image
            source={{ uri: review.image_path }}
            style={styles.reviewImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
    </View>
  );
})}

      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalBackground} onPress={() => setModalVisible(false)}>
          <Image
            source={{ uri: selectedImageUri || undefined }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 15 },
  recommendText: { fontSize: 14, color: '#333', marginBottom: 5 },
  recommendButtons: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  noButtonText: { color: '#333', fontWeight: 'bold' },
  yesButton: { backgroundColor: '#008000', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  noButton: { backgroundColor: '#ddd', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  starsRow: { flexDirection: 'row', marginVertical: 4 },
  ratingBreakdown: { marginBottom: 15 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  starLabel: { width: 14, marginRight: 6, fontSize: 12 },
  barBackground: { flex: 1, backgroundColor: '#eee', height: 8, borderRadius: 4 },
  barFill: { backgroundColor: '#008000', height: 8, borderRadius: 4 },
  tagFilters: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 15, gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: '#008000' },
  selectedTag: { backgroundColor: '#008000' },
  tagText: { fontSize: 12, color: '#008000' },
  selectedTagText: { color: '#fff' },
  reviewCard: { backgroundColor: '#f4f4f4', padding: 12, borderRadius: 10, marginBottom: 12 },
  reviewerName: { fontWeight: 'bold', marginBottom: 4 },
  comment: { fontSize: 14, color: '#333' },
  reviewImage: { width: 80, height: 80, borderRadius: 6, marginTop: 8 },
  countText: { width: 30, fontSize: 12, color: '#666', textAlign: 'left' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullscreenImage: { width: '90%', height: '90%' },
  reviewDate: {
  fontSize: 12,
  color: '#666',
},

});
