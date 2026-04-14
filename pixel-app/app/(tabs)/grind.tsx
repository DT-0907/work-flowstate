import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
} from "react-native";
import { colors, fontSize, spacing } from "@/lib/theme";
import { shuffleQuotes, getGradientColors } from "@/lib/quotes";
import type { Quote } from "@/lib/quotes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITEM_HEIGHT = SCREEN_HEIGHT;

export default function GrindScreen() {
  const [shuffled] = useState<Quote[]>(() => shuffleQuotes());

  const renderItem = useCallback(
    ({ item, index }: { item: Quote; index: number }) => (
      <View style={styles.card}>
        <View style={[styles.cardBg, { backgroundColor: getGradientColors(index)[0] }]} />
        <View style={styles.cardContent}>
          <Text style={styles.quoteText}>{item.text}</Text>
          {item.author && (
            <Text style={styles.quoteAuthor}>— {item.author}</Text>
          )}
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.indexText}>
            {index + 1} / {shuffled.length}
          </Text>
        </View>
      </View>
    ),
    [shuffled.length]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={shuffled}
      renderItem={renderItem}
      keyExtractor={(_, i) => String(i)}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      getItemLayout={getItemLayout}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    height: ITEM_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxxl,
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  cardContent: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  quoteText: {
    fontSize: fontSize.xxl,
    color: colors.text,
    fontWeight: "300",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: 0.3,
  },
  quoteAuthor: {
    fontSize: fontSize.md,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "300",
    marginTop: spacing.xxl,
    fontStyle: "italic",
  },
  cardFooter: {
    position: "absolute",
    bottom: 100,
  },
  indexText: {
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 2,
  },
});
