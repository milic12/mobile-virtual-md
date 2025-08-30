import { createImageMap } from "@/helpers";
import { router, Stack } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import specialistsData from "../../constants/specialists.json";
import { useSpecialist } from "../../contex/SpecialistContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 12;
const CARDS_PER_ROW = 2;
const CARD_WIDTH =
  (SCREEN_WIDTH - CARD_MARGIN * (CARDS_PER_ROW + 1)) / CARDS_PER_ROW;

const imageMap = createImageMap();

export default function Specialists() {
  const insets = useSafeAreaInsets();
  const specialists = Object.values(specialistsData.personas);
  const { setSelectedSpecialist } = useSpecialist();

  const getImageSource = (imagePath: string) => {
    if (!imagePath) return null;
    const imageName = imagePath.split("/").pop()?.replace(".png", "") || "";
    return imageMap[imageName] || null;
  };

  const renderSpecialistCard = (specialist: any) => {
    const firstLetter = specialist.name
      ? specialist.name.charAt(0).toUpperCase()
      : "?";
    const imageSource = getImageSource(specialist.image);

    return (
      <TouchableOpacity
        key={specialist.id}
        style={styles.card}
        onPress={() => {
          setSelectedSpecialist({
            id: specialist.id,
            name: specialist.name,
            specialty: specialist.specialty,
            bio: specialist.bio,
            voice: specialist.voice,
            image: specialist.image,
            gender: specialist.gender,
          });
          router.push("/chat");
        }}
      >
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.specialistImage}
              resizeMode="center"
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.specialistName} numberOfLines={2}>
            {specialist.name}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {specialist.specialty}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/chat")}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Specialists</Text>
            <View style={{ width: 60 }} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Choose from our {specialists.length} AI medical specialists
          </Text>

          <View style={styles.grid}>
            {specialists.map((specialist) => renderSpecialistCard(specialist))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 16,
    overflow: "hidden",
  },
  imageContainer: {
    height: 120,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  specialistImage: {
    width: "100%",
    height: "100%",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
  },
  cardContent: {
    padding: 16,
  },
  specialistName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
    lineHeight: 20,
  },
  specialty: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
    marginBottom: 10,
  },
  bio: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
});
