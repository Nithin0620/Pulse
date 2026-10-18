import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { OverpassService } from '../services/overpassService';
import { NearbyPlace } from '../types';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type FilterType = 'all' | 'hospital' | 'clinic' | 'pharmacy';

export const NearbyCareScreen: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number }>({
    lat: 28.6139,
    lon: 77.209,
  }); // Default New Delhi coordinates
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        let currentLat = 28.6139;
        let currentLon = 77.209;

        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          currentLat = loc.coords.latitude;
          currentLon = loc.coords.longitude;
          setLocation({ lat: currentLat, lon: currentLon });
        }

        const nearby = await OverpassService.fetchNearbyMedicalFacilities(currentLat, currentLon, 5000);
        setPlaces(nearby);
      } catch (e) {
        console.warn('Location / Overpass error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredPlaces = places.filter((p) => {
    if (filter === 'all') return true;
    return p.type === filter;
  });

  const getMarkerColor = (type: string) => {
    if (type === 'hospital') return '#EF4444';
    if (type === 'pharmacy') return '#10B981';
    return '#0D9488';
  };

  const openDirections = (lat: number, lon: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    Linking.openURL(url).catch(console.warn);
  };

  const callPlace = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(console.warn);
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: location.lat,
            longitude: location.lon,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
        >
          {filteredPlaces.map((p) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.lat, longitude: p.lon }}
              title={p.name}
              description={`${p.type.toUpperCase()} • ${p.distanceKm} km`}
              pinColor={getMarkerColor(p.type)}
              onPress={() => setSelectedPlace(p)}
            />
          ))}
        </MapView>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {(['all', 'hospital', 'clinic', 'pharmacy'] as FilterType[]).map((f) => {
          const active = filter === f;
          const label =
            f === 'all'
              ? 'All Services'
              : f === 'hospital'
              ? 'Hospitals'
              : f === 'clinic'
              ? 'Clinics'
              : 'Pharmacies';
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Places List Sheet */}
      <ScrollView style={styles.listSheet} contentContainerStyle={styles.listContent}>
        <Text style={styles.listTitle}>
          Nearby Facilities ({filteredPlaces.length})
        </Text>

        {loading ? (
          <ActivityIndicator color="#0D9488" style={{ marginTop: 20 }} />
        ) : filteredPlaces.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No medical centers found nearby.</Text>
          </View>
        ) : (
          filteredPlaces.map((place) => (
            <View key={place.id} style={styles.placeCard}>
              <View style={styles.placeLeft}>
                <View
                  style={[
                    styles.typeDot,
                    { backgroundColor: getMarkerColor(place.type) },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeAddress}>{place.address}</Text>
                  <Text style={styles.placeDist}>
                    {place.distanceKm} km away • {place.type.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                {Boolean(place.phone) && (
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => callPlace(place.phone)}
                  >
                    <Ionicons name="call" size={16} color="#10B981" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => openDirections(place.lat, place.lon)}
                >
                  <Ionicons name="navigate" size={16} color="#0D9488" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.38,
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#0B132B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  filterBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listSheet: {
    flex: 1,
    backgroundColor: '#030712',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  listTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
  },
  placeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  placeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  placeName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  placeAddress: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  placeDist: {
    color: '#0D9488',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
