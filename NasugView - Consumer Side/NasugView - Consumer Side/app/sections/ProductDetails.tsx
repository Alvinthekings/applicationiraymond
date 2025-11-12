import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RootStackParamList } from "../navigation/StackNavigator";
import { BASE_URL } from '../utils/api';

type ProductDetailsRouteProp = RouteProp<RootStackParamList, "ProductDetails">;

export default function ProductDetails() {
  const route = useRoute<ProductDetailsRouteProp>();
  const navigation = useNavigation<any>();

  const { product_id, name, product_name, price, category, media } = route.params as any;

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch product details and reviews
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
  `${BASE_URL}/productDetails.php?product_id=${product_id}`
      );
      const data = await res.json();
      if (data.success) {
        setProduct(data.product);
        setReviews(data.product.reviews || []);
      } else {
        setProduct({
          name: name || product_name,
          price,
          category,
          media,
        });
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setProduct({
        name: name || product_name,
        price,
        category,
        media,
      });
    } finally {
      setLoading(false);
    }
  }, [product_id]);

  // ✅ Refresh automatically when navigating back
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#27ae60" />
      </View>
    );

  if (!product)
    return (
      <View style={styles.center}>
        <Text>Product not found.</Text>
      </View>
    );

  const images = product.media?.length ? product.media : media;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ✅ Product Images */}
      {images && images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((img: string, index: number) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={styles.image}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : (
        <Image source={{ uri: product.image }} style={styles.image} />
      )}

      {/* ✅ Product Info */}
      <Text style={styles.title}>{product.name || name || product_name}</Text>
      <Text style={styles.price}>₱{product.price || price}</Text>

      {/* ✅ Reviews Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>

        {reviews.length > 0 ? (
          reviews.map((r, i) => (
            <View key={i} style={styles.reviewBox}>
              <Text style={styles.reviewUser}>{r.username || "Anonymous"}</Text>
              <Text style={styles.reviewDate}>
                {new Date(r.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.reviewText}>{r.comment}</Text>

              {r.image_review && (
                <Image
                  source={{ uri: r.image_review }}
                  style={styles.reviewImage}
                />
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noReviews}>No reviews yet.</Text>
        )}
      </View>

      {/* ✅ Submit Review Button */}
      <TouchableOpacity
        style={styles.submitReviewBtn}
        onPress={() =>
          navigation.navigate("SubmitReviewProduct", {
            product_id,
            product_name: product.name || name || product_name,
            price: product.price || price,
            category: product.category || category,
          })
        }
      >
        <Text style={styles.submitReviewText}>Submit Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16, backgroundColor: "#fff" },
  image: {
    width: 350,
    height: 280,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    color: "#27ae60",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  reviewBox: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  reviewUser: { fontWeight: "bold", marginBottom: 2 },
  reviewDate: {
    fontSize: 12,
    color: "#999",
    marginBottom: 5,
  },
  reviewText: { fontSize: 15, color: "#333" },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 6,
  },
  noReviews: { color: "#777", fontStyle: "italic" },
  submitReviewBtn: {
    backgroundColor: "#27ae60",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  submitReviewText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
