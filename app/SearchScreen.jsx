// app/SearchScreen.jsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MediaCard from '../src/components/MediaCard';
import { useSearch } from '../src/hooks/useMedias';
import { colors, radius, spacing, typography } from '../src/utils/theme';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { results, loading, query, search } = useSearch();
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Barre de recherche */}
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Rechercher des médias..."
            placeholderTextColor={colors.textMuted}
            onChangeText={search}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Résultats */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id_media)}
          renderItem={({ item }) => (
            <MediaCard
              item={item}
              onPress={(i) =>
                router.push({ pathname: '/PlayerScreen', params: { id: i.id_media } })
              }
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      ) : query.length >= 2 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={52} color={colors.textMuted} />
          <Text style={styles.noResult}>Aucun résultat pour « {query} »</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <Ionicons name="search" size={52} color={colors.border} />
          <Text style={styles.hint}>Tapez pour chercher…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: { padding: 4 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.base,
  },
  list: { paddingTop: spacing.sm, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  noResult: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 15 },
});
