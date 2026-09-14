/**
 * SchemesListScreen — List of government welfare schemes connected to Scheme Agent API.
 * Features category filter chips, search bar, match score badges, and joint budget reasoning.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { AppHeader } from '../../components/AppHeader';
import { useTranslation } from '../../i18n';
import { schemeService, SchemeEligibilityItem, SchemeCategoryItem } from '../../services/schemeService';

const SchemesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useTranslation();

  const [categories, setCategories] = useState<SchemeCategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [schemes, setSchemes] = useState<SchemeEligibilityItem[]>([]);
  const [ineligibleSchemes, setIneligibleSchemes] = useState<SchemeEligibilityItem[]>([]);
  const [gigStatus, setGigStatus] = useState<string>('eligible');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [cats, result] = await Promise.all([
        schemeService.getCategories(),
        schemeService.filterSchemes({
          category: selectedCategory,
          query: searchQuery,
          language,
        }),
      ]);
      setCategories(cats);
      setSchemes(result.eligible_schemes || []);
      setIneligibleSchemes(result.ineligible_schemes || []);
      setGigStatus(result.gig_worker_status || 'eligible');
    } catch (err) {
      console.error('Error fetching schemes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, searchQuery, language]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={t.nav.schemes} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <Text style={styles.mainTitle}>{t.schemes.title}</Text>
          <Text style={styles.subtitle}>{t.details.subtitle}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t.schemes?.title || 'Search schemes, insurance, loan...'}
            placeholderTextColor={Colors.textWarmGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadData}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsContainer}
        >
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryChipText, selectedCategory === 'all' && styles.categoryChipTextActive]}>
              All Schemes
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Indicator */}
        <View style={styles.gigStatusBanner}>
          <Text style={styles.gigStatusIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.gigStatusTitle}>
              Code on Social Security 2020: {gigStatus === 'eligible' ? 'Qualified Gig Worker' : 'Registration Open'}
            </Text>
            <Text style={styles.gigStatusSubtitle}>
              Curated primary knowledge base verified for active gig platform delivery partners.
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Finding personalized schemes...</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {/* Eligible Schemes List */}
            <Text style={styles.sectionHeading}>
              Eligible Welfare Schemes ({schemes.length})
            </Text>

            {schemes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No matching eligible schemes found.</Text>
              </View>
            ) : (
              schemes.map((s) => (
                <TouchableOpacity
                  key={s.scheme_code}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('SchemeDetail', {
                      schemeId: s.scheme_code,
                      schemeName: s.scheme_name,
                    })
                  }
                  activeOpacity={0.85}
                >
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                      <Text style={styles.categoryLabel}>
                        {s.category?.toUpperCase().replace('_', ' ')}
                      </Text>
                      <Text style={styles.schemeName} numberOfLines={2}>
                        {s.scheme_name}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, styles.badgeEligible]}>
                      <Text style={[styles.statusText, styles.textEligible]}>
                        {s.match_score_pct}% Match
                      </Text>
                    </View>
                  </View>

                  {/* Criteria / Reasons snippet */}
                  {s.reasons && s.reasons.length > 0 && (
                    <View style={styles.reasonsList}>
                      {s.reasons.slice(0, 2).map((r, i) => (
                        <Text key={i} style={styles.reasonText} numberOfLines={1}>
                          {r}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Affordability Note */}
                  {s.affordability_reasoning && (
                    <View style={styles.budgetChip}>
                      <Text style={styles.budgetChipText}>
                        💡 {s.affordability_reasoning}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.verifiedRow}>
                      <Text style={styles.verifiedIcon}>✓</Text>
                      <Text style={styles.verifiedText}>
                        {s.data_freshness || 'Verified Primary Source'}
                      </Text>
                    </View>
                    <Text style={styles.arrowIcon}>→</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Ineligible Schemes Section */}
            {ineligibleSchemes.length > 0 && (
              <>
                <Text style={[styles.sectionHeading, { marginTop: Spacing.lg, color: Colors.textWarmGray }]}>
                  Other Available Schemes ({ineligibleSchemes.length})
                </Text>

                {ineligibleSchemes.map((s) => (
                  <TouchableOpacity
                    key={s.scheme_code}
                    style={[styles.card, styles.cardIneligible]}
                    onPress={() =>
                      navigation.navigate('SchemeDetail', {
                        schemeId: s.scheme_code,
                        schemeName: s.scheme_name,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1, paddingRight: Spacing.sm }}>
                        <Text style={styles.categoryLabel}>
                          {s.category?.toUpperCase().replace('_', ' ')}
                        </Text>
                        <Text style={[styles.schemeName, { color: Colors.textWarmGray }]} numberOfLines={2}>
                          {s.scheme_name}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, styles.badgeNotEligible]}>
                        <Text style={[styles.statusText, styles.textNotEligible]}>
                          {s.match_score_pct}% Match
                        </Text>
                      </View>
                    </View>

                    {s.reasons && s.reasons.length > 0 && (
                      <View style={styles.reasonsList}>
                        {s.reasons.slice(0, 2).map((r, i) => (
                          <Text key={i} style={[styles.reasonText, { color: Colors.textWarmGray }]} numberOfLines={1}>
                            {r}
                          </Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.backgroundOffWhite },
  container: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl },
  headerBlock: { gap: 2, marginBottom: Spacing.xs },
  mainTitle: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  subtitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.textWarmGray,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '40',
    paddingHorizontal: Spacing.md,
    height: 46,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  clearIcon: { fontSize: 16, color: Colors.textWarmGray, padding: 4 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
    paddingVertical: 0,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  categoryChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '40',
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  categoryChipTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  gigStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF3FE',
    borderWidth: 1,
    borderColor: '#C2DBFE',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  gigStatusIcon: { fontSize: 20 },
  gigStatusTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  gigStatusSubtitle: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textWarmGray,
  },
  list: { gap: Spacing.md },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.outlineVariant + '30',
    borderLeftWidth: 4,
    borderLeftColor: '#1E824C',
  },
  cardIneligible: {
    borderLeftColor: Colors.outlineVariant,
    opacity: 0.85,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  schemeName: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeEligible: {
    backgroundColor: '#E8F8EE',
  },
  badgeNotEligible: {
    backgroundColor: '#F3EFEF',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textEligible: { color: '#1E824C' },
  textNotEligible: { color: Colors.textWarmGray },
  reasonsList: {
    gap: 3,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  budgetChip: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  budgetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant + '20',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedIcon: {
    fontSize: 12,
    color: '#1E824C',
    fontWeight: '700',
  },
  verifiedText: {
    fontSize: 11,
    color: Colors.textWarmGray,
  },
  arrowIcon: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textWarmGray,
  },
});

export default SchemesListScreen;
