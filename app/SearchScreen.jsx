import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useMemo } from 'react';
import {
  ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MediaCard from '../src/components/MediaCard';
import { useSettings } from '../src/contexts/SettingsContext';
import { useSearch } from '../src/hooks/useMedias';
import { radius, spacing, typography } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';

export default function SearchScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => cs(palette), [palette]);
  const insets = useSafeAreaInsets();
  const s = useSettings().search;
  const { results, loading, query, search } = useSearch();
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={palette.dark} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={palette.grey} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={s.placeholder}
            placeholderTextColor={palette.grey}
            onChangeText={search}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.green} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id_media)}
          renderItem={({ item }) => (
            <MediaCard
              item={item}
              onPress={(i) => router.push({ pathname: '/PlayerScreen', params: { id: i.id_media } })}
            />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      ) : query.length >= 2 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search-outline" size={36} color={palette.grey} />
          </View>
          <Text style={styles.noResult}>Aucun résultat pour</Text>
          <Text style={styles.noResultQuery}>« {query} »</Text>
        </View>
      ) : (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="search" size={36} color={palette.greyLight} />
          </View>
          <Text style={styles.hint}>{s.hint || 'Tapez pour chercher…'}</Text>
        </View>
      )}
    </View>
  );
}

const cs = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: p.greyLight,
  },
  backBtn: { padding: 4 },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: p.whiteOff, borderRadius: radius.full,
    paddingHorizontal: spacing.md, height: 42,
    borderWidth: 1, borderColor: p.greyLight,
  },
  input: { flex: 1, color: p.dark, fontSize: typography.base },
  list: { paddingTop: spacing.sm, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: p.whiteOff, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: p.greyLight, marginBottom: spacing.sm },
  noResult: { color: p.grey, fontSize: 15 },
  noResultQuery: { color: p.dark, fontSize: typography.base, fontWeight: '600' },
  hint: { color: p.grey, fontSize: 15 },
});
