import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import MapView, { Marker } from "react-native-maps";
import { BASE_URL } from '../utils/api';

type Product = {
  product_id?: number;
  name: string;
  price: string;
  category: string;
  media?: string[];
  image?: string;
};

export default function BusinessProfile() {
  const [activeTab, setActiveTab] = useState<"Posting" | "Info" | "Reviews" | "More">("Posting");

  const [business] = useState({
    name: "Croshei Things",
    rating: 4.5,
    address: "123 Main Street, Nasugbu, Batangas",
    phone: "0917-123-4567",
    hours: "Mon - Sun | 9:00 AM - 8:00 PM",
    latitude: 14.0666,
    longitude: 120.6328,
    image: "https://images.unsplash.com/photo-1521334884684-d80222895322?fit=crop&w=1200&q=80",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: null as string | null,
    media: [] as string[],
  });

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: "Bouquet", value: "Bouquet" },
    { label: "Sunflower", value: "Sunflower" },
    { label: "Dresses", value: "Dresses" },
    { label: "Shorts", value: "Shorts" },
  ]);
  const [customCategory, setCustomCategory] = useState("");
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productModalVisible, setProductModalVisible] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const [menuVisible, setMenuVisible] = useState<number | null>(null); // for 3-dot menu

  const fetchProducts = () => {
  fetch(`${BASE_URL}/get_products.php`)
      .then((res) => res.json())
      .then((data: Product[]) => setProducts(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewProduct({
        ...newProduct,
        media: result.assets.map((asset) => asset.uri),
      });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || newProduct.media.length === 0) {
      Alert.alert("Missing Fields", "Please enter product name, price, and at least one image/video.");
      return;
    }

    const formData = new FormData();
    formData.append("business_id", "1");
    formData.append("name", newProduct.name);
    formData.append("price", newProduct.price);
    formData.append("category", newProduct.category || "");

    newProduct.media.forEach((uri, index) => {
      const isVideoFile = uri.endsWith(".mp4") || uri.endsWith(".mov");
      formData.append("media[]", {
        uri,
        type: isVideoFile ? "video/mp4" : "image/jpeg",
        name: `upload_${index}.${isVideoFile ? "mp4" : "jpg"}`,
      } as any);
    });

    try {
  const res = await fetch(`${BASE_URL}/add_product.php`, {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      console.log("Server raw response:", text);

      if (!text) {
        Alert.alert("Server Error", "Empty response received from server.");
        return;
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("JSON parse failed:", err);
        Alert.alert("Server Error", "Invalid response format from server.");
        return;
      }

      if (result.success) {
        Alert.alert("Success", "Product/Service added!");
        setNewProduct({ name: "", price: "", category: null, media: [] });
        fetchProducts();
      } else {
        Alert.alert("Error", result.message || "Failed to add product");
      }
    } catch (err) {
      console.error("Network error:", err);
      Alert.alert("Error", "Unable to connect to the server");
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price,
      category: product.category,
      media: product.media || [],
    });
    Alert.alert("Edit Mode", "You can now modify this product’s details in the fields above.");
  };

  const openInGoogleMaps = () => {
    const { latitude, longitude, name } = business;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}(${encodeURIComponent(name)})`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.heroWrapper}>
        {business.image ? (
          <Image source={{ uri: business.image }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: "#ccc" }]} />
        )}
        <View style={styles.overlay} />
        <View style={styles.overlayContent}>
          <Text style={styles.heroName}>{business.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{business.rating} Rating</Text>
          </View>
          <Text style={styles.heroAddress}>{business.address}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {["Posting", "Info", "Reviews", "More"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as any)}>
            <Text style={activeTab === tab ? styles.activeTab : styles.tab}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.separator} />

      {/* === Posting Section === */}
      {activeTab === "Posting" && (
        <FlatList
          data={products}
          keyExtractor={(item, index) =>
            item.product_id ? item.product_id.toString() : `temp-${index}`
          }
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productGridCard}
              onPress={() => {
                setSelectedProduct(item);
                setProductModalVisible(true);
              }}
            >
              {item.media && item.media.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setCurrentMedia(item.media![0]);
                    setIsVideo(item.media![0].endsWith(".mp4"));
                    setViewerVisible(true);
                  }}
                >
                  <Image source={{ uri: item.media[0] }} style={styles.productImage} />
                  {item.media[0].endsWith(".mp4") && (
                    <View style={styles.videoOverlay}>
                      <Ionicons name="play-circle" size={40} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={[styles.productImage, { backgroundColor: "#eee" }]} />
              )}
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.productPrice}>₱{item.price}</Text>
            </TouchableOpacity>
          )}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          ListHeaderComponent={
            <View style={{ padding: 15 }}>
              {/* Post Card */}
              <View style={styles.postCard}>
                <View style={styles.postRow}>
                  <Ionicons
                    name="storefront"
                    size={36}
                    color="#007a33"
                    style={styles.avatarIcon}
                  />
                  <TextInput
                    style={styles.postInput}
                    placeholder="Enter Product or Service name."
                    value={newProduct.name}
                    onChangeText={(t) => setNewProduct({ ...newProduct, name: t })}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Ionicons name="pricetag" size={20} color="#777" />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Enter Price (₱)"
                    keyboardType="numeric"
                    value={newProduct.price}
                    onChangeText={(t) => setNewProduct({ ...newProduct, price: t })}
                  />
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 6 }}>
                    Category / Service Type
                  </Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="list" size={20} color="#777" />
                    <DropDownPicker
                      open={open}
                      value={newProduct.category}
                      items={items}
                      setOpen={setOpen}
                      setValue={(callback) =>
                        setNewProduct((prev) => ({ ...prev, category: callback(prev.category) }))
                      }
                      setItems={setItems}
                      style={styles.dropdownStyled}
                      dropDownContainerStyle={styles.dropdownContainer}
                      placeholder="Pick a category / services offered"
                      textStyle={{ fontSize: 14 }}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.imageUploadButton} onPress={pickImage}>
                  <Ionicons name="camera" size={18} color="#007a33" />
                  <Text style={styles.imageUploadText}>Upload Media</Text>
                </TouchableOpacity>

                {newProduct.media.length > 0 && (
                  <ScrollView
                    horizontal
                    nestedScrollEnabled={true}
                    showsHorizontalScrollIndicator={false}
                  >
                    {newProduct.media.map((uri, idx) =>
                      uri.endsWith(".mp4") ? (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => {
                            setCurrentMedia(uri);
                            setIsVideo(true);
                            setViewerVisible(true);
                          }}
                        >
                          <View style={styles.videoThumb}>
                            <Ionicons name="play-circle" size={32} color="#fff" />
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => {
                            setCurrentMedia(uri);
                            setIsVideo(false);
                            setViewerVisible(true);
                          }}
                        >
                          <Image source={{ uri }} style={styles.previewImage} />
                        </TouchableOpacity>
                      )
                    )}
                  </ScrollView>
                )}

                <TouchableOpacity style={styles.postButton} onPress={handleAddProduct}>
                  <Text style={styles.postButtonText}>Post Product / Service</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.infoHeader, { marginTop: 20 }]}>Products / Services</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* === Info Section === */}
      {activeTab === "Info" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }}>
          <View style={styles.infoSection}>
            <Text style={styles.infoHeader}>Info</Text>
            <Text style={styles.infoLabel}>Hours</Text>
            <Text style={styles.infoText}>{business.hours}</Text>

            <Text style={[styles.infoLabel, { marginTop: 12 }]}>Call</Text>
            <View style={styles.callRow}>
              <Text style={styles.infoText}>{business.phone}</Text>
              <Ionicons name="call-outline" size={20} color="#2ecc71" />
            </View>
          </View>

          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: business.latitude,
                longitude: business.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{ latitude: business.latitude, longitude: business.longitude }}
                title={business.name}
                description={business.address}
              />
            </MapView>
            <TouchableOpacity style={styles.mapButton} onPress={openInGoogleMaps}>
              <Text style={styles.mapButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* === Media Viewer Modal === */}
      <Modal visible={viewerVisible} transparent>
        <View style={styles.viewer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setViewerVisible(false)}>
            <Ionicons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>
          {isVideo && currentMedia ? (
            <Video
              source={{ uri: currentMedia }}
              style={{ width: "100%", height: "70%" }}
              useNativeControls
              resizeMode={"contain" as any}
              shouldPlay
            />
          ) : currentMedia ? (
            <Image source={{ uri: currentMedia }} style={styles.viewerImage} />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  heroWrapper: { height: 200 },
  heroImage: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  overlayContent: { position: "absolute", bottom: 10, left: 10 },
  heroName: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText: { color: "#fff", marginLeft: 4 },
  heroAddress: { color: "#fff", marginTop: 2 },
  tabRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 10 },
  tab: { fontSize: 16, color: "#555" },
  activeTab: { fontSize: 16, fontWeight: "bold", color: "#007a33" },
  separator: { height: 1, backgroundColor: "#ddd", marginVertical: 10 },
  postCard: { backgroundColor: "#f9f9f9", padding: 12, borderRadius: 8 },
  postRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatarIcon: { marginRight: 8 },
  postInput: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#007a33",
  },
  inputRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  inputField: { marginLeft: 8, flex: 1, borderBottomWidth: 1, borderColor: "#ccc", paddingVertical: 4 },
  dropdownStyled: { width: "90%", marginLeft: 8 },
  dropdownContainer: { marginTop: 0 },
  imageUploadButton: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  imageUploadText: { marginLeft: 4, color: "#007a33" },
  postButton: { backgroundColor: "#007a33", padding: 10, borderRadius: 8, alignItems: "center" },
  postButtonText: { color: "#fff", fontWeight: "600" },
  previewImage: { width: 80, height: 80, borderRadius: 6, marginRight: 8 },
  videoThumb: {
    width: 80,
    height: 80,
    backgroundColor: "black",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  productGridCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    position: "relative",
  },
  productImage: { width: "100%", height: 120, borderRadius: 8 },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  productName: { marginTop: 8, fontWeight: "600" },
  productPrice: { color: "#007a33", fontWeight: "bold" },
  menuButton: { position: "absolute", top: 8, right: 8, padding: 4 },
  menuContainer: {
    position: "absolute",
    top: 28,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    elevation: 4,
    zIndex: 999,
  },
  infoSection: { padding: 15 },
  infoHeader: { fontSize: 18, fontWeight: "bold" },
  infoLabel: { fontWeight: "600", marginTop: 8 },
  infoText: { fontSize: 14, color: "#333" },
  callRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mapWrapper: { height: 200, margin: 15, borderRadius: 8, overflow: "hidden" },
  map: { ...StyleSheet.absoluteFillObject },
  mapButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#007a33",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mapButtonText: { color: "#fff", fontWeight: "600" },
  viewer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: { position: "absolute", top: 40, right: 20 },
  viewerImage: { width: "90%", height: "70%", resizeMode: "contain" },
});
