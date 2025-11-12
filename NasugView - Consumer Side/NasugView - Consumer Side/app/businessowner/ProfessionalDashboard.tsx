import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import Svg, { Rect } from "react-native-svg";
import { BASE_URL } from '../utils/api';

const screenWidth = Dimensions.get("window").width;

type Product = {
  product_id?: number;
  name: string;
  category?: string;
  media?: string[];
};

type Review = {
  username: string;
  fname?: string;
  lname?: string;
  comment: string;
  rating: number;
  created_at: string;
  image_path?: string | null;
  profile_image?: string | null;
};

type Business = {
  id?: number;
  name: string;
  rating?: number;
  address?: string;
  phone?: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
};

export default function ProfessionalDashboard() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [reviewSummary, setReviewSummary] = useState({
    totalReviews: 0,
    avgRating: 0,
    distribution: [0, 0, 0, 0, 0],
  });

  const businessName = "Croshei Things"; // 🔹 replace with logged-in business name if available

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_products.php`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.warn("Error fetching products:", err);
      setProducts([]);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/get_reviews.php?business_name=${encodeURIComponent(businessName)}`
      );
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews);
        const total = json.reviews.length;
        const avg =
          json.reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) /
          Math.max(1, total);
        setReviewSummary({
          totalReviews: total,
          avgRating: avg,
          distribution: json.star_counts || [0, 0, 0, 0, 0],
        });
      }
    } catch (err) {
      console.warn("Error fetching reviews:", err);
      setReviews([]);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchReviews()]);
      setLoading(false);
    })();
  }, []);

  const [activeTab, setActiveTab] = useState<
    "Views" | "Engagement" | "Audience"
  >("Views");

  const lineLabels = [
    "Sep 10",
    "Sep 11",
    "Sep 12",
    "Sep 13",
    "Sep 14",
    "Sep 15",
    "Sep 16",
  ];
  const viewsData = [300, 280, 200, 120, 20, 60, 40];
  const followersData = [300, 305, 310, 320, 330, 335, 340];

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ marginTop: 8 }}>Loading insights...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Insights — {businessName}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["Views", "Engagement", "Audience"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* VIEWS */}
      {activeTab === "Views" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {`${viewsData.reduce((a, b) => a + b, 0)} Views`}
          </Text>
          <Text style={styles.redText}>↓ 86% from previous 7 days</Text>

          <View style={styles.chartWrapper}>
            <LineChart
              data={{
                labels: lineLabels,
                datasets: [{ data: viewsData }],
              }}
              width={screenWidth - 32}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          <Text style={styles.sectionHeader}>How People Engage</Text>
          <ProgressBar label="Multi Photo" value={70} color="#2e7d32" />
          <ProgressBar label="Other" value={30} color="#81c784" />
        </View>
      )}

      {/* ENGAGEMENT */}
      {activeTab === "Engagement" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {reviewSummary.totalReviews} Reviews
          </Text>
          <Text style={styles.greenText}>
            Avg. Rating: ⭐ {reviewSummary.avgRating.toFixed(1)}
          </Text>

          <Text style={styles.sectionHeader}>Rating Breakdown</Text>
          {reviewSummary.distribution.map((count, i) => (
            <ProgressBar
              key={i}
              label={`${5 - i} ★`}
              value={
                (count / Math.max(1, reviewSummary.totalReviews)) * 100
              }
              color={i === 0 ? "#2e7d32" : "#81c784"}
            />
          ))}

          <Text style={styles.sectionHeader}>Feedbacks</Text>
          {reviews.length > 0 ? (
            reviews.map((rev, idx) => (
              <View key={idx} style={styles.productContainer}>
                {rev.image_path ? (
                  <Image
                    source={{ uri: rev.image_path }}
                    style={styles.productImageSmall}
                  />
                ) : (
                  <View
                    style={[styles.productImageSmall, { backgroundColor: "#eee" }]}
                  />
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>
                    {rev.fname} {rev.lname}
                  </Text>
                  <Text style={{ color: "#333" }}>⭐ {rev.rating.toFixed(1)}</Text>
                  <Text>{rev.comment}</Text>
                  <Text style={{ fontSize: 12, color: "#777" }}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text>No feedbacks yet.</Text>
          )}
        </View>
      )}

      {/* AUDIENCE */}
      {activeTab === "Audience" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>340 Total Followers</Text>
          <Text style={styles.greenText}>↑ 1% from previous 7 days</Text>

          <View style={styles.chartWrapper}>
            <LineChart
              data={{
                labels: lineLabels,
                datasets: [{ data: followersData }],
              }}
              width={screenWidth - 32}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>

          <Text style={styles.sectionHeader}>Age & Gender</Text>
          <ProgressBar label="18-24" value={52.9} color="#43a047" />
          <ProgressBar label="25-34" value={36.5} color="#66bb6a" />
          <ProgressBar label="35-44" value={7.1} color="#a5d6a7" />
          <ProgressBar label="Other" value={3.5} color="#c8e6c9" />

          <View style={styles.chartWrapper}>
            <PieChart
              data={[
                {
                  name: "Male",
                  population: 55,
                  color: "#2e7d32",
                  legendFontColor: "#333",
                  legendFontSize: 12,
                },
                {
                  name: "Female",
                  population: 45,
                  color: "#81c784",
                  legendFontColor: "#333",
                  legendFontSize: 12,
                },
              ]}
              width={screenWidth - 32}
              height={180}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: "#e5f5e0",
  backgroundGradientFrom: "#e5f5e0",
  backgroundGradientTo: "#c7e9c0",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(34, 139, 34, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(34, 34, 34, ${opacity})`,
};

function ProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <View style={{ marginVertical: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: "500", marginBottom: 4 }}>
        {label} – {safeValue.toFixed(1)}%
      </Text>
      <View style={{ height: 10, backgroundColor: "#eee", borderRadius: 5 }}>
        <Svg height="10" width="100%">
          <Rect
            x="0"
            y="0"
            height="10"
            width={`${safeValue}%`}
            fill={color}
            rx={5}
            ry={5}
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5fdf5", padding: 16 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  header: { fontSize: 20, fontWeight: "700", color: "#1b5e20" },
  tabContainer: { flexDirection: "row", marginBottom: 12 },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#ccc",
  },
  activeTab: { borderBottomColor: "#2e7d32" },
  tabText: { fontSize: 14, color: "#666" },
  activeTabText: { fontWeight: "bold", color: "#2e7d32" },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#1b5e20",
  },
  redText: { color: "red", fontSize: 14 },
  greenText: { color: "green", fontSize: 14 },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: "#1b5e20",
  },
  productContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
  },
  productImageSmall: { width: 60, height: 60, borderRadius: 6, marginRight: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  chartWrapper: { alignItems: "center", marginVertical: 8 },
  chart: { borderRadius: 12 },
  loadingWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
});
