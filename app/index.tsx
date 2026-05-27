// app/index.jsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNav from '../src/components/BottomNav';
import { radius, spacing, typography } from '../src/utils/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const actionCards = [
    {
      title: 'MÉDIAS',
      description: 'Accédez à nos vidéos, audios, PDF et articles',
      icon: 'play-circle',
      gradient: ['#4CAF50', '#2E7D32'],
      route: '/medias',
    },
    {
      title: 'CONSULTATION',
      description: 'Réservez une consultation avec nos experts',
      icon: 'calendar',
      gradient: ['#FF9800', '#E65100'],
      route: '/consultation',
    },
    {
      title: 'PRODUITS',
      description: 'Découvrez nos produits naturels',
      icon: 'leaf',
      gradient: ['#4CAF50', '#FF9800'],
      route: '/produits',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section */}
          <LinearGradient
            colors={['#FFFFFF', '#F5F5F5']}
            style={styles.hero}
          >
            {/* Espace entre le haut et le logo */}
            <View style={styles.topSpacer} />
            
            <View style={styles.headerRow}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../assets/logo.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              {/* Espace entre le logo et le texte */}
              <View style={styles.logoTextSpacer} />
              <Text style={styles.logoText}>
                NUFOTEC <Text style={styles.logoTextBold}>BURUNDI</Text>
              </Text>
            </View>
            
            <Text style={styles.tagline}>Connaître • Agir • Transformer</Text>
            
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>Bienvenu sur NUFOTEC BURUNDI</Text>
              <Text style={styles.welcomeText}>
                Votre plateforme d'information, de conseils et de solutions naturelles.
              </Text>
              <TouchableOpacity style={styles.learnMoreBtn}>
                <Text style={styles.learnMoreText}>En savoir plus</Text>
                <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* 3 boutons sur la même ligne */}
          <View style={styles.actionsRow}>
            {actionCards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCardSmall}
                onPress={() => router.push(card.route)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={card.gradient}
                  style={styles.actionCardGradientSmall}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.actionIconSmall}>
                    <Ionicons name={card.icon} size={28} color="white" />
                  </View>
                  <Text style={styles.actionTitleSmall}>{card.title}</Text>
                  <Text style={styles.actionDescriptionSmall} numberOfLines={2}>
                    {card.description}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Barre de navigation en bas */}
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  topSpacer: {
    height: 60, // Espace en haut avant le logo
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  logoTextSpacer: {
    width: 5, // Espace entre le logo et le texte
  },
  logoText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#4CAF50',
  },
  logoTextBold: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  tagline: {
    fontSize: typography.sm,
    color: '#666666',
    textAlign: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md, // Ajout d'espace au-dessus du tagline
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: typography.lg,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: typography.sm,
    color: '#666666',
    lineHeight: 20,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  learnMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  learnMoreText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  actionCardSmall: {
    flex: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  actionCardGradientSmall: {
    padding: spacing.sm,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
  },
  actionIconSmall: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitleSmall: {
    color: 'white',
    fontSize: typography.sm,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDescriptionSmall: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.xs,
    textAlign: 'center',
  },
});