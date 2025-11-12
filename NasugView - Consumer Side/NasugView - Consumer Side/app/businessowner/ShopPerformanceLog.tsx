import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { BASE_URL } from '../utils/api';

interface Product {
  product_id: number;
  name: string;
  price: number | string;
}

interface PerformanceEntry {
  id: string;
  date: string;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  earnings: number;
  visitors_male: number;
  visitors_female: number;
  notes?: string;
}

export default function ShopPerformanceLog() {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState("");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [earnings, setEarnings] = useState(0);
  const [visitorsMale, setVisitorsMale] = useState(0);
  const [visitorsFemale, setVisitorsFemale] = useState(0);
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<PerformanceEntry[]>([]);

  // Filter states
  const [filterType, setFilterType] = useState<"day" | "month" | "year">("day");
  const [filterValue, setFilterValue] = useState<string>(""); // YYYY, YYYY-MM, or YYYY-MM-DD
  const [filterProductId, setFilterProductId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchEntries();
  }, []);

  useEffect(() => {
    setEarnings(price * quantity);
  }, [price, quantity]);

  useEffect(() => {
    fetchEntries(filterValue, filterProductId);
  }, [filterValue, filterProductId]);

  const fetchProducts = async () => {
    try {
  const res = await fetch(`${BASE_URL}/get_products.php`);
      const data = await res.json();
      setProducts(data);
    } catch {
      Alert.alert("Error", "Cannot load products.");
    }
  };

  const fetchEntries = async (dateFilter: string = "", productId: number | null = null) => {
    try {
  let url = `${BASE_URL}/get_shoplogs.php?`;
      if (dateFilter) url += `date=${dateFilter}&`;
      if (productId) url += `product_id=${productId}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const cleanEntries = data.entries.map((e: any) => ({
          ...e,
          price: Number(e.price) || 0,
          earnings: Number(e.earnings) || 0,
          visitors_male: Number(e.visitors_male) || 0,
          visitors_female: Number(e.visitors_female) || 0,
        }));
        setEntries(cleanEntries);
      }
    } catch {
      Alert.alert("Error", "Cannot load entries.");
    }
  };

  const handleAddEntry = async () => {
    if (!selectedProductId) {
      Alert.alert("Missing fields", "Please select a product.");
      return;
    }
    const newEntry = {
      date: date.toISOString().split("T")[0],
      product_id: selectedProductId,
      product_name: selectedProductName,
      price,
      quantity,
      earnings,
      visitors_male: visitorsMale,
      visitors_female: visitorsFemale,
      notes,
    };
    try {
  const res = await fetch(`${BASE_URL}/save_shoplog.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });
      const data = await res.json();
      if (data.success) {
        setEntries((prev) => [{ ...newEntry, id: Date.now().toString() }, ...prev]);
        // Reset inputs
        setSelectedProductId(null);
        setSelectedProductName("");
        setPrice(0);
        setQuantity(1);
        setVisitorsMale(0);
        setVisitorsFemale(0);
        setNotes("");
      } else {
        Alert.alert("Error", data.message || "Failed to save entry.");
      }
    } catch {
      Alert.alert("Error", "Cannot connect to server.");
    }
  };

  const renderItem = ({ item }: { item: PerformanceEntry }) => (
    <View style={styles.tableRow} key={item.id}>
      <Text style={[styles.cell, { minWidth: 90 }]}>{item.date}</Text>
      <Text style={[styles.cell, { minWidth: 120 }]}>{item.product_name}</Text>
      <Text style={[styles.cell, { minWidth: 80 }]}>₱{item.price.toFixed(2)}</Text>
      <Text style={[styles.cell, { minWidth: 80 }]}>{item.quantity}</Text>
      <Text style={[styles.cell, { minWidth: 100 }]}>₱{item.earnings.toFixed(2)}</Text>
      <Text style={[styles.cell, { minWidth: 100 }]}>{item.visitors_male}</Text>
      <Text style={[styles.cell, { minWidth: 100 }]}>{item.visitors_female}</Text>
      <Text style={[styles.cell, { minWidth: 140 }]}>{item.notes || "-"}</Text>
    </View>
  );

  const onChangeDate = (_event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setDate(selected);
      setFilterValue(selected.toISOString().split("T")[0]);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => `${new Date().getFullYear() - i}`);
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}`.padStart(2, "0"));

  // ----- Chart Preparation -----
  const screenWidth = Dimensions.get("window").width;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const chartData = () => {
    const earningsPerMonth = Array(12).fill(0);

    entries.forEach((e) => {
      const monthIndex = new Date(e.date).getMonth();
      earningsPerMonth[monthIndex] += e.earnings;
    });

    return {
      labels: monthNames,
      datasets: [
        {
          data: earningsPerMonth,
          color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>

            {/* --- Monthly Sales Chart --- */}
            <Text style={[styles.header, { fontSize: 18, marginTop: 10 }]}>
              📈 Monthly Sales
            </Text>
            {entries.length > 0 ? (
              <LineChart
                data={chartData()}
                width={screenWidth - 32}
                height={250}
                yAxisLabel="₱"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#C8E6C9",
                  backgroundGradientTo: "#A5D6A7",
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#2E7D32" },
                }}
                bezier
                style={{ marginVertical: 12, borderRadius: 16 }}
              />
            ) : (
              <Text style={{ textAlign: "center", color: "#666", marginVertical: 10 }}>
                No data to display.
              </Text>
            )}

            {/* Product Selection */}
            <View style={[styles.input, { overflow: "hidden" }]}>
              <Picker
                selectedValue={selectedProductId}
                dropdownIconColor="#333"
                onValueChange={(value) => {
                  setSelectedProductId(Number(value));
                  const prod = products.find((p) => p.product_id === Number(value));
                  if (prod) {
                    setSelectedProductName(prod.name);
                    setPrice(Number(prod.price) || 0);
                  }
                }}
              >
                <Picker.Item label="Select Product" value={""} />
                {products.map((p) => (
                  <Picker.Item key={p.product_id} label={p.name} value={p.product_id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Price: ₱{price.toFixed(2)}</Text>

            {/* Quantity & Visitors */}
            <View style={[styles.counterRow, { justifyContent: "center" }]}>
              <View style={styles.counter}>
                <Text style={styles.label}>Product Qty</Text>
                <View style={styles.counterBtns}>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: "#E53935" }]}
                    onPress={() => setQuantity(Math.max(0, quantity - 1))}
                  >
                    <Text style={styles.counterText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.count}>{quantity}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: "#388E3C" }]}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Text style={styles.counterText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.counterRow}>
              <View style={styles.counter}>
                <Text style={styles.label}>Male Visitors</Text>
                <View style={styles.counterBtns}>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: "#E53935" }]}
                    onPress={() => setVisitorsMale(Math.max(0, visitorsMale - 1))}
                  >
                    <Text style={styles.counterText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.count}>{visitorsMale}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: "#388E3C" }]}
                    onPress={() => setVisitorsMale(visitorsMale + 1)}
                  >
                    <Text style={styles.counterText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.counter}>
                <Text style={styles.label}>Female Visitors</Text>
                <View style={styles.counterBtns}>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: "#E53935" }]}
                    onPress={() => setVisitorsFemale(Math.max(0, visitorsFemale - 1))}
                  >
                    <Text style={styles.counterText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.count}>{visitorsFemale}</Text>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: "#388E3C" }]}
                    onPress={() => setVisitorsFemale(visitorsFemale + 1)}
                  >
                    <Text style={styles.counterText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.addButton} onPress={handleAddEntry}>
              <Text style={styles.buttonText}>Add Entry</Text>
            </TouchableOpacity>

            {/* Filters */}
            <Text style={[styles.header, { fontSize: 18, marginTop: 10 }]}>Filter Entries</Text>
            <View style={[styles.input, { overflow: "hidden", marginBottom: 10 }]}>
              <Picker
                selectedValue={filterProductId}
                dropdownIconColor="#333"
                onValueChange={(value) => setFilterProductId(Number(value))}
              >
                <Picker.Item label="All Products" value={0} />
                {products.map((p) => (
                  <Picker.Item key={p.product_id} label={p.name} value={p.product_id} />
                ))}
              </Picker>
            </View>

            <View style={[styles.input, { overflow: "hidden" }]}>
              <Picker
                selectedValue={filterType}
                onValueChange={(value) => {
                  setFilterType(value as "day" | "month" | "year");
                  setFilterValue("");
                }}
              >
                <Picker.Item label="Filter by Day" value="day" />
                <Picker.Item label="Filter by Month" value="month" />
                <Picker.Item label="Filter by Year" value="year" />
              </Picker>
            </View>

            {filterType === "day" && (
              <>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Text>{date.toISOString().split("T")[0]}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onChangeDate}
                  />
                )}
              </>
            )}

            {filterType === "month" && (
              <View style={[styles.input, { flexDirection: "row" }]}>
                <Picker
                  style={{ flex: 1 }}
                  selectedValue={date.getFullYear().toString()}
                  onValueChange={(year) => {
                    setFilterValue(`${year}-${months[date.getMonth()]}`);
                    setDate(new Date(Number(year), date.getMonth(), 1));
                  }}
                >
                  {years.map((y) => (
                    <Picker.Item key={y} label={y} value={y} />
                  ))}
                </Picker>
                <Picker
                  style={{ flex: 1 }}
                  selectedValue={(date.getMonth() + 1).toString().padStart(2, "0")}
                  onValueChange={(month) => {
                    setFilterValue(`${date.getFullYear()}-${month}`);
                    setDate(new Date(date.getFullYear(), Number(month) - 1, 1));
                  }}
                >
                  {months.map((m) => (
                    <Picker.Item key={m} label={m} value={m} />
                  ))}
                </Picker>
              </View>
            )}

            {filterType === "year" && (
              <View style={[styles.input, { overflow: "hidden" }]}>
                <Picker
                  selectedValue={date.getFullYear().toString()}
                  onValueChange={(year) => {
                    setFilterValue(year);
                    setDate(new Date(Number(year), 0, 1));
                  }}
                >
                  {years.map((y) => (
                    <Picker.Item key={y} label={y} value={y} />
                  ))}
                </Picker>
              </View>
            )}

            {/* Entire Table Scrollable */}
            <ScrollView horizontal style={{ marginTop: 10 }}>
              <View>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeader]}>
                  {[
                    "Date",
                    "Product",
                    "Price",
                    "Product Qty",
                    "Earnings",
                    "Male Visitors",
                    "Female Visitors",
                    "Notes",
                  ].map((h, idx) => (
                    <Text style={[styles.cell, styles.headerCell, { minWidth: 100 }]} key={idx}>
                      {h}
                    </Text>
                  ))}
                </View>

                {/* Table Rows */}
                {entries.map((item) => renderItem({ item }))}
              </View>
            </ScrollView>
          </>
        }
        renderItem={null} // disable FlatList row rendering; handled by ScrollView
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },
  header: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 16, color: "#2E7D32" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: "#fff" },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 6, color: "#333" },
  counterRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  counter: { alignItems: "center" },
  counterBtns: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  counterBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center", borderRadius: 6, marginHorizontal: 5 },
  counterText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  count: { fontSize: 18, fontWeight: "bold", color: "#333", minWidth: 30, textAlign: "center" },
  addButton: { backgroundColor: "#2E7D32", padding: 12, borderRadius: 8, marginBottom: 20 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingVertical: 8 },
  tableHeader: { backgroundColor: "#C8E6C9" },
  cell: { paddingHorizontal: 6, fontSize: 14 },
  headerCell: { fontWeight: "700" },
});
