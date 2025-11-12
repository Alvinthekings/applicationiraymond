import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MasonryList from '@react-native-seoul/masonry-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { RootStackParamList } from '../navigation/StackNavigator';
import { BASE_URL } from '../utils/api';

const categories = ['All', 'Nearby', 'Restaurants', 'Clothes', 'Resorts', 'Cafes'];

type Business = {
  id: number;
  name: string;
  image_url: string;
  address: string;
  category: string;
  rating: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
};

export default function Marketplace() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStars, setSelectedStars] = useState(0);
  const [nearbyActive, setNearbyActive] = useState(false);
  const [categoryLayouts, setCategoryLayouts] = useState<{ [key: string]: number }>({});
  const categoryScrollRef = useRef<ScrollView>(null);
  const [username, setUsername] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [nearbyData, setNearbyData] = useState<Business[] | null>(null);

  const starOptions = [1, 2, 3, 4, 5]; // Fixed 1–5 stars

  // Compute available stars dynamically based on current businesses
  const availableStars = Array.from(
    new Set(
      businesses
        .map(biz => Math.floor(Number(biz.rating)))
        .filter(r => r > 0)
    )
  ).sort((a, b) => a - b);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/load_businesses.php`);
      const data = await res.json();
      if (data.success) {
        setBusinesses(data.businesses);
        setFilteredBusinesses(data.businesses);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load businesses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('username').then(value => {
      if (value) setUsername(value);
    });
  }, []);

  const handleCategoryPress = async (cat: string) => {
    if (cat === 'Nearby') {
      const newNearbyState = !nearbyActive;
      setNearbyActive(newNearbyState);

      if (newNearbyState) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please allow location access to see nearby businesses.');
            return;
          }

          const location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;

          setLoading(true);
          const response = await fetch(
            `${BASE_URL}/load_nearby_businesses.php?lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          if (data.success) {
            setNearbyData(data.businesses);
            if (selectedCategory !== 'All') {
              const filtered = data.businesses.filter((biz: Business) => biz.category === selectedCategory);
              setFilteredBusinesses(filtered);
            } else {
              setFilteredBusinesses(data.businesses);
            }
          } else {
            Alert.alert('No Results', 'No nearby businesses found.');
            setNearbyData([]);
            setFilteredBusinesses([]);
          }
        } catch (error) {
          console.error('Nearby fetch error:', error);
          Alert.alert('Error', 'Unable to fetch nearby businesses.');
        } finally {
          setLoading(false);
        }
      } else {
        setNearbyData(null);
        if (selectedCategory === 'All') {
          setFilteredBusinesses(businesses);
        } else {
          const filtered = businesses.filter((biz: Business) => biz.category === selectedCategory);
          setFilteredBusinesses(filtered);
        }
      }
    } else {
      setSelectedCategory(cat);

      if (categoryScrollRef.current && categoryLayouts[cat] !== undefined) {
        categoryScrollRef.current.scrollTo({ x: categoryLayouts[cat] - 20, animated: true });
      }

      const baseData = nearbyActive && nearbyData ? nearbyData : businesses;

      if (cat === 'All') {
        setFilteredBusinesses(baseData);
      } else {
        const filtered = baseData.filter((biz: Business) => biz.category === cat);
        setFilteredBusinesses(filtered);
      }
    }
  };

  const handleStarPress = (star: number) => {
    setSelectedStars(prev => (prev === star ? 0 : star));
  };

  useEffect(() => {
    const baseData = nearbyActive && nearbyData ? nearbyData : businesses;
    let filtered = baseData.filter(
      (biz: Business) =>
        biz.name.toLowerCase().includes(searchText.toLowerCase()) &&
        (selectedCategory === 'All' || biz.category === selectedCategory)
    );

    if (selectedStars > 0) {
      filtered = filtered.filter(biz => Math.floor(Number(biz.rating)) === selectedStars);
    }

    setFilteredBusinesses(filtered);
  }, [searchText, selectedCategory, selectedStars, nearbyActive, nearbyData, businesses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBusinesses();
    setNearbyData(null);
    setNearbyActive(false);
    setSelectedCategory('All');
    setSelectedStars(0);
    setRefreshing(false);
  }, []);

  const renderCard = ({ item }: { item: Business }) => {
    const fixedHeight = 200;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('BusinessDetails', {
            name: item.name,
            image: item.image_url,
            address: item.address,
            username: username,
          })
        }
      >
        <Image source={{ uri: item.image_url }} style={[styles.cardImage, { height: fixedHeight }]} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.ratingRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.floor(item.rating) ? 'star' : 'star-outline'}
                size={14}
                color="#FFD700"
              />
            ))}
            <Text style={styles.ratingText}>{Number(item.rating) ? Number(item.rating).toFixed(1) : '0.0'}</Text>
          </View>
          <Text style={styles.cardAddress}>{item.address}</Text>
          {nearbyActive && item.distance && (
            <Text style={styles.distanceText}>{item.distance.toFixed(2)} km away</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="gray" />
            <TextInput
              placeholder="Search for"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map(cat => {
            const isActive =
              (cat === 'Nearby' && nearbyActive) ||
              (cat === selectedCategory && cat !== 'Nearby');
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryButton, isActive && styles.categoryActive]}
                onPress={() => handleCategoryPress(cat)}
                onLayout={e => {
                  const x = e.nativeEvent.layout.x;
                  setCategoryLayouts(prev => ({ ...prev, [cat]: x }));
                }}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

       {/* Star Filter */}
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={[styles.categoryScroll, { paddingVertical: 5 }]}
>
  {starOptions
    .filter(star => availableStars.includes(star)) // show only existing stars
    .map(star => {
      const isActive = selectedStars === star;
      return (
        <TouchableOpacity
          key={star}
          style={[styles.categoryButton, isActive && styles.categoryActive]}
          onPress={() => handleStarPress(star)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: isActive ? '#fff' : '#000', marginRight: 4}}>
              {star}
            </Text>
            {[...Array(star)].map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                size={14}
                color={isActive ? '#fff' : '#FFD700'}
              />
            ))}
          </View>
        </TouchableOpacity>
      );
    })}
</ScrollView>


        {/* Business Cards */}
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <ActivityIndicator size="large" color="#004225" />
          </View>
        ) : filteredBusinesses.length > 0 ? (
          <MasonryList
            data={filteredBusinesses}
            keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => renderCard({ item: item as Business })}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View style={styles.noResult}>
            <Text style={styles.noResultText}>No businesses found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  logo: { width: 100, height: 30 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    marginLeft: 10,
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  searchInput: { padding: 8, flex: 1 },
  categoryScroll: { paddingHorizontal: 10, paddingBottom: 5 },
  categoryButton: {
    borderColor: '#ccc',
    borderWidth: 1,
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryActive: { backgroundColor: '#004225', borderColor: '#004225' },
  categoryText: { color: '#000', fontSize: 14 },
  categoryTextActive: { color: '#fff', fontWeight: 'bold' },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardContent: { padding: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  cardAddress: { fontSize: 12, color: '#555', marginTop: 2 },
  distanceText: { fontSize: 12, color: '#004225', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { marginLeft: 4, fontSize: 12, color: '#444' },
  noResult: { alignItems: 'center', marginTop: 50 },
  noResultText: { fontSize: 16, color: '#999' },
});
