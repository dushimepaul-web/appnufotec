// src/screens/ExploreScreen.js
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import Header from '../src/components/Header';
import MediaCard from '../src/components/MediaCard';
import { usePopular } from '../src/hooks/useMedias';
import { colors, spacing, typography } from '../src/utils/theme';

export default function ExploreScreen({ navigation }) {
  const { data: popular, loading } = usePopular();

  const handlePress = (item) => {
    navigation.navigate('Player', { id: item.id_media });
  };

  return (
    <View style={styles.root}>
      <Header navigation={navigation} title="Explorer" />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={popular}
          keyExtractor={(item) => String(item.id_media)}
          renderItem={({ item, index }) => (
            <View>
              {index === 0 && (
                <View style={styles.sectionHeader}>
                  <Ionicons name="flame" size={20} color={colors.accent} />
                  <Text style={styles.sectionTitle}>Tendances</Text>
                </View>
              )}
              <MediaCard item={item} onPress={handlePress} />
            </View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingTop: spacing.sm, paddingBottom: 80 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.lg,
    fontWeight: '700',
  },
});
