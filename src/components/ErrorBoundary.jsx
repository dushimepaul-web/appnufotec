import { Ionicons } from '@expo/vector-icons';
import { Component, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../utils/theme';

function ErrorView({ error, retry }) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => s(palette), [palette]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="bug-outline" size={44} color={palette.red} />
        </View>
        <Text style={styles.title}>Oups ! Une erreur est survenue</Text>
        <Text style={styles.sub}>L’application a rencontré un problème. Veuillez réessayer.</Text>
        {error && (
          <Text style={styles.error} numberOfLines={3}>{error.toString()}</Text>
        )}
        {retry && (
          <TouchableOpacity onPress={retry} activeOpacity={0.8} style={styles.btn}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.btnText}>Réessayer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erreur capturée par ErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onRetry === 'function') this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorView error={this.state.error} retry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

const s = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  iconBox: { width: 88, height: 88, borderRadius: 44, backgroundColor: `${p.red}10`, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: typography.xl, fontWeight: '800', color: p.dark, textAlign: 'center' },
  sub: { fontSize: typography.base, color: p.greyDark, textAlign: 'center', lineHeight: 20 },
  error: { fontSize: typography.xs, color: p.grey, textAlign: 'center', marginTop: spacing.xs },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: p.green, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12, marginTop: spacing.md },
  btnText: { color: '#fff', fontSize: typography.md, fontWeight: '700' },
});
