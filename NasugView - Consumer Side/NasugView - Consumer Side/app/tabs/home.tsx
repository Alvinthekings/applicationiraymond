import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import DefaultProfile from '../../assets/images/default.png';
import type { RootStackParamList } from '../navigation/StackNavigator';

import { BASE_URL } from '../utils/api';

type Review = {
  id: string;
  name: string;
  date: string;
  profile?: string | null;
  text: string;
  images: string[];
  business: string;
  like_count: number;
  comment_count: number;
};

type Business = {
  id: number;
  name: string;
  location: string;
  rating: number;
  image: string;
};

type Comment = {
  id: string;
  username: string;
  text: string;
  date: string;
};

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [likedMap, setLikedMap] = useState<{ [key: string]: boolean }>({});
  const [likeCountMap, setLikeCountMap] = useState<{ [key: string]: number }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ uri: string }[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [featuredCards, setFeaturedCards] = useState<Business[]>([]);
  const [leastCards, setLeastCards] = useState<Business[]>([]);

  // --- Comment modal states ---
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const username = (route.params as { username?: string })?.username;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const cardWidth = 200 + 15;
    const index = Math.floor(scrollX / cardWidth + 0.5);
    setActiveIndex(index);
  };

 






const handleLike = async (reviewId: string) => {
  if (!username) return; // prevent liking if not logged in

  try {
    const res = await fetch(`${BASE_URL}/update_review.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: reviewId, action: "like", username }),
    });

    const data = await res.json();
    if (data.success) {
      // update heart color and like count immediately
      setLikedMap(prev => ({ ...prev, [reviewId]: data.is_liked }));
      setLikeCountMap(prev => ({ ...prev, [reviewId]: data.like_count }));
    }
  } catch (error) {
    console.error("Error liking review:", error);
  }
};


  const onImagePress = (imageIndex: number, reviewIndex: number) => {
    const selectedReview = reviews[reviewIndex];
    const formattedImages = selectedReview.images.map(uri => ({ uri }));
    setViewerImages(formattedImages);
    setCurrentImageIndex(imageIndex);
    setIsViewerVisible(true);
  };

  // --- Comments ---
const openComments = async (review: Review) => {
  setSelectedReview(review);
  setIsCommentModalVisible(true);

  try {
    const res = await fetch(`${BASE_URL}/load_comments.php?review_id=${review.id}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.comments)) {
      // Map backend comments to our Comment type
      const mappedComments: Comment[] = data.comments.map((c: any) => ({
        id: c.id.toString(),
        username: c.username,
        text: c.comment || c.text || "",
        date: c.created_at,
      }));
      setComments(mappedComments);
    } else {
      setComments([]);
    }
  } catch (error) {
    console.error("Error loading comments:", error);
    setComments([]);
  }
};


 const submitComment = async () => {
  if (!newComment.trim() || !selectedReview) return;

  try {
    const response = await fetch(`${BASE_URL}/update_review.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        review_id: selectedReview.id,
        action: 'comment',
        username,
        comment: newComment,
      }),
    });

    const data = await response.json();
    if (data.success) {
      setNewComment('');
      // Refresh comments after submitting
      openComments(selectedReview);
    }
  } catch (error) {
    console.error('Error submitting comment:', error);
  }
};


  // --- Fetch top-rated featured businesses ---
  const fetchFeaturedBusinesses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/load_featured_businesses.php`);
      const data = await response.json();
      if (data.success && Array.isArray(data.businesses)) {
        setFeaturedCards(data.businesses.slice(0, 4));
      } else {
        setFeaturedCards([]);
      }
    } catch {
      setFeaturedCards([]);
    }
  };

  const fetchLeastBusinesses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/load_least_businesses.php`);
      const data = await response.json();
      if (data.success && Array.isArray(data.businesses)) {
        setLeastCards(data.businesses.slice(0, 3));
      } else {
        setLeastCards([]);
      }
    } catch {
      setLeastCards([]);
    }
  };

  // --- Fetch all reviews ---
const fetchReviews = async () => {
  try {
    const res = await fetch(`${BASE_URL}/load_allreviews.php?username=${username ?? ''}`);
    const data = await res.json();

    if (data.success && Array.isArray(data.reviews)) {
      // parse reviews
      const parsed = data.reviews.map((review: any) => ({
        id: review.id.toString(),
        name: `${review.fname} ${review.lname}`.trim(), // 👈 Display full name
        business: review.business_name,
        date: review.created_at,
        text: review.comment,
        profile: review.profile_image || null,
        images: Array.isArray(review.images) ? review.images : [],
        like_count: review.like_count || 0,
        comment_count: review.comment_count || 0,
        is_liked: review.is_liked || false, // backend tells if current user liked
      }));

      setReviews(parsed);

      // set maps for fast lookup
      const likes: { [key: string]: number } = {};
      const liked: { [key: string]: boolean } = {};
      parsed.forEach((r: Review & { is_liked?: boolean }) => {
  likes[r.id] = r.like_count;
  liked[r.id] = r.is_liked || false;
});


      setLikeCountMap(likes);
      setLikedMap(liked);
    } else {
      setReviews([]);
      setLikeCountMap({});
      setLikedMap({});
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
    setReviews([]);
    setLikeCountMap({});
    setLikedMap({});
  }
};
  useEffect(() => {
    fetchFeaturedBusinesses();
    fetchLeastBusinesses();
    fetchReviews();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReviews().finally(() => setRefreshing(false));
  }, []);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ✅ Keep welcome message */}
        {username && <Text style={styles.welcomeMessage}>Welcome, {username}!</Text>}

        {/* ✅ Keep logo + search bar */}
        <View style={styles.topBar}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
          <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Marketplace')}>
            <Text style={styles.searchInput}>Search for ...</Text>
            <Ionicons name="search" size={16} color="#888" />
          </TouchableOpacity>
        </View>

        {/* ✅ Keep Top Rated cards */}
        <Text style={styles.sectionTitle}>Top Rated</Text>
        {featuredCards.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={215}
            decelerationRate="fast"
            snapToAlignment="start"
            contentContainerStyle={{ paddingLeft: 10, paddingRight: 20 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {featuredCards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featuredCard}
                onPress={() =>
                  navigation.navigate('BusinessDetails', {
                    id: Number(item.id),
                    name: item.name,
                    image: item.image,
                    address: item.location,
                    username: username ?? '',
                  })
                }
              >
                <Image source={{ uri: item.image }} style={styles.featuredImage} resizeMode="cover" />
                <View style={styles.cardTextRow}>
                  <Text style={styles.featuredName}>{item.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.featuredLocation}>{item.location || ''}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}



        {/* ✅ Keep Least Rated cards */}
        <Text style={styles.sectionTitle}>Check this out!</Text>
        {leastCards.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={215}
            decelerationRate="fast"
            snapToAlignment="start"
            contentContainerStyle={{ paddingLeft: 10, paddingRight: 20 }}
          >
            {leastCards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.featuredCard}
                onPress={() =>
                  navigation.navigate('BusinessDetails', {
                    id: Number(item.id),
                    name: item.name,
                    image: item.image,
                    address: item.location,
                    username: username ?? '',
                  })
                }
              >
                <Image source={{ uri: item.image }} style={styles.featuredImage} resizeMode="cover" />
                <View style={styles.cardTextRow}>
                  <Text style={styles.featuredName}>{item.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.featuredLocation}>{item.location || ''}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ✅ Feed with likes + comments */}
        {reviews.map((review, reviewIndex) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewImages}>
              {review.images.map((img, imgIndex) => (
                <TouchableOpacity key={imgIndex} onPress={() => onImagePress(imgIndex, reviewIndex)}>
                  <Image source={{ uri: img }} style={styles.reviewImage} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.reviewMeta}>
              <View style={styles.reviewHeader}>
                <Image
                  source={review.profile ? { uri: review.profile } : DefaultProfile}
                  style={styles.profilePic}
                />
                <View>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <Text style={styles.reviewBusiness}>Business: {review.business}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
              </View>

              <Text style={styles.reviewText}>{review.text}</Text>

              <View style={styles.iconRow}>
                <TouchableOpacity onPress={() => handleLike(review.id)} style={styles.heartRow}>
                  <Ionicons
                    name={likedMap[review.id] ? 'heart' : 'heart-outline'}
                    size={20}
                    color={likedMap[review.id] ? 'red' : '#333'}
                  />
                  <Text style={styles.likeCount}>{likeCountMap[review.id] || review.like_count}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => openComments(review)} style={styles.commentRow}>
                  <Ionicons name="chatbubble-outline" size={20} color="#333" />
                  <Text style={styles.commentCount}>{review.comment_count}</Text>
                </TouchableOpacity>

                {/* <Ionicons name="share-social-outline" size={20} color="#333" style={styles.icon} /> */}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Image viewer */}
      <ImageViewing
        images={viewerImages}
        imageIndex={currentImageIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
      />

      {/* Comment Modal */}
      <Modal visible={isCommentModalVisible} animationType="slide" onRequestClose={() => setIsCommentModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Comments</Text>
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Text style={styles.commentUser}>{item.username}</Text>
                <Text style={styles.commentText}>{item.text}</Text>
                <Text style={styles.commentDate}>{item.date}</Text>
              </View>
            )}
          />
          <View style={styles.commentInputRow}>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Write a comment..."
              style={styles.commentInput}
            />
            <TouchableOpacity onPress={submitComment}>
              <Ionicons name="send" size={22} color="#008000" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 10, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  logo: { width: 100, height: 70, resizeMode: 'contain' },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 34,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0, paddingRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#008000', marginHorizontal: 20, marginTop: 5, marginBottom: 10 },
  featuredCard: { backgroundColor: '#fff', borderRadius: 10, marginRight: 15, width: 200, borderWidth: 1, borderColor: '#ccc', overflow: 'hidden' },
  featuredImage: { width: 200, height: 100, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  cardTextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 5, marginTop: 5 },
  featuredName: { fontWeight: '600', fontSize: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#333', marginLeft: 3 },
  featuredLocation: { fontSize: 12, color: '#555', marginHorizontal: 5, marginBottom: 5 },

  reviewCard: { backgroundColor: '#fff', margin: 20, padding: 10, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, marginBottom: 2, minHeight: 120 },
  reviewImages: { width: '100%', marginBottom: 10 },
  reviewImage: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover' },
  reviewMeta: { paddingHorizontal: 5 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  profilePic: { width: 50, height: 50, borderRadius: 25, marginRight: 10 },
  reviewName: { fontWeight: 'bold', fontSize: 14 },
  reviewDate: { fontSize: 12, color: '#777' },
  reviewText: { fontSize: 14, marginVertical: 10 },
  reviewBusiness: { fontSize: 14, color: '#555', marginTop: 2 },
  iconRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  icon: { marginRight: 15 },
  heartRow: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  likeCount: { fontSize: 13, color: '#333', marginLeft: 3 },
  commentRow: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  commentCount: { fontSize: 13, color: '#333', marginLeft: 3 },
  welcomeMessage: { fontSize: 16, fontWeight: '600', color: '#004225', marginBottom: 6, marginLeft: 20 },

  // Comments modal
  modalContainer: { flex: 1, padding: 15, backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  commentItem: { marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
  commentUser: { fontWeight: '600', fontSize: 14 },
  commentText: { fontSize: 14, marginVertical: 2 },
  commentDate: { fontSize: 12, color: '#777' },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 10, marginRight: 10, height: 36 },
});
