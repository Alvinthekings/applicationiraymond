import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Video } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { BASE_URL } from '../utils/api';

type BusinessDetailsRouteProp = RouteProp<RootStackParamList, 'BusinessDetails'>;

type Business = {
  id: number;
  name: string;
  image_url?: string;
  address?: string;
  category?: string;
  rating?: number;
  phone?: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
};

type Product = {
  product_id?: number;
  name: string;
  price: string;
  category: string;
  media?: string[];
  image?: string;
};

export default function BusinessDetails() {
  const route = useRoute<BusinessDetailsRouteProp>();
  const { id, name, username } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [modalVisible, setModalVisible] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false); // Follow state

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/get_business.php?name=${encodeURIComponent(name)}`
        );
        const data = await response.json();

        if (data.success && data.business) {
          const biz = {
            ...data.business,
            latitude: Number(data.business.latitude),
            longitude: Number(data.business.longitude),
          };
          setBusiness(biz);
        } else {
          setBusiness(null);
        }
      } catch {
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      fetchBusiness();
    } else {
      setLoading(false);
      setBusiness(null);
    }
  }, [name]);

  useEffect(() => {
    if (business?.id) {
      const fetchProducts = async () => {
        try {
          const response = await fetch(
            `${BASE_URL}/get_products.php?business_id=${business.id}`
          );
          const data: Product[] = await response.json();
          if (Array.isArray(data)) setProducts(data);
          else setProducts([]);
        } catch (err) {
          console.error("Error fetching products:", err);
          setProducts([]);
        }
      };
      fetchProducts();
    }
  }, [business?.id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  if (!business) {
    return <Text style={styles.notFound}>Business not found.</Text>;
  }

  const openInGoogleMaps = () => {
    const lat = business.latitude ?? 0;
    const lng = business.longitude ?? 0;
    const label = encodeURIComponent(business.name);
    const url = `https://www.google.com/maps?q=${lat},${lng}(${label})`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Business Hero */}
      <View style={styles.heroWrapper}>
        <Image
          source={{ uri: business.image_url || 'https://via.placeholder.com/300' }}
          style={styles.heroImage}
        />
        <View style={styles.overlay} />
        <View style={styles.overlayContent}>
          <Text style={styles.heroName}>{business.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{business.rating ?? 0} Rating</Text>
          </View>
          <Text style={styles.heroAddress}>{business.address ?? 'No address provided'}</Text>

          {/* Follow Button */}
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => setIsFollowing(!isFollowing)}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Text style={styles.activeTab}>Info</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Review', {
              id: business.id,
              name: business.name,
              image: business.image_url ?? '',
              address: business.address ?? '',
              username: username ?? '',
              category: business.category,
            })
          }
        >
          <Text style={styles.tab}>Reviews</Text>
        </TouchableOpacity>
        <Text style={styles.tab}>More like this</Text>
      </View>
      <View style={styles.separator} />

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeaderRow}>
          <Text style={styles.infoHeader}>Info</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.badgeLink}>View All Badges</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.infoLabel}>Hours</Text>
        <Text style={styles.infoText}>{business.hours ?? 'Not available'}</Text>

        <Text style={[styles.infoLabel, { marginTop: 12 }]}>Call</Text>
        <View style={styles.callRow}>
          <Text style={styles.infoText}>{business.phone ?? 'N/A'}</Text>
          <Ionicons name="call-outline" size={20} color="#2ecc71" style={{ marginLeft: 10 }} />
        </View>
      </View>

      {/* Map Section */}
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: business.latitude ?? 0,
            longitude: business.longitude ?? 0,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{ latitude: business.latitude ?? 0, longitude: business.longitude ?? 0 }}
            title={business.name}
            description={business.address ?? ''}
          />
        </MapView>
        <TouchableOpacity style={styles.mapButton} onPress={openInGoogleMaps}>
          <Text style={styles.mapButtonText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Products Section */}
      <Text style={[styles.infoHeader, { marginTop: 20 }]}>Products / Services</Text>
      <FlatList
        data={products}
        keyExtractor={(item, index) =>
          item.product_id ? item.product_id.toString() : `temp-${index}`
        }
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productGridCard}
            onPress={() => {
              if (item.media && item.media.length > 0) {
                setCurrentMedia(item.media[0]);
                setIsVideo(item.media[0].endsWith('.mp4'));
                setViewerVisible(true);
              }
            }}
          >
            {item.media && item.media.length > 0 ? (
              <Image source={{ uri: item.media[0] }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, { backgroundColor: '#eee' }]} />
            )}
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.productPrice}>₱{item.price}</Text>
          </TouchableOpacity>
        )}
        scrollEnabled={false}
      />

      {/* Modal for badges */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Badges Earned</Text>
            <Text>🌟 Top Seller</Text>
            <Text>✅ Verified Business</Text>
            <Text>💬 Excellent Reviews</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 20, alignSelf: 'flex-end' }}
            >
              <Text style={{ color: '#2ecc71', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Viewer Modal */}
      <Modal visible={viewerVisible} transparent>
        <View style={styles.viewer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setViewerVisible(false)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {isVideo && currentMedia ? (
            <Video
              source={{ uri: currentMedia }}
              style={{ width: '100%', height: '70%' }}
              useNativeControls
              resizeMode={'contain' as any}
              shouldPlay
            />
          ) : currentMedia ? (
            <Image source={{ uri: currentMedia }} style={styles.viewerImage} />
          ) : null}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  notFound: { padding: 20, fontSize: 16, color: 'gray', textAlign: 'center' },
  heroWrapper: { position: 'relative', height: 200 },
  heroImage: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  overlayContent: { position: 'absolute', bottom: 15, left: 15 },
  heroName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  heroAddress: { color: '#eee', fontSize: 14, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { color: '#fff', marginLeft: 6, fontSize: 14 },
  tabRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
  tab: { fontSize: 14, color: '#555' },
  activeTab: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007a33',
    borderBottomWidth: 3,
    borderColor: '#007a33',
    paddingBottom: 4,
  },
  separator: { borderBottomWidth: 1, borderColor: '#ccc', marginTop: 8 },
  infoSection: { padding: 15 },
  infoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoHeader: { fontSize: 18, fontWeight: 'bold' },
  badgeLink: { fontSize: 13, color: '#008000' },
  infoLabel: { fontWeight: '600', marginTop: 8 },
  infoText: { fontSize: 14, color: '#333' },
  callRow: { flexDirection: 'row', alignItems: 'center' },
  mapWrapper: { height: 200, margin: 15, borderRadius: 8, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
  mapButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#007a33',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mapButtonText: { color: '#fff', fontWeight: '600' },
  productGridCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    position: 'relative',
  },
  productImage: { width: '100%', height: 120, borderRadius: 8 },
  productName: { marginTop: 8, fontWeight: '600' },
  productPrice: { color: '#007a33', fontWeight: 'bold' },
  viewer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  closeButton: { position: 'absolute', top: 40, right: 20 },
  viewerImage: { width: '90%', height: '70%', resizeMode: 'contain' },

  // Follow Button Styles
  followButton: {
    marginTop: 10,
    backgroundColor: '#2ecc71',
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2ecc71',
  },
  followingButtonText: {
    color: '#2ecc71',
  },
});
